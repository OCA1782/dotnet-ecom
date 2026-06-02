using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Commands;

public record BulkProductsCommand(
    List<Guid> ProductIds,
    string Action,
    decimal? PriceAdjustPercent = null
) : IRequest<BulkProductsResult>;

public record BulkProductsResult(int Affected, List<string> Errors);

public class BulkProductsHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<BulkProductsCommand, BulkProductsResult>
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

    public async Task<BulkProductsResult> Handle(BulkProductsCommand request, CancellationToken ct)
    {
        if (request.ProductIds is not { Count: > 0 })
            return new BulkProductsResult(0, ["Ürün seçilmedi"]);

        var products = await db.Products
            .Where(p => request.ProductIds.Contains(p.Id))
            .ToListAsync(ct);

        var errors = new List<string>();
        var affected = 0;

        switch (request.Action.ToLowerInvariant())
        {
            case "activate":
                foreach (var p in products)
                {
                    p.IsActive = true;
                    affected++;
                    await audit.LogAsync("ProductBulkActivated", "Product", p.Id.ToString(), cancellationToken: ct);
                }
                break;

            case "deactivate":
                foreach (var p in products)
                {
                    p.IsActive = false;
                    affected++;
                    await audit.LogAsync("ProductBulkDeactivated", "Product", p.Id.ToString(), cancellationToken: ct);
                }
                break;

            case "delete":
                var blockingStatuses = BlockingStatuses.ToList();
                var blockingOrderIds = await (
                    from o in db.Orders
                    where blockingStatuses.Contains(o.Status)
                    select o.Id
                ).ToListAsync(ct);

                foreach (var p in products)
                {
                    var hasOrders = await db.OrderItems
                        .AnyAsync(i => i.ProductId == p.Id && blockingOrderIds.Contains(i.OrderId), ct);
                    if (hasOrders)
                    {
                        errors.Add($"{p.Name}: Aktif siparişi var, atlandı");
                        continue;
                    }
                    p.IsDeleted = true;
                    p.IsActive = false;
                    p.IsPublished = false;
                    affected++;
                    await audit.LogAsync("ProductBulkDeleted", "Product", p.Id.ToString(), oldValue: p.Name, cancellationToken: ct);
                }
                break;

            case "price-adjust":
                if (!request.PriceAdjustPercent.HasValue || request.PriceAdjustPercent == 0)
                {
                    errors.Add("Geçersiz fiyat ayarı");
                    break;
                }
                var multiplier = 1 + request.PriceAdjustPercent.Value / 100m;
                foreach (var p in products)
                {
                    var oldPrice = p.Price;
                    p.Price = Math.Round(p.Price * multiplier, 2);
                    if (p.DiscountPrice.HasValue)
                        p.DiscountPrice = Math.Round(p.DiscountPrice.Value * multiplier, 2);
                    affected++;
                    await audit.LogAsync("ProductBulkPriceAdjusted", "Product", p.Id.ToString(),
                        oldValue: oldPrice.ToString("F2"),
                        newValue: p.Price.ToString("F2"),
                        cancellationToken: ct);
                }
                break;

            default:
                return new BulkProductsResult(0, [$"Geçersiz işlem: {request.Action}"]);
        }

        await db.SaveChangesAsync(ct);
        return new BulkProductsResult(affected, errors);
    }
}
