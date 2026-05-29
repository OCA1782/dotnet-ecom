using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Queries;

public record GetProductAttributesQuery(string? CategorySlug = null) : IRequest<Dictionary<string, List<string>>>;

public class GetProductAttributesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetProductAttributesQuery, Dictionary<string, List<string>>>
{
    public async Task<Dictionary<string, List<string>>> Handle(GetProductAttributesQuery request, CancellationToken cancellationToken)
    {
        var variantsQuery = db.ProductVariants
            .Where(v => v.IsActive && v.AttributesJson != "[]" && v.AttributesJson != "")
            .Join(db.Products.Where(p => p.IsActive && p.IsPublished),
                v => v.ProductId, p => p.Id, (v, p) => new { v.AttributesJson, p.CategoryId });

        if (!string.IsNullOrWhiteSpace(request.CategorySlug))
        {
            var catId = await db.Categories
                .Where(c => c.Slug == request.CategorySlug.ToLower())
                .Select(c => (Guid?)c.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (catId.HasValue)
                variantsQuery = variantsQuery.Where(x => x.CategoryId == catId.Value);
        }

        var jsonList = await variantsQuery
            .Select(x => x.AttributesJson)
            .ToListAsync(cancellationToken);

        var result = new Dictionary<string, SortedSet<string>>(StringComparer.OrdinalIgnoreCase);

        foreach (var json in jsonList)
        {
            try
            {
                var attrs = System.Text.Json.JsonSerializer.Deserialize<List<AttrPair>>(json);
                if (attrs == null) continue;
                foreach (var attr in attrs)
                {
                    if (string.IsNullOrWhiteSpace(attr.Key) || string.IsNullOrWhiteSpace(attr.Value)) continue;
                    var key = attr.Key.Trim();
                    if (!result.TryGetValue(key, out var set))
                    {
                        set = new SortedSet<string>(StringComparer.OrdinalIgnoreCase);
                        result[key] = set;
                    }
                    set.Add(attr.Value.Trim());
                }
            }
            catch { }
        }

        return result.ToDictionary(
            kv => kv.Key,
            kv => kv.Value.ToList(),
            StringComparer.OrdinalIgnoreCase);
    }

    private record AttrPair(string Key, string Value);
}
