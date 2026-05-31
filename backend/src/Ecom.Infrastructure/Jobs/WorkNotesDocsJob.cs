using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using System.Text;

namespace Ecom.Infrastructure.Jobs;

public class WorkNotesDocsJob(
    IServiceScopeFactory scopeFactory,
    IWebHostEnvironment env,
    IConfiguration config,
    IMemoryCache cache) : IJobRunner
{
    public string Name => "WorkNotesDocsJob";
    public string Description => "Son iş logları ve hatalardan Çalışma Notları belgesini otomatik günceller";
    public int IntervalMinutes => 5;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await log("Çalışma notları oluşturuluyor...");

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var since = DateTime.UtcNow.AddHours(-24);

        var recentJobs = await db.JobLogs
            .Where(j => j.StartedAt >= since)
            .OrderByDescending(j => j.StartedAt)
            .Take(30)
            .Select(j => new { j.JobName, j.Status, j.StartedAt, j.DurationMs, j.ErrorMessage })
            .ToListAsync(ct);

        var recentErrors = await db.ErrorLogs
            .Where(e => e.CreatedDate >= since)
            .OrderByDescending(e => e.CreatedDate)
            .Take(20)
            .Select(e => new { e.Message, e.Source, CreatedAt = e.CreatedDate })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("# Çalışma Notları");
        sb.AppendLine();
        sb.AppendLine($"> Son güncelleme: {DateTime.UtcNow:dd.MM.yyyy HH:mm} UTC (otomatik)");
        sb.AppendLine();

        // Job summary section
        sb.AppendLine("## Son 24 Saat — Job Çalışmaları");
        sb.AppendLine();
        if (recentJobs.Count == 0)
        {
            sb.AppendLine("_Son 24 saatte çalışan job yok._");
        }
        else
        {
            var byJob = recentJobs.GroupBy(j => j.JobName);
            sb.AppendLine("| Job | Çalışma | Başarı | Başarısız | Ort. Süre |");
            sb.AppendLine("|-----|---------|--------|-----------|-----------|");
            foreach (var group in byJob)
            {
                var runs = group.ToList();
                var success = runs.Count(r => r.Status == "success");
                var failed = runs.Count(r => r.Status == "failed");
                var avgMs = runs.Where(r => r.DurationMs.HasValue).Select(r => r.DurationMs!.Value).DefaultIfEmpty(0).Average();
                sb.AppendLine($"| {group.Key} | {runs.Count} | {success} | {failed} | {(int)avgMs}ms |");
            }
        }
        sb.AppendLine();

        // Error section
        sb.AppendLine("## Son 24 Saat — Hatalar");
        sb.AppendLine();
        if (recentErrors.Count == 0)
        {
            sb.AppendLine("_Son 24 saatte hata yok._ ✓");
        }
        else
        {
            sb.AppendLine($"**Toplam {recentErrors.Count} hata kaydedildi.**");
            sb.AppendLine();
            foreach (var err in recentErrors.Take(10))
            {
                var time = err.CreatedAt.ToString("HH:mm:ss");
                var msg = err.Message?.Length > 120 ? err.Message[..120] + "..." : err.Message;
                sb.AppendLine($"- `{time}` [{err.Source ?? "?"}] {msg}");
            }
            if (recentErrors.Count > 10)
                sb.AppendLine($"_...ve {recentErrors.Count - 10} hata daha_");
        }
        sb.AppendLine();

        // System health section from cache
        if (cache.TryGetValue<SystemHealthSnapshot>("jobs:system-health", out var health) && health is not null)
        {
            sb.AppendLine("## Sistem Sağlık Durumu");
            sb.AppendLine();
            sb.AppendLine($"- **Genel Durum:** {health.ApiStatus}");
            sb.AppendLine($"- **Kontrol Zamanı:** {health.CheckedAt:dd.MM.yyyy HH:mm} UTC");
            sb.AppendLine($"- **DB:** {health.Database.Status} ({health.Database.LatencyMs}ms)");
            sb.AppendLine($"- **RabbitMQ:** {health.RabbitMQ.Status}");
            sb.AppendLine($"- **SMTP:** {health.Smtp.Status}");
            sb.AppendLine();
        }

        var content = sb.ToString();

        var repoRoot = FindGitRoot(env.ContentRootPath);
        var docsPath = repoRoot is not null ? ResolveDocsPath(repoRoot) : null;

        if (docsPath is not null)
        {
            var filePath = Path.Combine(docsPath, "calisma-notlari.md");
            await File.WriteAllTextAsync(filePath, content, Encoding.UTF8, ct);
            cache.Remove("gh:docs:file:calisma-notlari.md");
            cache.Remove("gh:docs:files");
            await log($"  ✓ calisma-notlari.md güncellendi ({recentJobs.Count} job, {recentErrors.Count} hata)");
        }
        else
        {
            cache.Set("docs:work-notes", content, TimeSpan.FromMinutes(6));
            await log($"  ✓ Çalışma notları cache'e yazıldı ({recentJobs.Count} job, {recentErrors.Count} hata)");
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
