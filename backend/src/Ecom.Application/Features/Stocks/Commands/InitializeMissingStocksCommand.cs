using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Stocks.Commands;

public record InitializeMissingStocksCommand(int DefaultQuantity = 50)
    : IRequest<InitializeMissingStocksResult>;

public record InitializeMissingStocksResult(int Created, int TotalProducts);

public class InitializeMissingStocksCommandHandler(IApplicationDbContext db)
    : IRequestHandler<InitializeMissingStocksCommand, InitializeMissingStocksResult>
{
    public async Task<InitializeMissingStocksResult> Handle(
        InitializeMissingStocksCommand request, CancellationToken cancellationToken)
    {
        var defaultQty = Math.Max(0, request.DefaultQuantity);
        const int batchSize = 500;
        int totalCreated = 0;

        // Process in batches until no products-without-stock remain.
        // Always query from offset 0 because we're consuming the "missing" set each iteration.
        while (true)
        {
            var batch = await db.Products
                .Where(p => !p.IsDeleted && !db.Stocks.Any(s => s.ProductId == p.Id))
                .Take(batchSize)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);

            if (batch.Count == 0) break;

            var newStocks = batch.Select(productId => new Stock
            {
                ProductId          = productId,
                Quantity           = defaultQty,
                ReservedQuantity   = 0,
                CriticalStockLevel = 5,
            }).ToList();

            db.Stocks.AddRange(newStocks);
            await db.SaveChangesAsync(cancellationToken);

            // Create one stock-in movement per new stock for audit trail
            var movements = newStocks.Select(s => new StockMovement
            {
                StockId        = s.Id,
                MovementType   = StockMovementType.StockIn,
                Quantity       = defaultQty,
                QuantityBefore = 0,
                QuantityAfter  = defaultQty,
                Note           = $"Varsayılan stok oluşturuldu ({defaultQty} adet)",
            }).ToList();

            db.StockMovements.AddRange(movements);
            await db.SaveChangesAsync(cancellationToken);
            db.ClearChangeTracker();

            totalCreated += batch.Count;
            if (batch.Count < batchSize) break;
        }

        var totalProducts = await db.Products.CountAsync(p => !p.IsDeleted, cancellationToken);

        return new InitializeMissingStocksResult(Created: totalCreated, TotalProducts: totalProducts);
    }
}
