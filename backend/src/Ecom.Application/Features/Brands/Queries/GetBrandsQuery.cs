using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Brands.Queries;

public record GetBrandsQuery(int Page = 1, int PageSize = 20, string? Search = null, bool OnlyActive = true)
    : IRequest<PaginatedList<BrandDto>>;

public record BrandDto(Guid Id, string Name, string Slug, string? LogoUrl, string? Description, bool IsActive);

public class GetBrandsQueryHandler(IApplicationDbContext db) : IRequestHandler<GetBrandsQuery, PaginatedList<BrandDto>>
{
    public async Task<PaginatedList<BrandDto>> Handle(GetBrandsQuery request, CancellationToken cancellationToken)
    {
        var query = db.Brands.AsQueryable();

        if (request.OnlyActive)
            query = query.Where(b => b.IsActive);
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(b => b.Name.Contains(request.Search));

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(b => b.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(b => new BrandDto(b.Id, b.Name, b.Slug, b.LogoUrl, b.Description, b.IsActive))
            .ToListAsync(cancellationToken);

        return PaginatedList<BrandDto>.Create(items, total, request.Page, request.PageSize);
    }
}
