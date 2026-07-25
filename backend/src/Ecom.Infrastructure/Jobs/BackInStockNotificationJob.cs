using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class BackInStockNotificationJob(IServiceScopeFactory scopeFactory) : IJobRunner
{
    public string Name => "BackInStockNotificationJob";
    public string Description => "Stok giren ürünler için bekleyen e-posta bildirimlerini gönderir";
    public int IntervalMinutes => 15;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db     = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var email  = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var siteUrl = config["NEXT_PUBLIC_SITE_URL"] ?? config["SiteUrl"] ?? "http://localhost:3000";

        // pending notifications where the product now has stock
        var pending = await db.StockNotifications
            .Include(n => n.Product)
            .Where(n => !n.IsNotified && n.Product != null && !n.Product.IsDeleted && n.Product.IsActive)
            .ToListAsync(ct);

        if (pending.Count == 0)
        {
            await log("  ✓ Bekleyen stok bildirimi yok");
            return;
        }

        // load product available stock (from Stocks table)
        var productIds = pending.Select(n => n.ProductId).Distinct().ToList();
        var stockMap = await db.Stocks
            .Where(s => s.ProductId.HasValue && productIds.Contains(s.ProductId.Value) && !s.ProductVariantId.HasValue)
            .GroupBy(s => s.ProductId!.Value)
            .Select(g => new { ProductId = g.Key, Available = g.Sum(s => s.Quantity - s.ReservedQuantity) })
            .ToDictionaryAsync(x => x.ProductId, x => x.Available, ct);

        // for variant-specific notifications, check Stocks table by ProductVariantId
        var variantIds = pending.Where(n => n.VariantId.HasValue).Select(n => n.VariantId!.Value).Distinct().ToList();
        var variantStockMap = variantIds.Count > 0
            ? await db.Stocks
                .Where(s => s.ProductVariantId.HasValue && variantIds.Contains(s.ProductVariantId!.Value))
                .GroupBy(s => s.ProductVariantId!.Value)
                .Select(g => new { VariantId = g.Key, Available = g.Sum(s => s.Quantity - s.ReservedQuantity) })
                .ToDictionaryAsync(x => x.VariantId, x => x.Available, ct)
            : new Dictionary<Guid, int>();

        int sent = 0, skipped = 0;
        foreach (var n in pending)
        {
            var available = n.VariantId.HasValue
                ? variantStockMap.GetValueOrDefault(n.VariantId.Value, 0)
                : stockMap.GetValueOrDefault(n.ProductId, 0);

            if (available <= 0) { skipped++; continue; }

            var productUrl = $"{siteUrl}/urun/{n.Product!.Slug}";
            try
            {
                await email.SendBackInStockAsync(n.Email, n.Product.Name, productUrl, ct);
                n.IsNotified = true;
                n.NotifiedAt = DateTime.UtcNow;
                sent++;
            }
            catch (Exception ex)
            {
                await log($"  ✗ Bildirim gönderilemedi {n.Email}: {ex.Message}");
            }
        }

        if (sent > 0) await db.SaveChangesAsync(ct);
        await log($"  ✓ {sent} bildirim gönderildi, {skipped} ürün hâlâ stok dışı");
    }
}
