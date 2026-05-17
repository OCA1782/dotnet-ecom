using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Orders.Queries;

public record OrderItemDto(
    Guid Id,
    Guid ProductId,
    Guid? ProductVariantId,
    string ProductName,
    string SKU,
    string? VariantName,
    int Quantity,
    decimal UnitPrice,
    decimal DiscountAmount,
    decimal TaxRate,
    decimal TaxAmount,
    decimal LineTotal,
    string? ImageUrl
);

public record OrderStatusHistoryDto(
    OrderStatus FromStatus,
    OrderStatus ToStatus,
    string? Note,
    DateTime ChangedAt
);

public record ShipmentInfoDto(
    Guid Id,
    string Carrier,
    string? TrackingNumber,
    string? TrackingUrl,
    int Status,
    DateTime? ShippedAt,
    DateTime? DeliveredAt
);

public record OrderDetailDto(
    Guid Id,
    string OrderNumber,
    Guid? UserId,
    string? GuestEmail,
    OrderStatus Status,
    PaymentStatus PaymentStatus,
    ShipmentStatus ShipmentStatus,
    decimal TotalProductAmount,
    decimal DiscountAmount,
    decimal ShippingAmount,
    decimal TaxAmount,
    decimal GrandTotal,
    string ShippingAddressSnapshot,
    string BillingAddressSnapshot,
    string? Note,
    DateTime CreatedDate,
    IEnumerable<OrderItemDto> Items,
    IEnumerable<OrderStatusHistoryDto> StatusHistory,
    IEnumerable<ShipmentInfoDto> Shipments
);

public record GetOrderQuery(string OrderNumber, Guid? UserId = null) : IRequest<Result<OrderDetailDto>>;

public class GetOrderHandler(IApplicationDbContext db) : IRequestHandler<GetOrderQuery, Result<OrderDetailDto>>
{
    public async Task<Result<OrderDetailDto>> Handle(GetOrderQuery request, CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .Include(o => o.Shipment)
            .FirstOrDefaultAsync(o => o.OrderNumber == request.OrderNumber, cancellationToken);

        if (order is null) return Result<OrderDetailDto>.Failure("Sipariş bulunamadı.");

        // If UserId is provided, verify ownership (admin passes null)
        if (request.UserId.HasValue && order.UserId != request.UserId)
            return Result<OrderDetailDto>.Failure("Bu siparişe erişim yetkiniz yok.");

        var dto = new OrderDetailDto(
            order.Id, order.OrderNumber, order.UserId, order.GuestEmail,
            order.Status, order.PaymentStatus, order.ShipmentStatus,
            order.TotalProductAmount, order.DiscountAmount, order.ShippingAmount,
            order.TaxAmount, order.GrandTotal,
            order.ShippingAddressSnapshot, order.BillingAddressSnapshot,
            order.Note, order.CreatedDate,
            order.Items.Select(i => new OrderItemDto(
                i.Id, i.ProductId, i.ProductVariantId, i.ProductName, i.SKU,
                i.VariantName, i.Quantity, i.UnitPrice, i.DiscountAmount,
                i.TaxRate, i.TaxAmount, i.LineTotal, i.ImageUrl)),
            order.StatusHistory
                .OrderByDescending(h => h.CreatedDate)
                .Select(h => new OrderStatusHistoryDto(h.FromStatus, h.ToStatus, h.Note, h.CreatedDate)),
            order.Shipment is null
                ? []
                : [new ShipmentInfoDto(
                    order.Shipment.Id,
                    order.Shipment.CargoCompany,
                    order.Shipment.TrackingNumber,
                    order.Shipment.TrackingUrl,
                    (int)order.Shipment.Status,
                    order.Shipment.ShippedDate,
                    order.Shipment.DeliveredDate)]
        );

        return Result<OrderDetailDto>.Success(dto);
    }
}
