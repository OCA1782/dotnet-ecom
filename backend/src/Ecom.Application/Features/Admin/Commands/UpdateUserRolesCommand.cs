using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserRoleEnum = Ecom.Domain.Enums.UserRole;

namespace Ecom.Application.Features.Admin.Commands;

public record UpdateUserRolesCommand(Guid UserId, IEnumerable<string> Roles) : IRequest<Result>;

public class UpdateUserRolesHandler(IApplicationDbContext db) : IRequestHandler<UpdateUserRolesCommand, Result>
{
    public async Task<Result> Handle(UpdateUserRolesCommand request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct);
        if (user == null) return Result.Failure("Kullanıcı bulunamadı.");

        var validRoles = new List<UserRoleEnum>();
        foreach (var roleName in request.Roles)
        {
            if (Enum.TryParse<UserRoleEnum>(roleName, true, out var role))
                validRoles.Add(role);
        }

        // Must have at least one role
        if (validRoles.Count == 0)
            return Result.Failure("En az bir rol seçilmelidir.");

        // Remove all existing roles
        var existingRoles = await db.UserRoles.Where(r => r.UserId == request.UserId).ToListAsync(ct);
        foreach (var r in existingRoles)
            db.UserRoles.Remove(r);

        // Add new roles
        foreach (var role in validRoles)
        {
            db.UserRoles.Add(new Domain.Entities.UserRole
            {
                UserId = request.UserId,
                Role = role,
            });
        }

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
