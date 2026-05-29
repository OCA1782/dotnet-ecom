using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Cart.Queries;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Cart.Commands;

public record ToggleCartItemSelectionCommand(Guid CartItemId, bool IsSelected) : IRequest<Unit>;

public class ToggleCartItemSelectionHandler(IApplicationDbContext db, ICacheService cache)
    : IRequestHandler<ToggleCartItemSelectionCommand, Unit>
{
    public async Task<Unit> Handle(ToggleCartItemSelectionCommand request, CancellationToken cancellationToken)
    {
        var item = await db.CartItems
            .Include(i => i.Cart)
            .FirstOrDefaultAsync(i => i.Id == request.CartItemId, cancellationToken);
        if (item is null) return Unit.Value;

        item.IsSelected = request.IsSelected;
        await db.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(GetCartQueryHandler.CacheKey(item.Cart.UserId, item.Cart.SessionId), cancellationToken);
        return Unit.Value;
    }
}
