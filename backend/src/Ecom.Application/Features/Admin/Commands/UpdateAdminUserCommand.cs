using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserRoleEnum = Ecom.Domain.Enums.UserRole;

namespace Ecom.Application.Features.Admin.Commands;

public record UpdateAdminUserCommand(
    Guid Id,
    string Name,
    string Surname,
    string Role
) : IRequest<Result<bool>>;

public class UpdateAdminUserHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateAdminUserCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdateAdminUserCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);
        if (user is null) return Result<bool>.Failure("Kullanıcı bulunamadı.");

        if (!Enum.TryParse<UserRoleEnum>(request.Role, ignoreCase: true, out var role))
            return Result<bool>.Failure("Geçersiz rol.");

        user.Name = request.Name;
        user.Surname = request.Surname;

        var existingRoles = await db.UserRoles
            .Where(r => r.UserId == request.Id)
            .ToListAsync(cancellationToken);

        db.UserRoles.RemoveRange(existingRoles);
        db.UserRoles.Add(new UserRole { UserId = request.Id, Role = role });

        await db.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
