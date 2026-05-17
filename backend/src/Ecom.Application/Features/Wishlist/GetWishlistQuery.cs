using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Wishlist;

public record WishlistItemDto(
    Guid Id,
    Guid ProductId,
    string Name,
    string Slug,
    decimal Price,
    decimal? DiscountPrice,
    string? ImageUrl,
    bool IsActive
);

public record GetWishlistQuery(Guid UserId) : IRequest<IEnumerable<WishlistItemDto>>;

public class GetWishlistHandler(IApplicationDbContext db)
    : IRequestHandler<GetWishlistQuery, IEnumerable<WishlistItemDto>>
{
    public async Task<IEnumerable<WishlistItemDto>> Handle(GetWishlistQuery request, CancellationToken cancellationToken)
    {
        return await db.WishlistItems
            .Where(w => w.UserId == request.UserId && !w.IsDeleted)
            .Include(w => w.Product).ThenInclude(p => p.Images)
            .OrderByDescending(w => w.CreatedDate)
            .Select(w => new WishlistItemDto(
                w.Id,
                w.ProductId,
                w.Product.Name,
                w.Product.Slug,
                w.Product.Price,
                w.Product.DiscountPrice,
                w.Product.Images.Where(i => i.IsMain).Select(i => i.ImageUrl).FirstOrDefault(),
                w.Product.IsActive
            ))
            .ToListAsync(cancellationToken);
    }
}
