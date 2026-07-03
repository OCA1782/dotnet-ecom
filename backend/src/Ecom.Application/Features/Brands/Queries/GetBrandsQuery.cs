using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Brands.Queries;

public record GetBrandsQuery(int Page = 1, int PageSize = 20, string? Search = null, bool OnlyActive = true, bool? IsActive = null, string? SortBy = null, string? DataSource = null, bool? ShowInVehicleNav = null)
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
        var items = await orderedQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(b => new BrandDto(b.Id, b.Name, b.Slug, b.LogoUrl, b.Description, b.IsActive,
                b.ImportedFromSourceId != null
                    ? db.ExternalSources.Where(s => s.Id == b.ImportedFromSourceId).Select(s => s.Name).FirstOrDefault()
                    : null,
                b.CreatedDate,
                b.DataSource,
                b.CreatedByAdminId != null
                    ? db.Users.Where(u => u.Id == b.CreatedByAdminId).Select(u => u.Email).FirstOrDefault()
                    : null,
                b.ShowInVehicleNav,
                b.VehicleModelsJson))
            .ToListAsync(cancellationToken);

        return PaginatedList<BrandDto>.Create(items, total, request.Page, request.PageSize);
    }
}
