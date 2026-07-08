using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Stocks.Commands;

public record BulkAdjustStockByConditionCommand(
    int? MinStock,
    int? MaxStock,
    int Quantity,
    string MovementType,
    string? Note,
    int? CriticalStockLevel
) : IRequest<BulkAdjustStockResult>;

public class BulkAdjustStockByConditionHandler(
    IApplicationDbContext db,
    IStockService stockService,
    ICurrentUserService currentUser,
    IAuditService audit)
    : IRequestHandler<BulkAdjustStockByConditionCommand, BulkAdjustStockResult>
{
    public async Task<BulkAdjustStockResult> Handle(BulkAdjustStockByConditionCommand request, CancellationToken cancellationToken)
    {
        var query = db.Stocks.AsQueryable();

        // AvailableQuantity = Quantity - ReservedQuantity (computed, not a DB column)
        if (request.MinStock.HasValue)
            query = query.Where(s => (s.Quantity - s.ReservedQuantity) >= request.MinStock.Value);

        if (request.MaxStock.HasValue)
            query = query.Where(s => (s.Quantity - s.ReservedQuantity) <= request.MaxStock.Value);

        var productIds = await query
            .Where(s => s.ProductId != null)
            .Select(s => s.ProductId!.Value)
            .ToListAsync(cancellationToken);

        int succeeded = 0, failed = 0;
        var errors = new List<string>();

        foreach (var productId in productIds)
        {
            var result = await stockService.AdjustAsync(
                productId, null,
                request.Quantity, request.MovementType, request.Note,
                currentUser.UserId, request.CriticalStockLevel, cancellationToken);

            if (result.Succeeded)
            {
                succeeded++;
                await audit.LogAsync("StockAdjusted", "Stok",
                    productId.ToString(),
                    newValue: $"{request.MovementType}:{request.Quantity}",
                    cancellationToken: cancellationToken);
            }
            else
            {
                failed++;
                if (!string.IsNullOrEmpty(result.Error))
                    errors.Add($"{productId}: {result.Error}");
            }
        }

        return new BulkAdjustStockResult(succeeded, failed, errors);
    }
}
