using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Infrastructure.Jobs;

public class AdminLintAuditJob(IServiceScopeFactory scopeFactory, IWebHostEnvironment env) : IJobRunner
{
    public string Name => "AdminLintAuditJob";
    public string Description => "Admin panel lint uyarılarını tarar, öncelikli aksiyon listesini TODO_PENDING.md'ye yazar";
    public int IntervalMinutes => 1440;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        var repoSettings = await LoadSiteSettingsAsync(ct);
        await log("Admin lint denetimi başlatılıyor...");

        var repoRoot = FindGitRoot(env.ContentRootPath);
        if (repoRoot is null)
        {
            await log("  ⚠ Git repo kökü bulunamadı");
            return;
        }

        var adminRoot = Path.Combine(repoRoot, "frontend", "admin");
        if (!Directory.Exists(adminRoot))
        {
            await log("  ⚠ frontend/admin dizini bulunamadı");
            return;
        }

        var eslint = Path.Combine(
            adminRoot,
            "node_modules",
            ".bin",
            OperatingSystem.IsWindows() ? "eslint.cmd" : "eslint");

        if (!File.Exists(eslint))
        {
            await log("  ⚠ eslint yürütülebilir dosyası bulunamadı");
            return;
        }

        await log("  ESLint JSON çıktısı toplanıyor...");
        var result = await RunEslintAsync(eslint, adminRoot, ct);
        await log($"  Bulunan uyarı: {result.Warnings} | Hata: {result.Errors} | Dosya: {result.FilesWithIssues}");

        foreach (var issue in result.Issues.Take(12))
            await log($"    - {issue.File}:{issue.Line} [{issue.Rule}] {issue.Message}");

        var todoPath = ResolveTodoPath(repoRoot, repoSettings);
        var todoContent = BuildTodoPending(repoRoot, result);
        await File.WriteAllTextAsync(todoPath, todoContent, Encoding.UTF8, ct);

        await log($"  ✓ TODO_PENDING.md güncellendi ({result.Issues.Count} açık lint maddesi)");
    }

    private async Task<LintRunResult> RunEslintAsync(string eslintPath, string adminRoot, CancellationToken ct)
    {
        var psi = new ProcessStartInfo(eslintPath)
        {
            WorkingDirectory = adminRoot,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        psi.ArgumentList.Add("src");
        psi.ArgumentList.Add("--format");
        psi.ArgumentList.Add("json");

        using var proc = Process.Start(psi);
        if (proc is null)
            return new LintRunResult([], 0, 0, 0);

        var stdoutTask = proc.StandardOutput.ReadToEndAsync();
        var stderrTask = proc.StandardError.ReadToEndAsync();
        await proc.WaitForExitAsync(ct);

        var stdout = await stdoutTask;
        await stderrTask;

        var issues = ParseResults(stdout, adminRoot);
        var warnings = issues.Count(i => i.Severity == 1);
        var errors = issues.Count(i => i.Severity == 2);
        var filesWithIssues = issues.Select(i => i.File).Distinct(StringComparer.OrdinalIgnoreCase).Count();

        return new LintRunResult(issues, warnings, errors, filesWithIssues);
    }

    private static List<LintIssue> ParseResults(string stdout, string adminRoot)
    {
        try
        {
            var results = JsonSerializer.Deserialize<EslintFileResult[]>(stdout, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            }) ?? [];

            return results
                .SelectMany(file =>
                {
                    var relative = NormalizeRelative(adminRoot, file.FilePath);
                    return file.Messages
                        .Where(m => m.Severity is 1 or 2)
                        .Select(m => new LintIssue(
                            relative,
                            m.Line,
                            m.Column,
                            m.RuleId ?? "unknown",
                            m.Message,
                            m.Severity,
                            SuggestAction(relative, m.RuleId, m.Message)));
                })
                .OrderByDescending(i => i.Severity)
                .ThenBy(i => i.File, StringComparer.OrdinalIgnoreCase)
                .ThenBy(i => i.Line)
                .ToList();
        }
        catch
        {
            return [];
        }
    }

    private static string BuildTodoPending(string repoRoot, LintRunResult result)
    {
        var sb = new StringBuilder();
        sb.AppendLine("# TODO Pending");
        sb.AppendLine();
        sb.AppendLine($"> Son güncelleme: {DateTime.UtcNow:dd.MM.yyyy HH:mm} UTC (AdminLintAuditJob)");
        sb.AppendLine();
        sb.AppendLine("## Özet");
        sb.AppendLine();
        sb.AppendLine("| Alan | Değer |");
        sb.AppendLine("| --- | ---: |");
        sb.AppendLine($"| Toplam uyarı | {result.Warnings} |");
        sb.AppendLine($"| Toplam hata | {result.Errors} |");
        sb.AppendLine($"| Etkilenen dosya | {result.FilesWithIssues} |");
        sb.AppendLine($"| Komut | `frontend/admin/node_modules/.bin/eslint src --format json` |");
        sb.AppendLine();
        sb.AppendLine("## Öncelikli Aksiyonlar");
        sb.AppendLine();

        var ordered = result.Issues
            .GroupBy(i => i.File, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => GetPriority(g.Key))
            .ThenBy(g => g.Key, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var index = 1;
        foreach (var group in ordered)
        {
            sb.AppendLine($"{index}. `{group.Key}`");
            foreach (var issue in group.OrderByDescending(i => i.Severity).ThenBy(i => i.Line))
                sb.AppendLine($"   - [ ] {issue.SuggestedAction}");
            sb.AppendLine();
            index++;
        }

        sb.AppendLine("## İlk Çalışma Sırası");
        sb.AppendLine();
        foreach (var item in ordered.Select(g => g.Key).ToList())
            sb.AppendLine($"- [ ] `{item}`");
        sb.AppendLine();

        sb.AppendLine("## Not");
        sb.AppendLine();
        sb.AppendLine("- Bu dosya `AdminLintAuditJob` tarafından güncellenir.");
        sb.AppendLine("- İlerleme, her dosya düzeltildikten sonra yeni lint koşusuyla yeniden değerlendirilmelidir.");

        return sb.ToString();
    }

    private static string NormalizeRelative(string adminRoot, string filePath)
    {
        var relative = Path.GetRelativePath(adminRoot, filePath);
        return relative.Replace('\\', '/');
    }

    private static string SuggestAction(string file, string? ruleId, string message)
    {
        if (ruleId is "@typescript-eslint/no-unused-vars")
            return $"`{file}` içindeki kullanılmayan import/değişkeni kaldır";

        if (ruleId is "react-hooks/exhaustive-deps" or "react-hooks/immutability" or "react-hooks/preserve-manual-memoization")
            return $"`{file}` için hook bağımlılıklarını düzelt veya effect/callback akışını yeniden yapılandır";

        if (ruleId is "@next/next/no-img-element")
            return $"`{file}` içinde `<img>` kullanımını `next/image` ile değiştir veya gerekçeyi açıkla";

        if (message.Contains("Unused eslint-disable directive", StringComparison.OrdinalIgnoreCase))
            return $"`{file}` içindeki gereksiz `eslint-disable` satırını kaldır";

        return $"`{file}` içinde lint uyarısını gider: {message}";
    }

    private async Task<Dictionary<string, string>> LoadSiteSettingsAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        return await db.SiteSettings.ToDictionaryAsync(s => s.Key, s => s.Value, ct);
    }

    private string ResolveTodoPath(string repoRoot, IReadOnlyDictionary<string, string> siteSettings)
    {
        var configured = ResolveSetting(siteSettings, "AdminLintAudit:TodoPath");
        if (string.IsNullOrWhiteSpace(configured))
            return Path.Combine(repoRoot, "TODO_PENDING.md");
        return Path.IsPathRooted(configured) ? configured : Path.Combine(repoRoot, configured);
    }

    private string? ResolveSetting(IReadOnlyDictionary<string, string> siteSettings, string key) =>
        siteSettings.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : null;

    private static int GetPriority(string file) => file switch
    {
        "src/app/(admin)/joblar/page.tsx" => 1,
        "src/app/(admin)/takip/page.tsx" => 2,
        "src/app/(admin)/servisler/page.tsx" => 3,
        "src/app/(admin)/kullanicilar/[id]/page.tsx" => 4,
        _ => 100,
    };

    private static string? FindGitRoot(string startPath)
    {
        var dir = new DirectoryInfo(startPath);
        while (dir != null)
        {
            if (Directory.Exists(Path.Combine(dir.FullName, ".git")))
                return dir.FullName;
            dir = dir.Parent;
        }
        return null;
    }

    private sealed record EslintFileResult(string FilePath, EslintMessage[] Messages);

    private sealed record EslintMessage(string? RuleId, int Severity, string Message, int Line, int Column);

    private sealed record LintIssue(
        string File,
        int Line,
        int Column,
        string Rule,
        string Message,
        int Severity,
        string SuggestedAction);

    private sealed record LintRunResult(
        List<LintIssue> Issues,
        int Warnings,
        int Errors,
        int FilesWithIssues);
}
