using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record ToggleUserActiveCommand(Guid UserId, bool IsActive) : IRequest<Result>;

public class ToggleUserActiveHandler(IApplicationDbContext db) : IRequestHandler<ToggleUserActiveCommand, Result>
{
    public async Task<Result> Handle(ToggleUserActiveCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user is null) return Result.Failure("Kullanıcı bulunamadı.");
        user.IsActive = request.IsActive;
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
