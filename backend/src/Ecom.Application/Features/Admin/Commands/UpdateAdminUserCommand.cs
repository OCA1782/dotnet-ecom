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
    string Role,
    string? Email = null,
    string? PhoneNumber = null
) : IRequest<Result<bool>>;

public class UpdateAdminUserHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IAuditService auditService
) : IRequestHandler<UpdateAdminUserCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdateAdminUserCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);
        if (user is null) return Result<bool>.Failure("Kullanıcı bulunamadı.");

        if (!Enum.TryParse<UserRoleEnum>(request.Role, ignoreCase: true, out var role))
            return Result<bool>.Failure("Geçersiz rol.");

        if (!string.IsNullOrWhiteSpace(request.Email) && request.Email != user.Email)
        {
            var emailTaken = await db.Users.AnyAsync(u => u.Email == request.Email && u.Id != request.Id, cancellationToken);
            if (emailTaken) return Result<bool>.Failure("Bu e-posta adresi zaten kullanılıyor.");
        }

        var changes = new List<string>();
        if (user.Name != request.Name || user.Surname != request.Surname)
            changes.Add($"Ad: {user.Name} {user.Surname} → {request.Name} {request.Surname}");
        if (!string.IsNullOrWhiteSpace(request.Email) && request.Email != user.Email)
            changes.Add($"E-posta: {user.Email} → {request.Email}");
        if (request.PhoneNumber is not null && request.PhoneNumber != user.PhoneNumber)
            changes.Add($"Telefon: {user.PhoneNumber ?? "—"} → {(string.IsNullOrWhiteSpace(request.PhoneNumber) ? "—" : request.PhoneNumber)}");

        user.Name = request.Name;
        user.Surname = request.Surname;
        if (!string.IsNullOrWhiteSpace(request.Email))
            user.Email = request.Email;
        if (request.PhoneNumber is not null)
            user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber;

        var existingRoles = await db.UserRoles
            .Where(r => r.UserId == request.Id)
            .ToListAsync(cancellationToken);

        var currentRoleName = existingRoles.Select(r => r.Role.ToString()).FirstOrDefault() ?? "—";
        if (currentRoleName != request.Role) changes.Add($"Rol: {currentRoleName} → {request.Role}");

        db.UserRoles.RemoveRange(existingRoles);
        db.UserRoles.Add(new UserRole { UserId = request.Id, Role = role });

        await db.SaveChangesAsync(cancellationToken);

        var detail = changes.Count > 0 ? string.Join(" | ", changes) : null;
        await auditService.LogAsync("UpdateUser", "Kullanıcı", request.Id.ToString(),
            oldValue: null,
            newValue: detail,
            userId: currentUser.UserId, cancellationToken: cancellationToken);

        return Result<bool>.Success(true);
    }
}
