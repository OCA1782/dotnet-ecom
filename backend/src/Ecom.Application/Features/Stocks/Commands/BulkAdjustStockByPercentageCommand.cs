using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Stocks.Commands;

// PercentageMode:
//   "increase" — yeni stok = mevcut + Math.Round(mevcut * pct / 100)
//   "decrease" — yeni stok = max(0, mevcut - Math.Round(mevcut * pct / 100))
//   "set"      — yeni stok = Math.Round(mevcut * pct / 100)  (örn. %50 → yarısına indir)
public record BulkAdjustStockByPercentageCommand(
    List<Guid> ProductIds,
    decimal Percentage,
    string PercentageMode,
    string? Note,
    int? CriticalStockLevel
) : IRequest<BulkAdjustStockResult>;

public class BulkAdjustStockByPercentageHandler(
    IApplicationDbContext db,
    IStockService stockService,
    ICurrentUserService currentUser,
    IAuditService audit)
    : IRequestHandler<BulkAdjustStockByPercentageCommand, BulkAdjustStockResult>
{
    public async Task<BulkAdjustStockResult> Handle(BulkAdjustStockByPercentageCommand request, CancellationToken cancellationToken)
    {
        var stocks = await db.Stocks
            .AsNoTracking()
            .Where(s => s.ProductId != null && request.ProductIds.Contains(s.ProductId!.Value))
            .Select(s => new { s.ProductId, Available = s.Quantity - s.ReservedQuantity })
            .ToListAsync(cancellationToken);

        int succeeded = 0, failed = 0;
        var errors = new List<string>();

        foreach (var stock in stocks)
        {
            var current = stock.Available;
            int newQty = request.PercentageMode switch
            {
                "increase" => current + (int)Math.Round(current * request.Percentage / 100m),
                "decrease" => Math.Max(0, current - (int)Math.Round(current * request.Percentage / 100m)),
                "set"      => (int)Math.Round(current * request.Percentage / 100m),
                _          => current,
            };

            var result = await stockService.AdjustAsync(
                stock.ProductId!.Value, null,
                newQty, "Adjustment", request.Note,
                currentUser.UserId, request.CriticalStockLevel, cancellationToken);

            if (result.Succeeded)
            {
                succeeded++;
                await audit.LogAsync("StockAdjusted", "Stok",
                    stock.ProductId.ToString()!,
                    newValue: $"Percentage:{request.PercentageMode}:{request.Percentage}% → {newQty}",
                    cancellationToken: cancellationToken);
            }
            else
            {
                failed++;
                if (!string.IsNullOrEmpty(result.Error))
                    errors.Add($"{stock.ProductId}: {result.Error}");
            }
        }

        return new BulkAdjustStockResult(succeeded, failed, errors);
    }
}
