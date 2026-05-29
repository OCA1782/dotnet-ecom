using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.ShippingCarriers.Commands;

public record UpdateShippingCarrierCommand(
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
    string? WeightPricingJson
) : IRequest<Result>;

public class UpdateShippingCarrierHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateShippingCarrierCommand, Result>
{
    public async Task<Result> Handle(UpdateShippingCarrierCommand request, CancellationToken ct)
    {
        var carrier = await db.ShippingCarriers
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, ct);

        if (carrier is null) return Result.Failure("Kargo firması bulunamadı.");

        var code = request.Code.Trim().ToLowerInvariant();
        if (await db.ShippingCarriers.AnyAsync(c => c.Code == code && c.Id != request.Id && !c.IsDeleted, ct))
            return Result.Failure("Bu kodla başka bir firma zaten mevcut.");

        carrier.Name = request.Name.Trim();
        carrier.Code = code;
        carrier.IsActive = request.IsActive;
        carrier.BasePrice = request.BasePrice;
        carrier.FreeShippingThreshold = request.FreeShippingThreshold;
        carrier.EstimatedDays = request.EstimatedDays;
        carrier.MaxWeightKg = request.MaxWeightKg;
        carrier.TrackingUrlTemplate = request.TrackingUrlTemplate;
        carrier.LogoUrl = request.LogoUrl;
        carrier.ApiEndpoint = request.ApiEndpoint;
        carrier.Notes = request.Notes;
        carrier.WeightPricingJson = request.WeightPricingJson;

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
