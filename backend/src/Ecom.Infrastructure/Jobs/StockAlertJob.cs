using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class StockAlertJob(IServiceScopeFactory scopeFactory) : IJobRunner
{
    public string Name => "StockAlertJob";
    public string Description => "Kritik stok altındaki ürünleri kontrol eder, admin bildirimi gönderir";
    public int IntervalMinutes => 5;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var critical = await db.Stocks
            .Include(s => s.Product)
            .Where(s => s.Quantity - s.ReservedQuantity <= s.CriticalStockLevel && !s.Product!.IsDeleted)
            .Select(s => new { s.Product!.Name, Available = s.Quantity - s.ReservedQuantity, s.CriticalStockLevel })
            .ToListAsync(ct);

        if (critical.Count == 0)
        {
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

        var sent = 0;
        foreach (var item in critical)
        {
            try
            {
                await email.SendLowStockAlertAsync(adminEmail, item.Name, item.Available, item.CriticalStockLevel, ct);
                sent++;
            }
            catch (Exception ex)
            {
                await log($"  ⚠ {item.Name} için e-posta gönderilemedi: {ex.Message}");
            }
        }

        if (sent > 0)
            await log($"  ✓ {sent} ürün için stok alarm e-postası gönderildi");
    }
}
