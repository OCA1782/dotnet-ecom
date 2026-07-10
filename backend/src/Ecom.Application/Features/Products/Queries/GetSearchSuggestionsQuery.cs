using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Queries;

public record GetSearchSuggestionsQuery(string Q, int Limit = 8) : IRequest<SearchSuggestionsDto>;

public record SearchSuggestionItem(
    string Type,      // product | brand | category
    string Name,
    string Slug,
    string? ImageUrl,
    decimal? Price,
    string? SubText   // marka adı (ürünler için)
);

public record SearchSuggestionsDto(
    List<SearchSuggestionItem> Items,
    int TotalProducts
);

public class GetSearchSuggestionsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetSearchSuggestionsQuery, SearchSuggestionsDto>
{
    public async Task<SearchSuggestionsDto> Handle(GetSearchSuggestionsQuery request, CancellationToken cancellationToken)
    {
        var q = request.Q.Trim();
        var items = new List<SearchSuggestionItem>();

        var likePat = $"%{q}%";

        // Kategoriler (max 2)
        var categories = await db.Categories
            .Where(c => !c.IsDeleted && EF.Functions.ILike(c.Name, likePat))
            .OrderBy(c => c.Name)
            .Take(2)
            .Select(c => new { c.Name, c.Slug, c.Icon })
            .ToListAsync(cancellationToken);

        items.AddRange(categories.Select(c => new SearchSuggestionItem(
            "category", c.Name, $"/urunler?kategori={c.Slug}", c.Icon, null, null)));

        // Markalar (max 2)
        var brands = await db.Brands
            .Where(b => !b.IsDeleted && EF.Functions.ILike(b.Name, likePat))
            .OrderBy(b => b.Name)
            .Take(2)
            .Select(b => new { b.Name, b.Slug, b.Icon })
            .ToListAsync(cancellationToken);

        items.AddRange(brands.Select(b => new SearchSuggestionItem(
            "brand", b.Name, $"/urunler?marka={b.Slug}", b.Icon, null, null)));

        // Ürünler — kalan slot
        int productLimit = Math.Max(request.Limit - items.Count, 3);

        // Pre-fetch brand IDs to avoid hash join in the main Products query
        var matchingBrandIds = brands.Select(b => b.Slug).ToList(); // reuse brand results
        var matchingBrandGuids = await db.Brands
            .AsNoTracking()
            .Where(b => !b.IsDeleted && EF.Functions.ILike(b.Name, likePat))
            .Select(b => b.Id)
            .ToListAsync(cancellationToken);

        var products = await db.Products
            .AsNoTracking()
            .Include(p => p.Images.Where(i => i.IsMain))
            .Where(p => !p.IsDeleted && p.IsActive && p.IsPublished
                && (EF.Functions.ILike(p.Name, likePat)
                    || (p.SKU != null && EF.Functions.ILike(p.SKU, likePat))
                    || (matchingBrandGuids.Count > 0 && p.BrandId.HasValue && matchingBrandGuids.Contains(p.BrandId.Value))))
            .OrderByDescending(p => p.Name.StartsWith(q))
            .ThenBy(p => p.Name)
            .Take(productLimit)
            .Select(p => new
            {
                p.Name,
                p.Slug,
                p.Price,
                p.DiscountPrice,
                BrandName = db.Brands.Where(b => b.Id == p.BrandId).Select(b => b.Name).FirstOrDefault(),
                ImageUrl = p.Images.FirstOrDefault() != null ? p.Images.First().ImageUrl : null,
            })
            .ToListAsync(cancellationToken);

        // Toplam eşleşen ürün sayısı (dropdown "X sonuç" için)
        int totalProducts = await db.Products
            .Where(p => !p.IsDeleted && p.IsActive && p.IsPublished
                && (EF.Functions.ILike(p.Name, likePat)
                    || (p.SKU != null && EF.Functions.ILike(p.SKU, likePat))
                    || (matchingBrandGuids.Count > 0 && p.BrandId.HasValue && matchingBrandGuids.Contains(p.BrandId.Value))))
            .CountAsync(cancellationToken);

        items.AddRange(products.Select(p => new SearchSuggestionItem(
            "product",
            p.Name,
            $"/urun/{p.Slug}",
            p.ImageUrl,
            p.DiscountPrice ?? p.Price,
            p.BrandName)));

        return new SearchSuggestionsDto(items, totalProducts);
    }
}
