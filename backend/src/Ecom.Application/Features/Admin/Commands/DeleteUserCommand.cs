using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record DeleteUserCommand(Guid UserId) : IRequest<Result>;

public class DeleteUserHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IAuditService auditService
) : IRequestHandler<DeleteUserCommand, Result>
{
    public async Task<Result> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId == request.UserId)
            return Result.Failure("Kendi hesabınızı silemezsiniz.");

        var user = await db.Users
            .Include(u => u.Roles)
            .Include(u => u.Addresses)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null) return Result.Failure("Kullanıcı bulunamadı.");

        var summary = $"{user.Name} {user.Surname} <{user.Email}>";

        db.UserRoles.RemoveRange(user.Roles);
        db.UserAddresses.RemoveRange(user.Addresses);
        db.Users.Remove(user);
        await db.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync("DeleteUser", "User", request.UserId.ToString(),
            oldValue: summary, userId: currentUser.UserId, cancellationToken: cancellationToken);

        return Result.Success();
    }
}
