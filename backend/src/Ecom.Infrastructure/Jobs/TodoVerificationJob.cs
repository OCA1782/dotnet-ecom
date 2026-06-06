using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Text;

namespace Ecom.Infrastructure.Jobs;

public record VerificationItem(string Category, string Name, bool Passed, string Detail, long LatencyMs);

public record VerificationSnapshot(
    DateTime CheckedAt,
    int Total,
    int Passed,
    int Failed,
    List<VerificationItem> Items);

public class TodoVerificationJob(
    IServiceScopeFactory scopeFactory,
    IHttpClientFactory httpFactory,
    IMemoryCache cache,
    IConfiguration config,
    IWebHostEnvironment env) : IJobRunner
{
    public string Name => "TodoVerificationJob";
    public string Description => "TODO_DONE.md'deki tamamlanan maddeleri periyodik olarak doğrular, VERIFICATION_LOG.md'ye yazar";
    public int IntervalMinutes => 720;

    public const string CacheKey = "jobs:todo-verification";

    private record CodeCheck(string Category, string Name, string RelPath, string Pattern);

    private static readonly CodeCheck[] CodeChecks =
    [
        new("Multi-tenant", "GetDashboardQuery: ICurrentUserService", "backend/src/Ecom.Application/Features/Admin/Queries/GetDashboardQuery.cs", "ICurrentUserService"),
        new("Multi-tenant", "GetDashboardQuery: managedUserIds", "backend/src/Ecom.Application/Features/Admin/Queries/GetDashboardQuery.cs", "managedUserIds"),
        new("Multi-tenant", "GetDashboardQuery: tenant cache key", "backend/src/Ecom.Application/Features/Admin/Queries/GetDashboardQuery.cs", "dashboard:stats:"),
        new("Multi-tenant", "GetModuleStatsQuery: managedUserIds", "backend/src/Ecom.Application/Features/Admin/Queries/GetModuleStatsQuery.cs", "managedUserIds"),
        new("Multi-tenant", "GetNotificationsQuery: managedUserIds", "backend/src/Ecom.Application/Features/Admin/Queries/GetNotificationsQuery.cs", "managedUserIds"),
        new("Multi-tenant", "GetProductSalesReportQuery: tenant filter", "backend/src/Ecom.Application/Features/Admin/Queries/GetProductSalesReportQuery.cs", "@AdminId IS NULL OR p.CreatedByAdminId"),
        new("Multi-tenant", "GetDocsActivityQuery: tenant filter", "backend/src/Ecom.Application/Features/Admin/Queries/GetDocsActivityQuery.cs", "managedUserIds"),
        new("Multi-tenant", "GetCouponUsagesQuery: tenant filter", "backend/src/Ecom.Application/Features/Admin/Coupons/GetCouponUsagesQuery.cs", "CreatedByAdminId"),
        new("Multi-tenant", "GetAllStockMovementsQuery: tenant filter", "backend/src/Ecom.Application/Features/Stocks/Queries/GetAllStockMovementsQuery.cs", "ownedProductIds"),
        new("Multi-tenant", "GetStockMovementsQuery: tenant filter", "backend/src/Ecom.Application/Features/Stocks/Queries/GetStockMovementsQuery.cs", "CreatedByAdminId"),
        new("Multi-tenant", "GetProductHistoryQuery: tenant filter", "backend/src/Ecom.Application/Features/Products/Queries/GetProductHistoryQuery.cs", "CreatedByAdminId"),
        new("Multi-tenant", "GetUserDetailsQuery: tenant filter", "backend/src/Ecom.Application/Features/Admin/Queries/GetUserDetailsQuery.cs", "accessible"),
        new("Multi-tenant", "Product.cs: CreatedByAdminId", "backend/src/Ecom.Domain/Entities/Product.cs", "CreatedByAdminId"),
        new("Multi-tenant", "Category.cs: CreatedByAdminId", "backend/src/Ecom.Domain/Entities/Category.cs", "CreatedByAdminId"),
        new("Multi-tenant", "Brand.cs: CreatedByAdminId", "backend/src/Ecom.Domain/Entities/Brand.cs", "CreatedByAdminId"),
        new("Multi-tenant", "User.cs: CreatedByAdminId", "backend/src/Ecom.Domain/Entities/User.cs", "CreatedByAdminId"),
        new("Multi-tenant", "ICurrentUserService: IsSuperAdmin", "backend/src/Ecom.Application/Common/Interfaces/ICurrentUserService.cs", "IsSuperAdmin"),
        new("Multi-tenant", "UploadController: CreatedByAdminId", "backend/src/Ecom.API/Controllers/Admin/UploadController.cs", "CreatedByAdminId"),
        new("Lisans", "LicenseAssignmentsController: UserRoles.AnyAsync (Include fix)", "backend/src/Ecom.API/Controllers/Admin/LicenseAssignmentsController.cs", "UserRoles.AnyAsync"),
        new("Frontend", "Admin error.tsx: backend error logging", "frontend/admin/src/app/error.tsx", "error-logs"),
        new("Frontend", "Customer error.tsx: backend error logging", "frontend/customer/src/app/error.tsx", "error-logs"),
        new("Jobs", "JobScheduler kayıtlı", "backend/src/Ecom.Infrastructure/Jobs/JobScheduler.cs", "IJobRunner"),
        new("Jobs", "TodoVerificationJob kayıtlı", "backend/src/Ecom.Infrastructure/DependencyInjection.cs", "TodoVerificationJob"),
        new("SEO", "sitemap.ts mevcut", "frontend/customer/src/app/sitemap.ts", "sitemap"),
        new("Lisans", "LicenseValidator: RSA", "backend/src/Ecom.Infrastructure/Security/LicenseValidator.cs", "RSA"),
    ];

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await log("TODO doğrulama kontrolleri başlıyor...");
        var items = new List<VerificationItem>();

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var apiBase = config["VerificationJob:ApiBaseUrl"] ?? "http://localhost:5124";
        var projectRoot = ResolveProjectRoot();

        // API checks
        await log("  [API] Endpoint kontrolleri...");
        items.AddRange(await CheckApiAsync(apiBase, ct));

        // Code checks
        if (projectRoot != null)
        {
            await log("  [KOD] Kaynak kodu kontrolleri...");
            items.AddRange(CheckCode(projectRoot));
        }
        else
        {
            await log("  [KOD] ⚠ Proje kök dizini bulunamadı — kod kontrolleri atlandı");
        }

        // DB checks
        await log("  [DB] Veritabanı kontrolleri...");
        items.AddRange(await CheckDbAsync(db, ct));

        var passed = items.Count(i => i.Passed);
        var failed = items.Count(i => !i.Passed);
        var snapshot = new VerificationSnapshot(DateTime.UtcNow, items.Count, passed, failed, items);
        cache.Set(CacheKey, snapshot, TimeSpan.FromHours(13));

        await log($"  Toplam: {items.Count} | Başarılı: {passed} | Başarısız: {failed}");
        foreach (var f in items.Where(i => !i.Passed))
            await log($"    ✗ [{f.Category}] {f.Name}: {f.Detail}");

        await WriteLogAsync(snapshot, projectRoot, log, ct);
    }

    private async Task<List<VerificationItem>> CheckApiAsync(string apiBase, CancellationToken ct)
    {
        var results = new List<VerificationItem>();
        var endpoints = new[]
        {
            ("/health", 200, "GET /health → 200"),
            ("/api/products", 200, "GET /api/products → 200"),
            ("/api/categories", 200, "GET /api/categories → 200"),
            ("/api/brands", 200, "GET /api/brands → 200"),
            ("/api/admin/dashboard", 401, "GET /api/admin/dashboard → 401 (auth guard)"),
            ("/api/orders/admin/list", 401, "GET /api/orders/admin/list → 401 (auth guard)"),
            ("/api/admin/users", 401, "GET /api/admin/users → 401 (auth guard)"),
            ("/api/admin/coupons", 401, "GET /api/admin/coupons → 401 (auth guard)"),
            ("/api/admin/shipments", 401, "GET /api/admin/shipments → 401 (auth guard)"),
            ("/api/admin/invoices", 401, "GET /api/admin/invoices → 401 (auth guard)"),
        };

        using var client = httpFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(8);

        foreach (var (path, expected, name) in endpoints)
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            try
            {
                var resp = await client.GetAsync(apiBase + path, ct);
                sw.Stop();
                var actual = (int)resp.StatusCode;
                var ok = actual == expected;
                results.Add(new VerificationItem("API", name, ok,
                    ok ? $"HTTP {actual} ({sw.ElapsedMilliseconds}ms)" : $"Beklenen: {expected}, Gelen: {actual}",
                    sw.ElapsedMilliseconds));
            }
            catch (Exception ex)
            {
                sw.Stop();
                results.Add(new VerificationItem("API", name, false, $"Bağlantı hatası: {ex.Message}", sw.ElapsedMilliseconds));
            }
        }

        return results;
    }

    private List<VerificationItem> CheckCode(string root)
    {
        var results = new List<VerificationItem>();
        var sep = Path.DirectorySeparatorChar;

        foreach (var check in CodeChecks)
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            var path = Path.Combine(root, check.RelPath.Replace('/', sep));
            try
            {
                if (!File.Exists(path))
                {
                    results.Add(new VerificationItem(check.Category, check.Name, false, $"Dosya bulunamadı: {check.RelPath}", sw.ElapsedMilliseconds));
                    continue;
                }
                var content = File.ReadAllText(path);
                sw.Stop();
                var ok = content.Contains(check.Pattern, StringComparison.Ordinal);
                results.Add(new VerificationItem(check.Category, check.Name, ok,
                    ok ? $"'{check.Pattern}' bulundu" : $"'{check.Pattern}' bulunamadı — içerik eksik",
                    sw.ElapsedMilliseconds));
            }
            catch (Exception ex)
            {
                results.Add(new VerificationItem(check.Category, check.Name, false, $"Okuma hatası: {ex.Message}", sw.ElapsedMilliseconds));
            }
        }

        // Migration check
        var migDir = Path.Combine(root, "backend", "src", "Ecom.Infrastructure", "Persistence", "Migrations");
        if (Directory.Exists(migDir))
        {
            var hasMig = Directory.GetFiles(migDir, "*AddCreatedByAdminId*").Length > 0;
            results.Add(new VerificationItem("Multi-tenant", "Migration: AddCreatedByAdminId mevcut",
                hasMig, hasMig ? "Migration dosyası mevcut" : "Migration dosyası bulunamadı", 0));
        }

        return results;
    }

    private async Task<List<VerificationItem>> CheckDbAsync(IApplicationDbContext db, CancellationToken ct)
    {
        var results = new List<VerificationItem>();
        var checks = new (string Name, Func<Task<int>> Fn)[]
        {
            ("Products tablosu", () => db.Products.CountAsync(ct)),
            ("Categories tablosu", () => db.Categories.CountAsync(ct)),
            ("Users tablosu", () => db.Users.CountAsync(ct)),
            ("JobLogs tablosu", () => db.JobLogs.CountAsync(ct)),
            ("Announcements tablosu", () => db.Announcements.CountAsync(ct)),
            ("Orders tablosu", () => db.Orders.CountAsync(ct)),
        };

        foreach (var (name, fn) in checks)
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            try
            {
                var count = await fn();
                sw.Stop();
                results.Add(new VerificationItem("DB", name, true, $"{count} kayıt ({sw.ElapsedMilliseconds}ms)", sw.ElapsedMilliseconds));
            }
            catch (Exception ex)
            {
                sw.Stop();
                results.Add(new VerificationItem("DB", name, false, $"DB hatası: {ex.Message}", sw.ElapsedMilliseconds));
            }
        }

        return results;
    }

    private string? ResolveProjectRoot()
    {
        var configured = config["VerificationJob:ProjectRoot"];
        if (!string.IsNullOrEmpty(configured) && Directory.Exists(configured))
            return configured;

        var dir = env.ContentRootPath;
        for (var i = 0; i < 8; i++)
        {
            if (Directory.Exists(Path.Combine(dir, "backend")) && Directory.Exists(Path.Combine(dir, "frontend")))
                return dir;
            var parent = Directory.GetParent(dir)?.FullName;
            if (parent == null || parent == dir) break;
            dir = parent;
        }
        return null;
    }

    private async Task WriteLogAsync(VerificationSnapshot snap, string? projectRoot, Func<string, Task> log, CancellationToken ct)
    {
        var logPath = config["VerificationJob:LogFilePath"];
        if (string.IsNullOrEmpty(logPath) && projectRoot != null)
        {
            var parent = Directory.GetParent(projectRoot)?.FullName;
            if (parent != null)
            {
                var docsDir = Path.Combine(parent, "dotnet-ecom-docs");
                if (Directory.Exists(docsDir))
                    logPath = Path.Combine(docsDir, "VERIFICATION_LOG.md");
            }
        }

        if (string.IsNullOrEmpty(logPath))
        {
            await log("  ⚠ VERIFICATION_LOG.md yolu bulunamadı — dosya yazılmadı");
            return;
        }

        var passRate = snap.Total > 0 ? (snap.Passed * 100 / snap.Total) : 0;
        var icon = passRate >= 100 ? "✅" : passRate >= 80 ? "⚠️" : "❌";

        var sb = new StringBuilder();
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine($"## {snap.CheckedAt:yyyy-MM-dd HH:mm} UTC — {icon} {snap.Passed}/{snap.Total} başarılı ({passRate}%)");
        sb.AppendLine();

        foreach (var group in snap.Items.GroupBy(i => i.Category))
        {
            sb.AppendLine($"### {group.Key}");
            sb.AppendLine();
            foreach (var item in group)
                sb.AppendLine($"- {(item.Passed ? "✅" : "❌")} **{item.Name}** — {item.Detail}");
            sb.AppendLine();
        }

        try
        {
            if (File.Exists(logPath))
            {
                var existing = await File.ReadAllTextAsync(logPath, ct);
                var insertIdx = existing.IndexOf("\n---", StringComparison.Ordinal);
                var newContent = insertIdx >= 0
                    ? existing[..insertIdx] + sb.ToString() + existing[insertIdx..]
                    : existing + sb.ToString();
                await File.WriteAllTextAsync(logPath, newContent, ct);
            }
            else
            {
                await File.AppendAllTextAsync(logPath, sb.ToString(), ct);
            }
            await log($"  ✓ Log yazıldı → {logPath}");
        }
        catch (Exception ex)
        {
            await log($"  ✗ Log yazılamadı: {ex.Message}");
        }
    }
}
