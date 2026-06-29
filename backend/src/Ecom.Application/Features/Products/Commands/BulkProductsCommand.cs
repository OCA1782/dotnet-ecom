using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Commands;

public record BulkProductsCommand(
    List<Guid>? ProductIds,
    string Action,
    decimal? PriceAdjustPercent = null,
    decimal? PriceAdjustAmount = null,
    decimal? PriceSetValue = null,
    Guid? CategoryId = null,
    Guid? BrandId = null
) : IRequest<BulkProductsResult>;

public record BulkProductsResult(int Affected, List<string> Errors);

// Preview query — returns count of products matching the filter
public record BulkPricePreviewQuery(
    List<Guid>? ProductIds,
    Guid? CategoryId,
    Guid? BrandId
) : IRequest<int>;

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
        var query = db.Products.Where(p => !p.IsDeleted);

        // Resolve target set
        if (request.ProductIds is { Count: > 0 })
        {
            query = query.Where(p => request.ProductIds.Contains(p.Id));
        }
        else if (request.CategoryId.HasValue || request.BrandId.HasValue)
        {
            if (request.CategoryId.HasValue)
                query = query.Where(p => p.CategoryId == request.CategoryId.Value);
            if (request.BrandId.HasValue)
                query = query.Where(p => p.BrandId == request.BrandId.Value);
        }
        else
        {
            return new BulkProductsResult(0, ["Hedef belirtilmedi (ürün, kategori veya marka seçin)"]);
        }

        var products = await query.ToListAsync(ct);

        if (products.Count == 0)
            return new BulkProductsResult(0, ["Eşleşen ürün bulunamadı"]);

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

            case "publish":
                foreach (var p in products)
                {
                    p.IsPublished = true;
                    affected++;
                    await audit.LogAsync("ProductBulkPublished", "Product", p.Id.ToString(), cancellationToken: ct);
                }
                break;

            case "unpublish":
                foreach (var p in products)
                {
                    p.IsPublished = false;
                    affected++;
                    await audit.LogAsync("ProductBulkUnpublished", "Product", p.Id.ToString(), cancellationToken: ct);
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
                    errors.Add("Geçersiz fiyat yüzdesi");
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

            case "price-adjust-amount":
                if (!request.PriceAdjustAmount.HasValue || request.PriceAdjustAmount == 0)
                {
                    errors.Add("Geçersiz tutar");
                    break;
                }
                var amount = request.PriceAdjustAmount.Value;
                foreach (var p in products)
                {
                    var oldPrice = p.Price;
                    p.Price = Math.Max(0, Math.Round(p.Price + amount, 2));
                    if (p.DiscountPrice.HasValue)
                        p.DiscountPrice = Math.Max(0, Math.Round(p.DiscountPrice.Value + amount, 2));
                    affected++;
                    await audit.LogAsync("ProductBulkPriceAdjusted", "Product", p.Id.ToString(),
                        oldValue: oldPrice.ToString("F2"),
                        newValue: p.Price.ToString("F2"),
                        cancellationToken: ct);
                }
                break;

            case "price-set":
                if (!request.PriceSetValue.HasValue || request.PriceSetValue < 0)
                {
                    errors.Add("Geçersiz fiyat değeri");
                    break;
                }
                var setVal = Math.Round(request.PriceSetValue.Value, 2);
                foreach (var p in products)
                {
                    var oldPrice = p.Price;
                    p.Price = setVal;
                    affected++;
                    await audit.LogAsync("ProductBulkPriceSet", "Product", p.Id.ToString(),
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

public class BulkPricePreviewHandler(IApplicationDbContext db)
    : IRequestHandler<BulkPricePreviewQuery, int>
{
    public async Task<int> Handle(BulkPricePreviewQuery request, CancellationToken ct)
    {
        var query = db.Products.Where(p => !p.IsDeleted);

        if (request.ProductIds is { Count: > 0 })
            query = query.Where(p => request.ProductIds.Contains(p.Id));
        else if (request.CategoryId.HasValue || request.BrandId.HasValue)
        {
            if (request.CategoryId.HasValue)
                query = query.Where(p => p.CategoryId == request.CategoryId.Value);
            if (request.BrandId.HasValue)
                query = query.Where(p => p.BrandId == request.BrandId.Value);
        }
        else
            return 0;

        return await query.CountAsync(ct);
    }
}
