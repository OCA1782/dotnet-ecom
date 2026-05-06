using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<Result<LoginResult>>;

public record LoginResult(Guid UserId, string Name, string Surname, string Email, string Token, IEnumerable<string> Roles);

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginCommandHandler(
    IApplicationDbContext db,
    IPasswordService passwordService,
    IJwtService jwtService,
    IAuditService auditService
) : IRequestHandler<LoginCommand, Result<LoginResult>>
{
    public async Task<Result<LoginResult>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant(), cancellationToken);

        if (user is null || !passwordService.Verify(request.Password, user.PasswordHash))
            return Result<LoginResult>.Failure("E-posta veya şifre hatalı.");

        if (!user.IsActive)
            return Result<LoginResult>.Failure("Hesabınız pasif durumda. Lütfen destek ile iletişime geçin.");

        user.LastLoginDate = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var roles = user.Roles.Select(r => r.Role.ToString()).ToList();
        await auditService.LogAsync("Login", "User", user.Id.ToString(), userId: user.Id, cancellationToken: cancellationToken);

        var token = jwtService.GenerateToken(user, roles);
        return Result<LoginResult>.Success(new LoginResult(user.Id, user.Name, user.Surname, user.Email, token, roles));
    }
}
