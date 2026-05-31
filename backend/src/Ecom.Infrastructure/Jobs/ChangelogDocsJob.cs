using System.Diagnostics;
using System.Text;
using Microsoft.Extensions.Caching.Memory;

namespace Ecom.Infrastructure.Jobs;

public class ChangelogDocsJob(IWebHostEnvironment env, IConfiguration config, IMemoryCache cache) : IJobRunner
{
    public string Name => "ChangelogDocsJob";
    public string Description => "Git geçmişinden Değişiklik Günlüğü'nü otomatik günceller";
    public int IntervalMinutes => 5;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await log("Değişiklik günlüğü oluşturuluyor...");

        var repoRoot = FindGitRoot(env.ContentRootPath);
        if (repoRoot is null)
        {
            await log("  ⚠ Git repo bulunamadı");
            return;
        }

        var raw = RunGit(repoRoot, "log --format=\"%h|%an|%ad|%s\" --date=short -n 100");
        if (raw is null)
        {
            await log("  ⚠ git log çalıştırılamadı");
            return;
        }

        var sb = new StringBuilder();
        sb.AppendLine("# Değişiklik Günlüğü");
        sb.AppendLine();
        sb.AppendLine($"> Son güncelleme: {DateTime.UtcNow:dd.MM.yyyy HH:mm} UTC (otomatik)");
        sb.AppendLine();

        string? lastDate = null;
        foreach (var line in raw.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = line.Split('|', 4);
            if (parts.Length < 4) continue;
            var (hash, author, date, subject) = (parts[0], parts[1], parts[2], parts[3]);

            if (date != lastDate)
            {
                sb.AppendLine($"## {date}");
                sb.AppendLine();
                lastDate = date;
            }

            sb.AppendLine($"- **[{hash}]** {subject} _{author}_");
        }

        var content = sb.ToString();

        var docsPath = ResolveDocsPath(repoRoot);
        if (docsPath is not null)
        {
            var filePath = Path.Combine(docsPath, "degisiklik-gunlugu.md");
            await File.WriteAllTextAsync(filePath, content, Encoding.UTF8, ct);
            cache.Remove("gh:docs:file:degisiklik-gunlugu.md");
            cache.Remove("gh:docs:files");
            await log($"  ✓ degisiklik-gunlugu.md güncellendi ({content.Length} karakter)");
        }
        else
        {
            cache.Set("docs:changelog", content, TimeSpan.FromMinutes(6));
            await log($"  ✓ Changelog cache'e yazıldı ({content.Length} karakter)");
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

    private static string? RunGit(string workDir, string args)
    {
        try
        {
            var psi = new ProcessStartInfo("git", args)
            {
                WorkingDirectory = workDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var proc = Process.Start(psi)!;
            var output = proc.StandardOutput.ReadToEnd();
            proc.WaitForExit(8_000);
            return output;
        }
        catch { return null; }
    }
}
