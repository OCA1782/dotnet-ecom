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
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null) return Result.Failure("Kullanıcı bulunamadı.");

        var summary = $"{user.Name} {user.Surname} <{user.Email}>";

        user.IsDeleted = true;
        user.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync("DeleteUser", "Kullanıcı", request.UserId.ToString(),
            oldValue: summary, userId: currentUser.UserId, cancellationToken: cancellationToken);

        return Result.Success();
    }
}
