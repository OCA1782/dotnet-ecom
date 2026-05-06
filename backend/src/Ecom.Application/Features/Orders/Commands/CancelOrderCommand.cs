using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Orders.Commands;

public record CancelOrderCommand(Guid OrderId, Guid? UserId, string? Reason = null) : IRequest<Result>;

public class CancelOrderHandler(
    IApplicationDbContext db,
    IStockService stockService
) : IRequestHandler<CancelOrderCommand, Result>
{
    private static readonly OrderStatus[] CancellableStatuses =
    [
        OrderStatus.Created,
        OrderStatus.PaymentPending
    ];

    public async Task<Result> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null) return Result.Failure("Sipariş bulunamadı.");

        // If UserId is provided (non-admin), verify ownership
        if (request.UserId.HasValue && order.UserId != request.UserId)
            return Result.Failure("Yetkisiz işlem.");

        if (!CancellableStatuses.Contains(order.Status))
            return Result.Failure("Bu sipariş iptal edilemez. Lütfen müşteri hizmetleri ile iletişime geçin.");

        var previousStatus = order.Status;
        order.Status = OrderStatus.Cancelled;

        // Explicit FK set + DbSet.Add (navigation Add on unloaded collection causes batch issues)
        db.OrderStatusHistories.Add(new Domain.Entities.OrderStatusHistory
        {
            OrderId = order.Id,
            FromStatus = previousStatus,
            ToStatus = OrderStatus.Cancelled,
            ChangedByUserId = request.UserId,
            Note = request.Reason
        });

        // Save order changes first; then release stock in separate saves
        await db.SaveChangesAsync(cancellationToken);

        foreach (var item in order.Items)
        {
            await stockService.ReleaseReservationAsync(
                item.ProductId, item.ProductVariantId, item.Quantity, order.Id, cancellationToken);
        }

        return Result.Success();
    }
}
