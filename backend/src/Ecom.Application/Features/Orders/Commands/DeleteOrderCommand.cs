using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Orders.Commands;

public record DeleteOrderCommand(Guid OrderId) : IRequest<Result>;

public class DeleteOrderHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<DeleteOrderCommand, Result>
{
    private static readonly OrderStatus[] DeletableStatuses =
    [
        OrderStatus.Cancelled,
        OrderStatus.Completed,
        OrderStatus.Refunded,
        OrderStatus.Failed
    ];

    public async Task<Result> Handle(DeleteOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null)
            return Result.Failure("Sipariş bulunamadı.");

        if (!DeletableStatuses.Contains(order.Status))
            return Result.Failure("Yalnızca İptal, Tamamlandı, İade Edildi veya Başarısız durumundaki siparişler silinebilir.");

        order.IsDeleted = true;
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("OrderDeleted", "Order", order.Id.ToString(), cancellationToken: cancellationToken);

        return Result.Success();
    }
}
