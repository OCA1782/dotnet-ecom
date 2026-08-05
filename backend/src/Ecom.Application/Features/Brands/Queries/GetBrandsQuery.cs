using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Brands.Queries;

public record GetBrandsQuery(int Page = 1, int PageSize = 20, string? Search = null, bool OnlyActive = true, bool? IsActive = null, string? SortBy = null, string? DataSource = null, bool? ShowInVehicleNav = null, string? CategorySlug = null)
    : IRequest<PaginatedList<BrandDto>>;

public record BrandDto(Guid Id, string Name, string Slug, string? LogoUrl, string? Description, bool IsActive, string? ImportedFromSourceName = null, DateTime CreatedDate = default, string? DataSource = null, string? CreatedByAdminEmail = null, bool ShowInVehicleNav = false, string? VehicleModelsJson = null);

public class GetBrandsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<GetBrandsQuery, PaginatedList<BrandDto>>
{
    public async Task<PaginatedList<BrandDto>> Handle(GetBrandsQuery request, CancellationToken cancellationToken)
    {
        var query = db.Brands.Where(b => !b.IsDeleted);

        if (!currentUser.IsSuperAdmin && currentUser.UserId.HasValue)
            query = query.Where(b => b.CreatedByAdminId == currentUser.UserId.Value);

        if (request.IsActive.HasValue)
            query = query.Where(b => b.IsActive == request.IsActive.Value);
        else if (request.OnlyActive)
            query = query.Where(b => b.IsActive);
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(b => b.Name.Contains(request.Search));

        if (!string.IsNullOrWhiteSpace(request.DataSource))
        {
            if (request.DataSource == "__manual__")
                query = query.Where(b => b.DataSource == null || b.DataSource == "");
            else
                query = query.Where(b => b.DataSource == request.DataSource);
        }

        if (request.ShowInVehicleNav.HasValue)
            query = query.Where(b => b.ShowInVehicleNav == request.ShowInVehicleNav.Value);

        if (!string.IsNullOrWhiteSpace(request.CategorySlug))
            query = query.Where(b => db.Products.Any(p =>
                !p.IsDeleted && p.BrandId == b.Id &&
                (db.Categories.Any(c => c.Slug == request.CategorySlug && c.Id == p.CategoryId) ||
                 db.Categories.Any(c => c.Slug == request.CategorySlug &&
                     db.Categories.Any(sub => sub.Id == p.CategoryId && sub.ParentCategoryId == c.Id)))));

        var total = await query.CountAsync(cancellationToken);
        var orderedQuery = request.SortBy switch
        {
            "name-asc"         => query.OrderBy(b => b.Name),
            "name-desc"        => query.OrderByDescending(b => b.Name),
            "createdDate-asc"  => query.OrderBy(b => b.CreatedDate),
            "createdDate-desc" => query.OrderByDescending(b => b.CreatedDate),
            "dataSource-asc"   => query.OrderBy(b => b.DataSource),
            "dataSource-desc"  => query.OrderByDescending(b => b.DataSource),
            _                  => query.OrderByDescending(b => b.CreatedDate),
        };
        var paged = orderedQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize);

        var items = await (
            from b in paged
            join s in db.ExternalSources on b.ImportedFromSourceId equals s.Id into sg
            from s in sg.DefaultIfEmpty()
            join u in db.Users on b.CreatedByAdminId equals u.Id into ug
            from u in ug.DefaultIfEmpty()
            select new BrandDto(b.Id, b.Name, b.Slug, b.LogoUrl, b.Description, b.IsActive,
                s != null ? s.Name : null,
                b.CreatedDate,
                b.DataSource,
                u != null ? u.Email : null,
                b.ShowInVehicleNav,
                b.VehicleModelsJson)
        ).ToListAsync(cancellationToken);

        return PaginatedList<BrandDto>.Create(items, total, request.Page, request.PageSize);
    }
}
