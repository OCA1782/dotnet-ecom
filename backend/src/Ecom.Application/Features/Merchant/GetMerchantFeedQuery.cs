using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Merchant;

public record MerchantProductDto(
    string Id,
    string Title,
    string? Description,
    string Link,
    string? ImageLink,
    string Availability,
    string Price,
    string? SalePrice,
    string? Brand,
    string Condition,
    string? Gtin,
    string? Mpn,
    string? GoogleProductCategory
);

public record GetMerchantFeedQuery(string SiteUrl, int Limit = 100_000)
    : IRequest<List<MerchantProductDto>>;

public class GetMerchantFeedHandler(IApplicationDbContext db)
    : IRequestHandler<GetMerchantFeedQuery, List<MerchantProductDto>>
{
    public async Task<List<MerchantProductDto>> Handle(
        GetMerchantFeedQuery request, CancellationToken cancellationToken)
    {
        var siteUrl = request.SiteUrl.TrimEnd('/');

        var products = await db.Products
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.IsActive && p.IsPublished)
            .OrderByDescending(p => p.CreatedDate)
            .Take(request.Limit)
            .Select(p => new MerchantProductDto(
                p.SKU ?? p.Id.ToString(),
                p.Name,
                p.ShortDescription ?? p.Description,
                $"{siteUrl}/urun/{p.Slug}",
                db.ProductImages
                    .Where(i => i.ProductId == p.Id && i.IsMain && !i.IsDeleted)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault() ??
                db.ProductImages
                    .Where(i => i.ProductId == p.Id && !i.IsDeleted)
                    .OrderBy(i => i.SortOrder)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault(),
                (db.Stocks
                    .Where(s => s.ProductId == p.Id && !s.IsDeleted)
                    .Select(s => (int?)(s.Quantity - s.ReservedQuantity))
                    .FirstOrDefault() ?? 0) > 0
                    ? "in stock"
                    : "out of stock",
                $"{p.Price.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)} {p.Currency}",
                p.DiscountPrice.HasValue
                    ? $"{p.DiscountPrice.Value.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)} {p.Currency}"
                    : null,
                db.Brands
                    .Where(b => b.Id == p.BrandId && !b.IsDeleted)
                    .Select(b => b.Name)
                    .FirstOrDefault(),
                "new",
                p.Barcode,
                p.SKU,
                db.Categories
                    .Where(c => c.Id == p.CategoryId && !c.IsDeleted)
                    .Select(c => c.Name)
                    .FirstOrDefault()
            ))
            .ToListAsync(cancellationToken);

        return products
            .Select(p => p.Id.Length > 50 ? p with { Id = p.Id[..50] } : p)
            .ToList();
    }
}
