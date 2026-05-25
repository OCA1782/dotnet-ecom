using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Categories.Queries;

public record GetCategoriesQuery(bool OnlyActive = true, bool OnlyMenu = false) : IRequest<List<CategoryDto>>;

public record CategoryDto(
    Guid Id,
    Guid? ParentCategoryId,
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    int SortOrder,
    bool IsActive,
    bool ShowInMenu,
    List<CategoryDto> SubCategories,
    string? ImportedFromSourceName = null
);

public class GetCategoriesQueryHandler(IApplicationDbContext db, ICacheService cache) : IRequestHandler<GetCategoriesQuery, List<CategoryDto>>
{
    public async Task<List<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"categories:{request.OnlyActive}:{request.OnlyMenu}";
        var cached = await cache.GetAsync<List<CategoryDto>>(cacheKey, cancellationToken);
        if (cached is not null) return cached;

        var query = db.Categories.Where(c => !c.IsDeleted);

        if (request.OnlyActive)
            query = query.Where(c => c.IsActive);
        if (request.OnlyMenu)
            query = query.Where(c => c.ShowInMenu);

        var all = await query
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);

        var sourceIds = all.Where(c => c.ImportedFromSourceId.HasValue)
            .Select(c => c.ImportedFromSourceId!.Value).Distinct().ToList();
        var sourceNames = sourceIds.Count > 0
            ? await db.ExternalSources.Where(s => sourceIds.Contains(s.Id))
                .ToDictionaryAsync(s => s.Id, s => s.Name, cancellationToken)
            : new Dictionary<Guid, string>();

        var result = BuildTree(all, null, sourceNames);
        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(10), cancellationToken);
        return result;
    }

    private static List<CategoryDto> BuildTree(List<Category> all, Guid? parentId, Dictionary<Guid, string> sourceNames)
        => all
            .Where(c => c.ParentCategoryId == parentId)
            .Select(c => new CategoryDto(
                c.Id, c.ParentCategoryId, c.Name, c.Slug,
                c.Description, c.ImageUrl, c.SortOrder, c.IsActive, c.ShowInMenu,
                BuildTree(all, c.Id, sourceNames),
                c.ImportedFromSourceId.HasValue && sourceNames.TryGetValue(c.ImportedFromSourceId.Value, out var n) ? n : null))
            .ToList();
}
