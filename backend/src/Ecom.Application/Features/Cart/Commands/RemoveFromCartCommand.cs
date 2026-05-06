using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Cart.Commands;

public record RemoveFromCartCommand(Guid CartItemId, Guid? UserId, string? SessionId) : IRequest<Result>;

public class RemoveFromCartHandler(IApplicationDbContext db) : IRequestHandler<RemoveFromCartCommand, Result>
{
    public async Task<Result> Handle(RemoveFromCartCommand request, CancellationToken cancellationToken)
    {
        var item = await db.CartItems
            .Include(i => i.Cart)
            .FirstOrDefaultAsync(i => i.Id == request.CartItemId, cancellationToken);

        if (item is null) return Result.Failure("Sepet kalemi bulunamadı.");

        if (request.UserId.HasValue && item.Cart.UserId != request.UserId)
            return Result.Failure("Yetkisiz işlem.");
        if (!request.UserId.HasValue && item.Cart.SessionId != request.SessionId)
            return Result.Failure("Yetkisiz işlem.");

        db.CartItems.Remove(item);
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
