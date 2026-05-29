using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Application.Features.Cart.Queries;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Coupons.Commands;

public record RemoveCouponCommand(Guid? UserId, string? SessionId) : IRequest<Result>;

public class RemoveCouponHandler(IApplicationDbContext db, ICacheService cache) : IRequestHandler<RemoveCouponCommand, Result>
{
    public async Task<Result> Handle(RemoveCouponCommand request, CancellationToken cancellationToken)
    {
        var cart = await db.Carts.FirstOrDefaultAsync(c =>
            (request.UserId.HasValue && c.UserId == request.UserId) ||
            (!request.UserId.HasValue && c.SessionId == request.SessionId),
            cancellationToken);

        if (cart is null) return Result.Success();

        cart.CouponCode = null;
        await db.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(GetCartQueryHandler.CacheKey(request.UserId, request.SessionId), cancellationToken);
        return Result.Success();
    }
}
