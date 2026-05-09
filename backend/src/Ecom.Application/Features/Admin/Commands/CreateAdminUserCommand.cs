using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserRoleEnum = Ecom.Domain.Enums.UserRole;


namespace Ecom.Application.Features.Admin.Commands;

public record CreateAdminUserCommand(
    string Name,
    string Surname,
    string Email,
    string Password,
    string Role
) : IRequest<Result<Guid>>;

public class CreateAdminUserValidator : AbstractValidator<CreateAdminUserCommand>
{
    public CreateAdminUserValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Surname).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
        RuleFor(x => x.Role).NotEmpty();
    }
}

public class CreateAdminUserHandler(IApplicationDbContext db, IPasswordService passwordService)
    : IRequestHandler<CreateAdminUserCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateAdminUserCommand request, CancellationToken cancellationToken)
    {
        var exists = await db.Users.AnyAsync(u => u.Email == request.Email, cancellationToken);
        if (exists) return Result<Guid>.Failure("Bu e-posta adresi zaten kayıtlı.");

        if (!Enum.TryParse<UserRoleEnum>(request.Role, ignoreCase: true, out var role))
            return Result<Guid>.Failure("Geçersiz rol.");

        var user = new User
        {
            Name = request.Name,
            Surname = request.Surname,
            Email = request.Email,
            PasswordHash = passwordService.Hash(request.Password),
            IsActive = true,
            EmailConfirmed = true,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        db.UserRoles.Add(new UserRole { UserId = user.Id, Role = role });
        await db.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(user.Id);
    }
}
