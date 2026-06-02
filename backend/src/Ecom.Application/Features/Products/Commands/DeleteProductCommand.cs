using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Commands;

public record DeleteProductCommand(Guid Id) : IRequest<Result>;

public class DeleteProductHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<DeleteProductCommand, Result>
{
    private static readonly OrderStatus[] BlockingStatuses =
    [
        OrderStatus.Created,
        OrderStatus.PaymentPending,
        OrderStatus.PaymentCompleted,
        OrderStatus.Preparing,
        OrderStatus.Shipped,
        OrderStatus.OnHold,
    ];

    public async Task<Result> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await db.Products.FindAsync([request.Id], cancellationToken);
        if (product is null)
            return Result.Failure("Ürün bulunamadı.");

        var blockingStatuses = BlockingStatuses.ToList();
        var blockingOrderIds = await (
            from o in db.Orders
            where blockingStatuses.Contains(o.Status)
            select o.Id
        ).ToListAsync(cancellationToken);

        var hasActiveOrders = await db.OrderItems
            .AnyAsync(i => i.ProductId == request.Id && blockingOrderIds.Contains(i.OrderId), cancellationToken);

        if (hasActiveOrders)
            return Result.Failure("Aktif siparişi bulunan ürün silinemez. Siparişler tamamlanana kadar bekleyin.");

        product.IsDeleted = true;
        product.IsActive = false;
        product.IsPublished = false;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("ProductDeleted", "Product", product.Id.ToString(),
            oldValue: product.Name, cancellationToken: cancellationToken);

        return Result.Success();
    }
}
