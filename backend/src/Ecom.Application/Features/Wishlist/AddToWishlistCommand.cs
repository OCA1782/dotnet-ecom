using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Wishlist;

public record AddToWishlistCommand(Guid UserId, Guid ProductId) : IRequest<Result<Guid>>;

public class AddToWishlistHandler(IApplicationDbContext db)
    : IRequestHandler<AddToWishlistCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddToWishlistCommand request, CancellationToken cancellationToken)
    {
        var existing = await db.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == request.UserId && w.ProductId == request.ProductId && !w.IsDeleted, cancellationToken);
        if (existing is not null) return Result<Guid>.Success(existing.Id);

        var product = await db.Products.FindAsync([request.ProductId], cancellationToken);
        if (product is null || !product.IsActive) return Result<Guid>.Failure("Ürün bulunamadı.");

        var item = new WishlistItem { UserId = request.UserId, ProductId = request.ProductId };
        db.WishlistItems.Add(item);
        await db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(item.Id);
    }
}
