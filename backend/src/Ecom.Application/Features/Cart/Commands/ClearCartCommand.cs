using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Cart.Commands;

public record ClearCartCommand(Guid? UserId, string? SessionId) : IRequest<Result>;

public class ClearCartHandler(IApplicationDbContext db) : IRequestHandler<ClearCartCommand, Result>
{
    public async Task<Result> Handle(ClearCartCommand request, CancellationToken cancellationToken)
    {
        var cart = await db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c =>
                (request.UserId.HasValue && c.UserId == request.UserId) ||
                (!request.UserId.HasValue && c.SessionId == request.SessionId),
                cancellationToken);

        if (cart is null) return Result.Success();

        db.CartItems.RemoveRange(cart.Items);
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
