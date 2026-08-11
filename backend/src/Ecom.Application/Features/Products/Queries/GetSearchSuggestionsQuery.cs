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

        // Resimli ürünler önce, ardından başlıkla başlayanlar, ardından alfabetik.
        // Subquery'leri Select() içine koymak EF Core 9'da LEFT JOIN'e dönüşebilir ve
        // birden fazla resmi olan ürünlerde satır çoğalmasına (row duplication) yol açar.
        // Çözüm: önce saf product sorgusu, ardından batch image/brand fetch, bellek içi join.
        var productBase = await productQuery
            .OrderByDescending(p => p.HasProductImage)
            .ThenByDescending(p => p.Name.StartsWith(q))
            .ThenBy(p => p.Name)
            .Take(productLimit)
            .Select(p => new { p.Id, p.Name, p.Slug, p.Price, p.DiscountPrice, p.BrandId })
            .ToListAsync(cancellationToken);

        int totalProducts = await productQuery.CountAsync(cancellationToken);

        var productIds = productBase.Select(p => p.Id).ToList();
        var brandIds = productBase
            .Where(p => p.BrandId.HasValue)
            .Select(p => p.BrandId!.Value)
            .Distinct()
            .ToList();

        var allImages = await db.ProductImages
            .AsNoTracking()
            .Where(i => productIds.Contains(i.ProductId) && !i.IsDeleted)
            .OrderByDescending(i => i.IsMain)
            .Select(i => new { i.ProductId, i.ImageUrl })
            .ToListAsync(cancellationToken);

        var brandNameMap = new Dictionary<Guid, string>();
        if (brandIds.Count > 0)
        {
            brandNameMap = await db.Brands
                .AsNoTracking()
                .Where(b => brandIds.Contains(b.Id))
                .Select(b => new { b.Id, b.Name })
                .ToDictionaryAsync(b => b.Id, b => b.Name, cancellationToken);
        }

        // İlk resim zaten IsMain DESC sıralı geldiği için GroupBy + First = ana resim
        var imageMap = allImages
            .GroupBy(i => i.ProductId)
            .ToDictionary(g => g.Key, g => g.First().ImageUrl);

        items.AddRange(productBase.Select(p => new SearchSuggestionItem(
            "product",
            p.Name,
            $"/urun/{p.Slug}",
            imageMap.TryGetValue(p.Id, out var imgUrl) ? imgUrl : null,
            p.DiscountPrice ?? p.Price,
            p.BrandId.HasValue && brandNameMap.TryGetValue(p.BrandId.Value, out var bn) ? bn : null)));

        return new SearchSuggestionsDto(items, totalProducts);
    }
}
