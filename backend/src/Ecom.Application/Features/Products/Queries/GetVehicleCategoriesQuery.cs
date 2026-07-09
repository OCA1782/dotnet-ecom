using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Queries;

public record GetVehicleCategoriesQuery(string VehicleModel) : IRequest<List<VehicleCategoryDto>>;

public record VehicleCategoryDto(Guid Id, string Name, string Slug, int Count);

public class GetVehicleCategoriesQueryHandler(IApplicationDbContext db) : IRequestHandler<GetVehicleCategoriesQuery, List<VehicleCategoryDto>>
{
    public async Task<List<VehicleCategoryDto>> Handle(GetVehicleCategoriesQuery request, CancellationToken cancellationToken)
    {
        var vm = request.VehicleModel;

        // Fetch category IDs of matching products — grouping done in memory to avoid
        // EF Core translation issues with GroupBy + multiple LIKE conditions on SQL Server
        var catIdList = await db.Products
            .Where(p => p.IsActive && p.IsPublished)
            .Where(p =>
                EF.Functions.Like(EF.Functions.Collate(p.Name, "Turkish_CI_AS"), $"% {vm} %") ||
                EF.Functions.Like(EF.Functions.Collate(p.Name, "Turkish_CI_AS"), $"% {vm}") ||
                EF.Functions.Like(EF.Functions.Collate(p.Name, "Turkish_CI_AS"), $"% {vm}/%") ||
                EF.Functions.Like(EF.Functions.Collate(p.Name, "Turkish_CI_AS"), $"% {vm}-%") ||
                EF.Functions.Like(EF.Functions.Collate(p.Name, "Turkish_CI_AS"), $"% {vm}(%") ||
                EF.Functions.Like(EF.Functions.Collate(p.Name, "Turkish_CI_AS"), $"% {vm}|%") ||
                EF.Functions.Like(EF.Functions.Collate(p.Name, "Turkish_CI_AS"), $"% {vm},%") ||
                EF.Functions.Like(EF.Functions.Collate(p.Name, "Turkish_CI_AS"), $"{vm} %") ||
                EF.Functions.Like(EF.Functions.Collate(p.Name, "Turkish_CI_AS"), $"{vm}/%") ||
                EF.Functions.Like(EF.Functions.Collate(p.Name, "Turkish_CI_AS"), $"{vm}-%") ||
                EF.Functions.Collate(p.Name, "Turkish_CI_AS") == vm
            )
            .Select(p => p.CategoryId)
            .ToListAsync(cancellationToken);

        var grouped = catIdList
            .GroupBy(id => id)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToList();

        var catIds = grouped.Select(c => c.CategoryId).ToHashSet();

        var cats = await db.Categories
            .Where(c => catIds.Contains(c.Id) && c.IsActive)
            .Select(c => new { c.Id, c.Name, c.Slug })
            .ToListAsync(cancellationToken);

        return cats
            .Select(c => new VehicleCategoryDto(
                c.Id,
                c.Name,
                c.Slug,
                grouped.FirstOrDefault(x => x.CategoryId == c.Id)?.Count ?? 0
            ))
            .OrderByDescending(x => x.Count)
            .ToList();
    }
}
