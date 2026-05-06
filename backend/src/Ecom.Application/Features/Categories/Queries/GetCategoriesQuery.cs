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
    List<CategoryDto> SubCategories
);

public class GetCategoriesQueryHandler(IApplicationDbContext db) : IRequestHandler<GetCategoriesQuery, List<CategoryDto>>
{
    public async Task<List<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var query = db.Categories.AsQueryable();

        if (request.OnlyActive)
            query = query.Where(c => c.IsActive);
        if (request.OnlyMenu)
            query = query.Where(c => c.ShowInMenu);

        var all = await query
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);

        return BuildTree(all, null);
    }

    private static List<CategoryDto> BuildTree(List<Category> all, Guid? parentId)
        => all
            .Where(c => c.ParentCategoryId == parentId)
            .Select(c => new CategoryDto(
                c.Id, c.ParentCategoryId, c.Name, c.Slug,
                c.Description, c.ImageUrl, c.SortOrder, c.IsActive, c.ShowInMenu,
                BuildTree(all, c.Id)))
            .ToList();
}
