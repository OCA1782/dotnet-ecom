using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.ShippingCarriers.Commands;

public record CreateShippingCarrierCommand(
    string Name,
    string Code,
    decimal BasePrice,
    decimal? FreeShippingThreshold,
    int EstimatedDays,
    decimal? MaxWeightKg,
    string? TrackingUrlTemplate,
    string? LogoUrl,
    string? ApiEndpoint,
    string? Notes,
    string? WeightPricingJson
) : IRequest<Result<Guid>>;

public class CreateShippingCarrierHandler(IApplicationDbContext db)
    : IRequestHandler<CreateShippingCarrierCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateShippingCarrierCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Result<Guid>.Failure("Firma adı zorunludur.");

        var code = request.Code.Trim().ToLowerInvariant();
        if (await db.ShippingCarriers.AnyAsync(c => c.Code == code && !c.IsDeleted, ct))
            return Result<Guid>.Failure("Bu kodla bir firma zaten mevcut.");

        var carrier = new ShippingCarrier
        {
            Name = request.Name.Trim(),
            Code = code,
            BasePrice = request.BasePrice,
            FreeShippingThreshold = request.FreeShippingThreshold,
            EstimatedDays = request.EstimatedDays,
            MaxWeightKg = request.MaxWeightKg,
            TrackingUrlTemplate = request.TrackingUrlTemplate,
            LogoUrl = request.LogoUrl,
            ApiEndpoint = request.ApiEndpoint,
            Notes = request.Notes,
            WeightPricingJson = request.WeightPricingJson,
        };

        db.ShippingCarriers.Add(carrier);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Success(carrier.Id);
    }
}
