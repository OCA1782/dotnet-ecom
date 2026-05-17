using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Shipments.Commands;

public record UpdateShipmentCommand(
    Guid ShipmentId,
    string CargoCompany,
    string? TrackingNumber,
    string? TrackingUrl,
    ShipmentStatus Status
) : IRequest<Result>;

public class UpdateShipmentHandler(IApplicationDbContext db) : IRequestHandler<UpdateShipmentCommand, Result>
{
    public async Task<Result> Handle(UpdateShipmentCommand request, CancellationToken ct)
    {
        var shipment = await db.Shipments
            .Include(s => s.Order)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId && !s.IsDeleted, ct);

        if (shipment is null) return Result.Failure("Kargo kaydı bulunamadı.");

        shipment.CargoCompany = request.CargoCompany;
        shipment.TrackingNumber = request.TrackingNumber;
        shipment.TrackingUrl = request.TrackingUrl;
        shipment.Status = request.Status;

        if (request.Status == ShipmentStatus.Delivered && shipment.DeliveredDate is null)
        {
            shipment.DeliveredDate = DateTime.UtcNow;
            shipment.Order.Status = OrderStatus.Delivered;
            shipment.Order.ShipmentStatus = ShipmentStatus.Delivered;
        }

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
