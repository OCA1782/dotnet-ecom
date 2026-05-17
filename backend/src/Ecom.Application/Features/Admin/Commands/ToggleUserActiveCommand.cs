using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record ToggleUserActiveCommand(Guid UserId, bool IsActive) : IRequest<Result>;

public class ToggleUserActiveHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IAuditService auditService
) : IRequestHandler<ToggleUserActiveCommand, Result>
{
    public async Task<Result> Handle(ToggleUserActiveCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user is null) return Result.Failure("Kullanıcı bulunamadı.");

        user.IsActive = request.IsActive;
        await db.SaveChangesAsync(cancellationToken);

        var action = request.IsActive ? "ActivateUser" : "DeactivateUser";
        await auditService.LogAsync(action, "User", request.UserId.ToString(),
            oldValue: (!request.IsActive).ToString(), newValue: request.IsActive.ToString(),
            userId: currentUser.UserId, cancellationToken: cancellationToken);

        return Result.Success();
    }
}
