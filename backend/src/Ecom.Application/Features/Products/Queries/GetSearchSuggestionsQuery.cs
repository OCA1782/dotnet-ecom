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
        var words = q.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var likePat = $"%{q}%";

        // Kategoriler (max 2) — tam cümle eşleşmesi
        var categories = await db.Categories
            .Where(c => !c.IsDeleted && EF.Functions.ILike(c.Name, likePat))
            .OrderBy(c => c.Name)
            .Take(2)
            .Select(c => new { c.Name, c.Slug, c.Icon })
            .ToListAsync(cancellationToken);

        items.AddRange(categories.Select(c => new SearchSuggestionItem(
            "category", c.Name, $"/urunler?kategori={c.Slug}", c.Icon, null, null)));

        // Markalar (max 2) — tam cümle eşleşmesi
        var brands = await db.Brands
            .Where(b => !b.IsDeleted && EF.Functions.ILike(b.Name, likePat))
            .OrderBy(b => b.Name)
            .Take(2)
            .Select(b => new { b.Name, b.Slug, b.Icon })
            .ToListAsync(cancellationToken);

        items.AddRange(brands.Select(b => new SearchSuggestionItem(
            "brand", b.Name, $"/urunler?marka={b.Slug}", b.Icon, null, null)));

        int productLimit = Math.Max(request.Limit - items.Count, 3);

        // Kelime başına marka ID'leri: "opel far" → "opel" kelimesi için Opel marka ID'si
        // Bu sayede brand=Opel + name contains "far" olan ürünler eşleşir.
        var wordBrandIds = new List<(string Pattern, List<Guid> BrandIds)>();
        foreach (var word in words)
        {
            var wp = $"%{word}%";
            var ids = await db.Brands.AsNoTracking()
                .Where(b => !b.IsDeleted && EF.Functions.ILike(b.Name, wp))
                .Select(b => b.Id)
                .ToListAsync(cancellationToken);
            wordBrandIds.Add((wp, ids));
        }

        // Ürün sorgusu: her kelime (isim VEYA SKU VEYA o kelimenin markası) içinde geçmeli (AND zinciri)
        var productQuery = db.Products
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.IsActive && p.IsPublished);

        foreach (var (wp, bIds) in wordBrandIds)
        {
            var capturedWp = wp;
            var capturedBIds = bIds;
            productQuery = productQuery.Where(p =>
                EF.Functions.ILike(p.Name, capturedWp)
                || (p.SKU != null && EF.Functions.ILike(p.SKU, capturedWp))
                || (capturedBIds.Count > 0 && p.BrandId.HasValue && capturedBIds.Contains(p.BrandId.Value)));
        }

        // Resimli ürünler önce, ardından başlıkla başlayanlar, ardından alfabetik
        var products = await productQuery
            .OrderByDescending(p => p.HasProductImage)
            .ThenByDescending(p => p.Name.StartsWith(q))
            .ThenBy(p => p.Name)
            .Take(productLimit)
            .Select(p => new
            {
                p.Name,
                p.Slug,
                p.Price,
                p.DiscountPrice,
                BrandName = db.Brands.Where(b => b.Id == p.BrandId).Select(b => b.Name).FirstOrDefault(),
                // Single correlated subquery: IsMain DESC ensures main image is preferred.
                // Avoids ?? between two FirstOrDefault() which EF Core may translate as a JOIN,
                // multiplying rows for products that have multiple images.
                ImageUrl = db.ProductImages
                    .Where(i => i.ProductId == p.Id && !i.IsDeleted)
                    .OrderByDescending(i => i.IsMain)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault(),
            })
            .ToListAsync(cancellationToken);

        int totalProducts = await productQuery.CountAsync(cancellationToken);

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
