using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class StockAlertJob(IServiceScopeFactory scopeFactory, IMemoryCache cache) : IJobRunner
{
    public string Name => "StockAlertJob";
    public string Description => "Kritik stok altındaki ürünleri kontrol eder, tek bir toplu e-posta gönderir";
    public int IntervalMinutes => 5;

    private const string CacheKey = "stock-alert:state";
    private static readonly TimeSpan ReSendInterval = TimeSpan.FromHours(24);

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db     = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var email  = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var critical = await db.Stocks
            .Include(s => s.Product)
            .Where(s => s.Quantity - s.ReservedQuantity <= s.CriticalStockLevel
                        && s.CriticalStockLevel > 0
                        && !s.Product!.IsDeleted
                        && s.Product.IsActive)
            .Select(s => new
            {
                s.Product!.Name,
                Available    = s.Quantity - s.ReservedQuantity,
                s.CriticalStockLevel
            })
            .OrderBy(s => s.Available)
            .ToListAsync(ct);

        if (critical.Count == 0)
        {
            cache.Remove(CacheKey);
            await log("  ✓ Kritik stok altında ürün yok");
            return;
        }

        await log($"  ⚠ {critical.Count} ürün kritik stok altında:");
        foreach (var item in critical)
            await log($"    - {item.Name}: {item.Available} adet (eşik: {item.CriticalStockLevel})");

        var adminEmail = config["Email:AlertTo"] ?? config["Email:FromAddress"] ?? "";
        if (string.IsNullOrEmpty(adminEmail))
        {
            await log("  ⚠ Alert e-posta adresi yapılandırılmamış (Email:AlertTo)");
            return;
        }

        // De-duplikasyon: son gönderilen ürün seti ile karşılaştır
        var currentNames = critical.Select(x => x.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var lastState = cache.Get<(DateTime SentAt, HashSet<string> Names)>(CacheKey);
        var lastSentAt    = lastState.SentAt;
        var lastNames     = lastState.Names ?? [];
        var newProducts   = currentNames.Except(lastNames).ToList();
        var timeSinceLast = DateTime.UtcNow - lastSentAt;

        if (newProducts.Count == 0 && timeSinceLast < ReSendInterval)
        {
            var remaining = ReSendInterval - timeSinceLast;
            await log($"  ℹ Yeni kritik ürün yok — sonraki hatırlatma {remaining.TotalHours:F1} saat sonra");
            return;
        }

        // Toplu mail gönder
        var products = critical
            .Select(x => (x.Name, x.Available, x.CriticalStockLevel))
            .ToList();

        try
        {
            await email.SendLowStockAlertBatchAsync(adminEmail, products, ct);

            cache.Set(CacheKey,
                (SentAt: DateTime.UtcNow, Names: currentNames),
                TimeSpan.FromHours(25));

            var reason = newProducts.Count > 0
                ? $"{newProducts.Count} yeni ürün kritik stoka düştü"
                : "24 saatlik hatırlatma";
            await log($"  ✓ Toplu stok uyarı e-postası gönderildi ({products.Count} ürün, {reason})");
        }
        catch (Exception ex)
        {
            await log($"  ✗ E-posta gönderilemedi: {ex.Message}");
        }
    }
}
