using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Categories.Queries;

public record GetCategoryProductsQuery(
    Guid CategoryId,
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string SortBy = "name",
    string SortDir = "asc") : IRequest<GetCategoryProductsResult>;

public record CategoryProductDto(Guid Id, string Name, string? SKU, decimal Price, bool IsActive);

public record GetCategoryProductsResult(List<CategoryProductDto> Items, int TotalCount, int SubcategoryCount);

public class GetCategoryProductsHandler(IApplicationDbContext db)
    : IRequestHandler<GetCategoryProductsQuery, GetCategoryProductsResult>
{
    public async Task<GetCategoryProductsResult> Handle(GetCategoryProductsQuery request, CancellationToken ct)
    {
        // BFS — collect root + all descendant category IDs
        var allCategoryIds = new HashSet<Guid> { request.CategoryId };
        var queue = new Queue<Guid>();
        queue.Enqueue(request.CategoryId);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            var children = await db.Categories
                .IgnoreQueryFilters()
                .Where(c => c.ParentCategoryId == current && !c.IsDeleted)
                .Select(c => c.Id)
                .ToListAsync(ct);
            foreach (var child in children)
                if (allCategoryIds.Add(child))
                    queue.Enqueue(child);
        }

        var subcategoryCount = allCategoryIds.Count - 1;

        var query = db.Products
            .IgnoreQueryFilters()
            .Where(p => allCategoryIds.Contains(p.CategoryId) && !p.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || (p.SKU != null && p.SKU.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync(ct);

        query = request.SortBy switch
        {
            "sku" => request.SortDir == "asc" ? query.OrderBy(p => p.SKU) : query.OrderByDescending(p => p.SKU),
            "price" => request.SortDir == "asc" ? query.OrderBy(p => p.Price) : query.OrderByDescending(p => p.Price),
            "isActive" => request.SortDir == "asc" ? query.OrderBy(p => p.IsActive) : query.OrderByDescending(p => p.IsActive),
            _ => request.SortDir == "asc" ? query.OrderBy(p => p.Name) : query.OrderByDescending(p => p.Name),
        };

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new CategoryProductDto(p.Id, p.Name, p.SKU, p.Price, p.IsActive))
            .ToListAsync(ct);

        return new GetCategoryProductsResult(items, totalCount, subcategoryCount);
    }
}
