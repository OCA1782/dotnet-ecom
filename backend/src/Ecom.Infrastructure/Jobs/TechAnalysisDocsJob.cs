using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using System.Text;

namespace Ecom.Infrastructure.Jobs;

public class TechAnalysisDocsJob(
    IServiceScopeFactory scopeFactory,
    IWebHostEnvironment env,
    IConfiguration config,
    IMemoryCache cache) : IJobRunner
{
    public string Name => "TechAnalysisDocsJob";
    public string Description => "Sistem metrikleri ve servis durumlarından Teknik Analiz belgesini otomatik günceller";
    public int IntervalMinutes => 1440; // daily

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await log("Teknik analiz belgesi oluşturuluyor...");

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var pendingOutbox = await db.OutboxMessages.CountAsync(m => m.ProcessedAt == null, ct);
        var failedOutbox = await db.OutboxMessages.CountAsync(m => m.ProcessedAt == null && m.Error != null, ct);

        var last7 = DateTime.UtcNow.AddDays(-7);
        var recentErrors = await db.ErrorLogs.CountAsync(e => e.CreatedDate >= last7, ct);
        var recentAuditLogs = await db.AuditLogs.CountAsync(a => a.CreatedDate >= last7, ct);

        var jobRunsLast7 = await db.JobLogs
            .Where(j => j.StartedAt >= last7)
            .GroupBy(j => j.JobName)
            .Select(g => new
            {
                Job = g.Key,
                Total = g.Count(),
                Failed = g.Count(x => x.Status == "failed"),
                AvgMs = g.Average(x => (double?)x.DurationMs) ?? 0
            })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("# Teknik Analiz");
        sb.AppendLine();
        sb.AppendLine($"> Son güncelleme: {DateTime.UtcNow:dd.MM.yyyy HH:mm} UTC (otomatik)");
        sb.AppendLine();

        sb.AppendLine("## Sistem Özeti");
        sb.AppendLine();
        sb.AppendLine("| Bileşen | Değer |");
        sb.AppendLine("|---------|-------|");
        sb.AppendLine($"| Bekleyen Outbox Mesajı | {pendingOutbox} ({failedOutbox} hatalı) |");
        sb.AppendLine($"| Son 7 Gün Hata | {recentErrors} |");
        sb.AppendLine($"| Son 7 Gün Audit Log | {recentAuditLogs} |");
        sb.AppendLine();

        // System health from cache
        if (cache.TryGetValue<SystemHealthSnapshot>("jobs:system-health", out var health) && health is not null)
        {
            sb.AppendLine("## Servis Sağlığı");
            sb.AppendLine();
            sb.AppendLine($"| Servis | Durum | Gecikme |");
            sb.AppendLine($"|--------|-------|---------|");
            sb.AppendLine($"| Veritabanı | {health.Database.Status} | {health.Database.LatencyMs}ms |");
            sb.AppendLine($"| RabbitMQ | {health.RabbitMQ.Status} | {health.RabbitMQ.LatencyMs}ms |");
            sb.AppendLine($"| SMTP | {health.Smtp.Status} | {health.Smtp.LatencyMs}ms |");
            sb.AppendLine($"| Genel API | {health.ApiStatus} | - |");
            sb.AppendLine();
        }

        // Queue stats from cache
        if (cache.TryGetValue<QueueStats>("jobs:queue-stats", out var queues) && queues is not null)
        {
            sb.AppendLine("## Kuyruk Durumu");
            sb.AppendLine();
            sb.AppendLine($"- **Bekleyen Outbox:** {queues.OutboxPending}");
            sb.AppendLine($"- **Bugün İşlenen Outbox:** {queues.OutboxProcessedToday}");
            sb.AppendLine($"- **Başarısız Outbox:** {queues.OutboxFailed}");
            if (queues.RabbitMQ?.Available == true && queues.RabbitMQ.Queues.Any())
            {
                sb.AppendLine();
                sb.AppendLine("| Kuyruk | Mesaj | Tüketici |");
                sb.AppendLine("|--------|-------|---------|");
                foreach (var q in queues.RabbitMQ.Queues)
                    sb.AppendLine($"| {q.Name} | {q.Messages} | {q.Consumers} |");
            }
            sb.AppendLine();
        }

        // Frontend health from cache
        if (cache.TryGetValue<FrontendHealthSnapshot>("jobs:frontend-health", out var frontend) && frontend is not null)
        {
            sb.AppendLine("## Frontend Sağlığı");
            sb.AppendLine();
            sb.AppendLine($"| Servis | Durum | Kod | Gecikme |");
            sb.AppendLine($"|--------|-------|-----|---------|");
            sb.AppendLine($"| Customer ({frontend.Customer.Url}) | {frontend.Customer.Status} | {frontend.Customer.HttpCode?.ToString() ?? "-"} | {frontend.Customer.LatencyMs}ms |");
            sb.AppendLine($"| Admin ({frontend.Admin.Url}) | {frontend.Admin.Status} | {frontend.Admin.HttpCode?.ToString() ?? "-"} | {frontend.Admin.LatencyMs}ms |");
            sb.AppendLine();
        }

        // Job performance section
        if (jobRunsLast7.Any())
        {
            sb.AppendLine("## Son 7 Gün — Job Performansı");
            sb.AppendLine();
            sb.AppendLine("| Job | Toplam | Başarısız | Ort. Süre |");
            sb.AppendLine("|-----|--------|-----------|-----------|");
            foreach (var j in jobRunsLast7.OrderBy(x => x.Job))
                sb.AppendLine($"| {j.Job} | {j.Total} | {j.Failed} | {(int)j.AvgMs}ms |");
            sb.AppendLine();
        }

        sb.AppendLine("## Teknoloji Yığını");
        sb.AppendLine();
        sb.AppendLine("- **Backend:** .NET 10, ASP.NET Core, Entity Framework Core");
        sb.AppendLine("- **Veritabanı:** SQL Server");
        sb.AppendLine("- **Mesaj Kuyruğu:** RabbitMQ + Outbox Pattern");
        sb.AppendLine("- **Frontend:** Next.js 15 (Customer :3000, Admin :3001)");
        sb.AppendLine("- **Cache:** IMemoryCache");
        sb.AppendLine("- **Kimlik Doğrulama:** JWT + Refresh Token");
        sb.AppendLine();

        var content = sb.ToString();

        var repoRoot = FindGitRoot(env.ContentRootPath);
        var docsPath = repoRoot is not null ? ResolveDocsPath(repoRoot) : null;

        if (docsPath is not null)
        {
            var filePath = Path.Combine(docsPath, "teknik-analiz.md");
            await File.WriteAllTextAsync(filePath, content, Encoding.UTF8, ct);
            cache.Remove("gh:docs:file:teknik-analiz.md");
            cache.Remove("gh:docs:files");
            await log($"  ✓ teknik-analiz.md güncellendi ({pendingOutbox} outbox, {recentErrors} hata/7gün)");
        }
        else
        {
            cache.Set("docs:tech-analysis", content, TimeSpan.FromHours(25));
            await log($"  ✓ Teknik analiz cache'e yazıldı ({pendingOutbox} outbox, {recentErrors} hata/7gün)");
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
