using Ecom.Application.Common.Interfaces;
using MediatR;

namespace Ecom.Application.Features.Stocks.Commands;

public record BulkAdjustStockCommand(
    List<Guid> ProductIds,
    int Quantity,
    string MovementType,
    string? Note,
    int? CriticalStockLevel
) : IRequest<BulkAdjustStockResult>;

public record BulkAdjustStockResult(int Succeeded, int Failed, List<string> Errors);

public class BulkAdjustStockHandler(IStockService stockService, ICurrentUserService currentUser, IAuditService audit)
    : IRequestHandler<BulkAdjustStockCommand, BulkAdjustStockResult>
{
    public async Task<BulkAdjustStockResult> Handle(BulkAdjustStockCommand request, CancellationToken cancellationToken)
    {
        int succeeded = 0, failed = 0;
        var errors = new List<string>();

        foreach (var productId in request.ProductIds)
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
