using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Wishlist;

public record RemoveFromWishlistCommand(Guid UserId, Guid ProductId) : IRequest<Result>;

public class RemoveFromWishlistHandler(IApplicationDbContext db)
    : IRequestHandler<RemoveFromWishlistCommand, Result>
{
    public async Task<Result> Handle(RemoveFromWishlistCommand request, CancellationToken cancellationToken)
    {
        var item = await db.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == request.UserId && w.ProductId == request.ProductId && !w.IsDeleted, cancellationToken);
        if (item is null) return Result.Success();

        item.IsDeleted = true;
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
