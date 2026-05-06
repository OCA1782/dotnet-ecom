using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using Ecom.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Infrastructure.Services;

public class StockService(IApplicationDbContext db) : IStockService
{
    public async Task<Result> ReserveAsync(Guid productId, Guid? variantId, int quantity, Guid orderId, CancellationToken ct = default)
    {
        var stock = await GetStockAsync(productId, variantId, ct);
        if (stock is null) return Result.Failure("Stok kaydı bulunamadı.");
        if (stock.AvailableQuantity < quantity)
            return Result.Failure($"Yetersiz stok. Mevcut satılabilir stok: {stock.AvailableQuantity}");

        var before = stock.Quantity;
        stock.ReservedQuantity += quantity;

        db.StockMovements.Add(new StockMovement
        {
            StockId = stock.Id,
            MovementType = StockMovementType.Reservation,
            Quantity = quantity,
            QuantityBefore = before,
            QuantityAfter = stock.Quantity,
            OrderId = orderId
        });

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> ConfirmAsync(Guid productId, Guid? variantId, int quantity, Guid orderId, CancellationToken ct = default)
    {
        var stock = await GetStockAsync(productId, variantId, ct);
        if (stock is null) return Result.Failure("Stok kaydı bulunamadı.");

        var before = stock.Quantity;
        stock.Quantity -= quantity;
        stock.ReservedQuantity -= quantity;

        if (stock.Quantity < 0) stock.Quantity = 0;
        if (stock.ReservedQuantity < 0) stock.ReservedQuantity = 0;

        db.StockMovements.Add(new StockMovement
        {
            StockId = stock.Id,
            MovementType = StockMovementType.StockOut,
            Quantity = quantity,
            QuantityBefore = before,
            QuantityAfter = stock.Quantity,
            OrderId = orderId
        });

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> ReleaseReservationAsync(Guid productId, Guid? variantId, int quantity, Guid orderId, CancellationToken ct = default)
    {
        var stock = await GetStockAsync(productId, variantId, ct);
        if (stock is null) return Result.Failure("Stok kaydı bulunamadı.");

        stock.ReservedQuantity -= quantity;
        if (stock.ReservedQuantity < 0) stock.ReservedQuantity = 0;

        db.StockMovements.Add(new StockMovement
        {
            StockId = stock.Id,
            MovementType = StockMovementType.ReleaseReservation,
            Quantity = quantity,
            QuantityBefore = stock.Quantity,
            QuantityAfter = stock.Quantity,
            OrderId = orderId
        });

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> ReturnToStockAsync(Guid productId, Guid? variantId, int quantity, Guid orderId, string? note = null, CancellationToken ct = default)
    {
        var stock = await GetStockAsync(productId, variantId, ct);
        if (stock is null) return Result.Failure("Stok kaydı bulunamadı.");

        var before = stock.Quantity;
        stock.Quantity += quantity;

        db.StockMovements.Add(new StockMovement
        {
            StockId = stock.Id,
            MovementType = StockMovementType.Return,
            Quantity = quantity,
            QuantityBefore = before,
            QuantityAfter = stock.Quantity,
            OrderId = orderId,
            Note = note
        });

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> AdjustAsync(Guid productId, Guid? variantId, int quantity, string movementType, string? note, Guid? operatorUserId = null, CancellationToken ct = default)
    {
        var stock = await GetStockAsync(productId, variantId, ct);
        if (stock is null) return Result.Failure("Stok kaydı bulunamadı.");

        if (!Enum.TryParse<StockMovementType>(movementType, out var type))
            return Result.Failure("Geçersiz hareket tipi.");

        var before = stock.Quantity;

        stock.Quantity = type switch
        {
            StockMovementType.StockIn => stock.Quantity + quantity,
            StockMovementType.StockOut => Math.Max(0, stock.Quantity - quantity),
            StockMovementType.Adjustment => quantity,
            StockMovementType.Damage => Math.Max(0, stock.Quantity - quantity),
            _ => stock.Quantity
        };

        db.StockMovements.Add(new StockMovement
        {
            StockId = stock.Id,
            MovementType = type,
            Quantity = quantity,
            QuantityBefore = before,
            QuantityAfter = stock.Quantity,
            Note = note,
            CreatedByUserId = operatorUserId
        });

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }

    private async Task<Stock?> GetStockAsync(Guid productId, Guid? variantId, CancellationToken ct)
    {
        if (variantId.HasValue)
            return await db.Stocks.FirstOrDefaultAsync(s => s.ProductVariantId == variantId, ct);
        return await db.Stocks.FirstOrDefaultAsync(s => s.ProductId == productId && s.ProductVariantId == null, ct);
    }
}
