using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.ShippingCarriers.Queries;

public record ShippingCarrierDto(
    Guid Id,
    string Name,
    string Code,
    bool IsActive,
    decimal BasePrice,
    decimal? FreeShippingThreshold,
    int EstimatedDays,
    decimal? MaxWeightKg,
    string? TrackingUrlTemplate,
    string? LogoUrl,
    string? ApiEndpoint,
    string? Notes,
    string? WeightPricingJson,
    DateTime CreatedDate
);

public record GetShippingCarriersQuery(bool? OnlyActive = null) : IRequest<List<ShippingCarrierDto>>;

public class GetShippingCarriersHandler(IApplicationDbContext db)
    : IRequestHandler<GetShippingCarriersQuery, List<ShippingCarrierDto>>
{
    public async Task<List<ShippingCarrierDto>> Handle(GetShippingCarriersQuery request, CancellationToken ct)
    {
        var q = db.ShippingCarriers.Where(c => !c.IsDeleted);
        if (request.OnlyActive.HasValue)
            q = q.Where(c => c.IsActive == request.OnlyActive.Value);

        return await q.OrderBy(c => c.Name).Select(c => new ShippingCarrierDto(
            c.Id, c.Name, c.Code, c.IsActive, c.BasePrice,
            c.FreeShippingThreshold, c.EstimatedDays, c.MaxWeightKg,
            c.TrackingUrlTemplate, c.LogoUrl, c.ApiEndpoint, c.Notes,
            c.WeightPricingJson, c.CreatedDate
        )).ToListAsync(ct);
    }
}
