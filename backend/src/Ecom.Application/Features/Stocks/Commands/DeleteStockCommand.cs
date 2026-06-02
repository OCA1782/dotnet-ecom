using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Stocks.Commands;

public record DeleteStockCommand(Guid ProductId) : IRequest<Result>;

public class DeleteStockHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<DeleteStockCommand, Result>
{
    public async Task<Result> Handle(DeleteStockCommand request, CancellationToken cancellationToken)
    {
        var stock = await db.Stocks
            .FirstOrDefaultAsync(s => s.ProductId == request.ProductId, cancellationToken);

        if (stock is null)
            return Result.Failure("Stok kaydı bulunamadı.");

        var blockingStatuses = new[]
        {
            Domain.Enums.OrderStatus.Created,
            Domain.Enums.OrderStatus.PaymentPending,
            Domain.Enums.OrderStatus.PaymentCompleted,
            Domain.Enums.OrderStatus.Preparing,
            Domain.Enums.OrderStatus.Shipped,
        }.ToList();
        var blockingOrderIds = await (
            from o in db.Orders
            where blockingStatuses.Contains(o.Status)
            select o.Id
        ).ToListAsync(cancellationToken);
        var hasActiveOrders = await db.OrderItems
            .AnyAsync(i => i.ProductId == request.ProductId && blockingOrderIds.Contains(i.OrderId), cancellationToken);

        if (hasActiveOrders)
            return Result.Failure("Aktif siparişi olan ürünün stoğu silinemez.");

        db.Stocks.Remove(stock);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("StockDeleted", "Stock", stock.Id.ToString(), cancellationToken: cancellationToken);

        return Result.Success();
    }
}
