using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Shipments.Commands;

public record CreateShipmentCommand(
    Guid OrderId,
    string CargoCompany,
    string TrackingNumber,
    string? TrackingUrl,
    Guid? CreatedByUserId
) : IRequest<Result<Guid>>;

public class CreateShipmentValidator : AbstractValidator<CreateShipmentCommand>
{
    public CreateShipmentValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.CargoCompany).MaximumLength(100);
        RuleFor(x => x.TrackingNumber).MaximumLength(100);
    }
}

public class CreateShipmentHandler(IApplicationDbContext db, IEmailService emailService) : IRequestHandler<CreateShipmentCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateShipmentCommand request, CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .Include(o => o.Shipment)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null) return Result<Guid>.Failure("Sipariş bulunamadı.");

        if (order.Shipment is not null)
            return Result<Guid>.Failure("Bu siparişe zaten kargo kaydı eklenmiş.");

        var shipment = new Domain.Entities.Shipment
        {
            OrderId        = order.Id,
            CargoCompany   = request.CargoCompany,
            TrackingNumber = request.TrackingNumber,
            TrackingUrl    = request.TrackingUrl,
            ShippingCost   = order.ShippingAmount,
            Status         = ShipmentStatus.NotShipped,
        };

        db.Shipments.Add(shipment);
        order.ShipmentStatus = ShipmentStatus.NotShipped;

        await db.SaveChangesAsync(cancellationToken);

        // Send shipping notification email
        try
        {
            string toEmail = order.GuestEmail ?? string.Empty;
            string toName = "Değerli Müşteri";
            if (order.UserId.HasValue)
            {
                var user = await db.Users.FindAsync([order.UserId.Value], cancellationToken);
                if (user is not null)
                {
                    toEmail = user.Email;
                    toName = $"{user.Name} {user.Surname}";
                }
            }
            if (!string.IsNullOrEmpty(toEmail))
                await emailService.SendShippingNotificationAsync(
                    toEmail, toName, order.OrderNumber,
                    request.CargoCompany, request.TrackingNumber, request.TrackingUrl,
                    cancellationToken);
        }
        catch { }

        return Result<Guid>.Success(shipment.Id);
    }
}
