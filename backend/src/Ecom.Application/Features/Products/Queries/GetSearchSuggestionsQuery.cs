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

        // Kategoriler (max 2)
        var categories = await db.Categories
            .Where(c => !c.IsDeleted && c.Name.Contains(q))
            .OrderBy(c => c.Name)
            .Take(2)
            .Select(c => new { c.Name, c.Slug, c.Icon })
            .ToListAsync(cancellationToken);

        items.AddRange(categories.Select(c => new SearchSuggestionItem(
            "category", c.Name, $"/urunler?kategori={c.Slug}", c.Icon, null, null)));

        // Markalar (max 2)
        var brands = await db.Brands
            .Where(b => !b.IsDeleted && b.Name.Contains(q))
            .OrderBy(b => b.Name)
            .Take(2)
            .Select(b => new { b.Name, b.Slug, b.Icon })
            .ToListAsync(cancellationToken);

        items.AddRange(brands.Select(b => new SearchSuggestionItem(
            "brand", b.Name, $"/urunler?marka={b.Slug}", b.Icon, null, null)));

        // Ürünler — kalan slot
        int productLimit = Math.Max(request.Limit - items.Count, 3);

        var products = await db.Products
            .Include(p => p.Brand)
            .Include(p => p.Images.Where(i => i.IsMain))
            .Where(p => !p.IsDeleted && p.IsActive && p.IsPublished
                && (p.Name.Contains(q) || p.SKU.Contains(q)
                    || (p.Brand != null && p.Brand.Name.Contains(q))))
            .OrderByDescending(p => p.Name.StartsWith(q))
            .ThenBy(p => p.Name)
            .Take(productLimit)
            .Select(p => new
            {
                p.Name,
                p.Slug,
                p.Price,
                p.DiscountPrice,
                BrandName = p.Brand != null ? p.Brand.Name : null,
                ImageUrl = p.Images.FirstOrDefault() != null ? p.Images.First().ImageUrl : null,
            })
            .ToListAsync(cancellationToken);

        // Toplam eşleşen ürün sayısı (dropdown "X sonuç" için)
        int totalProducts = await db.Products
            .Where(p => !p.IsDeleted && p.IsActive && p.IsPublished
                && (p.Name.Contains(q) || p.SKU.Contains(q)
                    || (p.Brand != null && p.Brand.Name.Contains(q))))
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
