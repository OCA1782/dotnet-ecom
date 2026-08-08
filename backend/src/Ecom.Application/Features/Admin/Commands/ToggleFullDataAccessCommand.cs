using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record ToggleFullDataAccessCommand(Guid UserId, bool Grant) : IRequest<Result>;

public class ToggleFullDataAccessHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<ToggleFullDataAccessCommand, Result>
{
    public async Task<Result> Handle(ToggleFullDataAccessCommand request, CancellationToken ct)
    {
        if (!currentUser.IsSuperAdmin)
            return Result.Failure("Bu işlem yalnızca Süper Admin tarafından yapılabilir.");

        var user = await db.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct);

        if (user is null) return Result.Failure("Kullanıcı bulunamadı.");

        var hasAdminRole = user.Roles.Any(r => r.Role != Domain.Enums.UserRole.Customer);
        if (!hasAdminRole)
            return Result.Failure("Tam veri erişimi yalnızca admin paneli kullanıcılarına verilebilir.");

        user.HasFullDataAccess = request.Grant;
        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
