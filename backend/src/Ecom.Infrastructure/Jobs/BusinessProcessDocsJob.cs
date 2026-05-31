using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using System.Text;

namespace Ecom.Infrastructure.Jobs;

public class BusinessProcessDocsJob(
    IServiceScopeFactory scopeFactory,
    IWebHostEnvironment env,
    IConfiguration config,
    IMemoryCache cache) : IJobRunner
{
    public string Name => "BusinessProcessDocsJob";
    public string Description => "Sipariş/ürün istatistiklerinden İş Süreçleri belgesini otomatik günceller";
    public int IntervalMinutes => 1440; // daily

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await log("İş süreçleri belgesi oluşturuluyor...");

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var totalProducts = await db.Products.CountAsync(p => !p.IsDeleted, ct);
        var activeProducts = await db.Products.CountAsync(p => !p.IsDeleted && p.IsActive, ct);
        var totalCategories = await db.Categories.CountAsync(c => !c.IsDeleted, ct);
        var totalBrands = await db.Brands.CountAsync(b => !b.IsDeleted, ct);
        var totalOrders = await db.Orders.CountAsync(ct);
        var totalUsers = await db.Users.CountAsync(u => !u.IsDeleted, ct);
        var totalCoupons = await db.Coupons.CountAsync(c => !c.IsDeleted, ct);

        var since30 = DateTime.UtcNow.AddDays(-30);
        var ordersLast30 = await db.Orders.CountAsync(o => o.CreatedDate >= since30, ct);
        var newUsersLast30 = await db.Users.CountAsync(u => u.CreatedDate >= since30 && !u.IsDeleted, ct);

        var ordersByStatus = await db.Orders
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("# İş Süreçleri");
        sb.AppendLine();
        sb.AppendLine($"> Son güncelleme: {DateTime.UtcNow:dd.MM.yyyy HH:mm} UTC (otomatik)");
        sb.AppendLine();

        sb.AppendLine("## Genel Bakış");
        sb.AppendLine();
        sb.AppendLine("| Metrik | Değer |");
        sb.AppendLine("|--------|-------|");
        sb.AppendLine($"| Toplam Ürün | {totalProducts} ({activeProducts} aktif) |");
        sb.AppendLine($"| Kategori | {totalCategories} |");
        sb.AppendLine($"| Marka | {totalBrands} |");
        sb.AppendLine($"| Toplam Sipariş | {totalOrders} |");
        sb.AppendLine($"| Toplam Kullanıcı | {totalUsers} |");
        sb.AppendLine($"| Aktif Kuponlar | {totalCoupons} |");
        sb.AppendLine();

        sb.AppendLine("## Son 30 Gün");
        sb.AppendLine();
        sb.AppendLine($"- **Yeni Sipariş:** {ordersLast30}");
        sb.AppendLine($"- **Yeni Kullanıcı:** {newUsersLast30}");
        sb.AppendLine();

        if (ordersByStatus.Any())
        {
            sb.AppendLine("## Sipariş Durumları");
            sb.AppendLine();
            sb.AppendLine("| Durum | Adet |");
            sb.AppendLine("|-------|------|");
            foreach (var s in ordersByStatus.OrderByDescending(x => x.Count))
                sb.AppendLine($"| {s.Status} | {s.Count} |");
            sb.AppendLine();
        }

        sb.AppendLine("## Sipariş Akışı");
        sb.AppendLine();
        sb.AppendLine("1. Müşteri ürünleri sepete ekler");
        sb.AppendLine("2. Ödeme adımında kupon kodu kullanılabilir");
        sb.AppendLine("3. Ödeme onaylandıktan sonra sipariş `Pending` → `Processing` geçer");
        sb.AppendLine("4. Kargo oluşturulunca `Shipped` durumuna geçer");
        sb.AppendLine("5. Teslimatta `Delivered` durumuna güncellenir");
        sb.AppendLine("6. İptal talebi `Cancelled` akışını başlatır");
        sb.AppendLine();

        var content = sb.ToString();

        var repoRoot = FindGitRoot(env.ContentRootPath);
        var docsPath = repoRoot is not null ? ResolveDocsPath(repoRoot) : null;

        if (docsPath is not null)
        {
            var filePath = Path.Combine(docsPath, "is-surecleri.md");
            await File.WriteAllTextAsync(filePath, content, Encoding.UTF8, ct);
            cache.Remove("gh:docs:file:is-surecleri.md");
            cache.Remove("gh:docs:files");
            await log($"  ✓ is-surecleri.md güncellendi ({totalProducts} ürün, {totalOrders} sipariş)");
        }
        else
        {
            cache.Set("docs:business-processes", content, TimeSpan.FromHours(25));
            await log($"  ✓ İş süreçleri cache'e yazıldı ({totalProducts} ürün, {totalOrders} sipariş)");
        }
    }

    private string? ResolveDocsPath(string repoRoot)
    {
        var configured = config["Docs:LocalPath"];
        if (!string.IsNullOrWhiteSpace(configured) && Directory.Exists(configured))
            return configured;

        foreach (var name in new[] { "DOCS", "docs" })
        {
            var p = Path.Combine(repoRoot, name);
            if (Directory.Exists(p)) return p;
        }
        return null;
    }

    private static string? FindGitRoot(string startPath)
    {
        var dir = new DirectoryInfo(startPath);
        while (dir != null)
        {
            if (Directory.Exists(Path.Combine(dir.FullName, ".git"))) return dir.FullName;
            dir = dir.Parent;
        }
        return null;
    }
}
