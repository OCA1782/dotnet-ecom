using System.Text;
using System.Text.RegularExpressions;
using Ecom.Application.Common.Interfaces;
using Ecom.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Ecom.Infrastructure.Jobs;

public class I18nPageScannerJob(
    IServiceScopeFactory scopeFactory,
    IWebHostEnvironment env,
    IConfiguration config,
    IMemoryCache cache,
    IServiceStateManager stateManager) : IJobRunner
{
    public string Name => "I18nPageScannerJob";
    public string Description => "Admin sayfalarını i18n kapsamı için tarar, güvenli modda log/cache raporu üretir, gerekirse builder'ı tetikler";
    public int IntervalMinutes => 720;

    private static readonly Regex TurkishCharPattern = new(
        "[ğüşıöçİĞÜŞÖÇ]", RegexOptions.Compiled);

    private static readonly Regex TCallPattern = new(
        @"\bt\s*\(", RegexOptions.Compiled);

    private static readonly Regex TurkishStringLiteral = new(
        "\"([^\"\\n\\\\]*[ğüşıöçİĞÜŞÖÇ][^\"\\n\\\\]*)\"",
        RegexOptions.Compiled);

    private record PageResult(
        string PageName,
        int TotalTurkishLines,
        int TranslatedLines,
        int HardcodedLines,
        List<(int LineNo, string Sample)> Samples);

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        var siteSettings = await LoadSiteSettingsAsync(ct);
        await log("i18n Page Scanner başlıyor...");
        await log($"  Mod: docs yazımı={(AllowDocsWrite(siteSettings) ? "açık" : "kapalı")}, builder tetikleme={(AllowBuilderTrigger(siteSettings) ? "açık" : "kapalı")}");

        var projectRoot = ResolveProjectRoot(siteSettings);
        if (projectRoot is null)
        {
            await log("  ⚠ Proje kök dizini bulunamadı");
            return;
        }

        var adminPagesDir = Path.Combine(projectRoot, "frontend", "admin", "src", "app", "(admin)");
        if (!Directory.Exists(adminPagesDir))
        {
            await log($"  ⚠ Admin sayfaları dizini bulunamadı");
            return;
        }
        await log($"  Proje kökü: {projectRoot}");

        var tsxFiles = Directory.GetFiles(adminPagesDir, "*.tsx", SearchOption.AllDirectories);
        await log($"  ✓ {tsxFiles.Length} .tsx dosyası taranıyor...");

        var results = new List<PageResult>();
        foreach (var file in tsxFiles)
        {
            ct.ThrowIfCancellationRequested();
            results.Add(await ScanFileAsync(file, adminPagesDir, ct));
        }

        var totalPages = results.Count;
        var fullyTranslated = results.Count(r => r.HardcodedLines == 0 && r.TotalTurkishLines > 0);
        var partiallyTranslated = results.Count(r => r.HardcodedLines > 0 && r.TranslatedLines > 0);
        var untranslated = results.Count(r => r.HardcodedLines > 0 && r.TranslatedLines == 0);
        var noTurkish = results.Count(r => r.TotalTurkishLines == 0);
        var totalHardcoded = results.Sum(r => r.HardcodedLines);
        var totalTranslated = results.Sum(r => r.TranslatedLines);
        var coveragePct = (totalTranslated + totalHardcoded) > 0
            ? totalTranslated * 100 / (totalTranslated + totalHardcoded)
            : 100;

        await log($"  Toplam: {totalPages} sayfa | ✅ Tam: {fullyTranslated} | ⚠ Kısmi: {partiallyTranslated} | ❌ Yok: {untranslated} | — Türkçe yok: {noTurkish}");
        await log($"  Kapsam: %{coveragePct} ({totalTranslated} çevrilmiş / {totalHardcoded} hardcoded satır)");

        var docsPath = ResolveDocsPath(projectRoot, siteSettings);
        if (docsPath is not null && AllowDocsWrite(siteSettings))
        {
            var dateStr = DateTime.UtcNow.ToString("yyyy-MM-dd");
            var scanFile = Path.Combine(docsPath, $"i18n-scan-{dateStr}.md");
            var changelogFile = Path.Combine(docsPath, "i18n-changelog.md");
            var statusFile = Path.Combine(docsPath, "I18N_STATUS.md");

            await File.WriteAllTextAsync(scanFile, BuildScanReport(results, coveragePct), Encoding.UTF8, ct);
            await log($"  ✓ i18n-scan-{dateStr}.md yazıldı");

            await File.AppendAllTextAsync(changelogFile, BuildChangelogEntry(results, totalHardcoded, totalTranslated, coveragePct), Encoding.UTF8, ct);
            await log($"  ✓ i18n-changelog.md güncellendi");

            await UpdateStatusDoc(statusFile, results, coveragePct, totalPages, fullyTranslated, partiallyTranslated, untranslated, totalHardcoded, totalTranslated, log, ct);
        }
        else if (docsPath is not null)
        {
            await log("  ℹ Docs yazımı kapalı — I18nJob:AllowDocsWrite=true olmadan rapor dosyası üretilmedi");
        }
        else
        {
            await log("  ⚠ dotnet-ecom-docs dizini bulunamadı — dosyalar yazılmadı");
        }

        // Cache for comparison on next run
        var prevCount = cache.Get<int?>("i18n:scan:hardcodedCount");
        cache.Set("i18n:scan:hardcodedCount", totalHardcoded, TimeSpan.FromDays(2));
        cache.Set("i18n:scan:coveragePct", coveragePct, TimeSpan.FromDays(2));

        if (totalHardcoded > 0)
        {
            var delta = prevCount.HasValue ? $" (önceki: {prevCount.Value})" : "";
            await log($"  → {totalHardcoded} hardcoded satır tespit edildi{delta}");
            if (!AllowBuilderTrigger(siteSettings))
            {
                await log("  ℹ Builder tetikleme kapalı — I18nJob:TriggerBuilderFromScanner=true olmadan builder kuyruğa alınmadı");
            }
            else try
            {
                stateManager.Trigger("I18nDictionaryBuilderJob");
                await log("  ✓ I18nDictionaryBuilderJob tetiklendi (30s içinde çalışacak)");
            }
            catch (Exception ex)
            {
                await log($"  ⚠ Builder tetiklenemedi: {ex.Message}");
            }
        }
        else
        {
            await log("  ✅ Tüm sayfalar tam çevrilmiş — builder tetiklenmedi");
        }
    }

    private async Task<PageResult> ScanFileAsync(string filePath, string adminPagesDir, CancellationToken ct)
    {
        var rel = Path.GetRelativePath(adminPagesDir, filePath).Replace("\\", "/");
        var pageName = rel.Replace("/page.tsx", "").TrimStart('/');

        var lines = await File.ReadAllLinesAsync(filePath, Encoding.UTF8, ct);
        var totalTurkish = 0;
        var translated = 0;
        var hardcoded = 0;
        var samples = new List<(int, string)>();

        for (var i = 0; i < lines.Length; i++)
        {
            var line = lines[i];
            var trimmed = line.TrimStart();

            if (trimmed.StartsWith("//") || trimmed.StartsWith("*") || trimmed.StartsWith("/*") || trimmed.StartsWith("import "))
                continue;
            if (!TurkishCharPattern.IsMatch(line)) continue;

            totalTurkish++;

            if (TCallPattern.IsMatch(line))
            {
                translated++;
            }
            else
            {
                var matches = TurkishStringLiteral.Matches(line);
                if (matches.Count > 0)
                {
                    hardcoded++;
                    if (samples.Count < 5)
                    {
                        var sample = matches[0].Groups[1].Value.Trim();
                        if (sample.Length > 50) sample = sample[..47] + "...";
                        samples.Add((i + 1, sample));
                    }
                }
                else
                {
                    translated++;
                }
            }
        }

        return new PageResult(pageName, totalTurkish, translated, hardcoded, samples);
    }

    private static string BuildScanReport(List<PageResult> results, int coveragePct)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"# i18n Tarama Raporu — {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC");
        sb.AppendLine();
        sb.AppendLine("> Otomatik oluşturuldu: I18nPageScannerJob");
        sb.AppendLine();
        sb.AppendLine("## Özet");
        sb.AppendLine();
        sb.AppendLine("| Metrik | Değer |");
        sb.AppendLine("|--------|-------|");
        sb.AppendLine($"| Genel Kapsam | %{coveragePct} |");
        sb.AppendLine($"| Toplam Sayfa | {results.Count} |");
        sb.AppendLine($"| Tam Çevrilmiş (✅) | {results.Count(r => r.HardcodedLines == 0 && r.TotalTurkishLines > 0)} |");
        sb.AppendLine($"| Kısmi Çeviri (⚠️) | {results.Count(r => r.HardcodedLines > 0 && r.TranslatedLines > 0)} |");
        sb.AppendLine($"| Çeviri Yok (❌) | {results.Count(r => r.HardcodedLines > 0 && r.TranslatedLines == 0)} |");
        sb.AppendLine($"| Toplam Hardcoded Satır | {results.Sum(r => r.HardcodedLines)} |");
        sb.AppendLine($"| Toplam Çevrilmiş Satır | {results.Sum(r => r.TranslatedLines)} |");
        sb.AppendLine();
        sb.AppendLine("## Sayfa Detayları");
        sb.AppendLine();

        foreach (var r in results.OrderByDescending(r => r.HardcodedLines).ThenBy(r => r.PageName))
        {
            var cov = r.TotalTurkishLines > 0 ? r.TranslatedLines * 100 / r.TotalTurkishLines : 100;
            var icon = r.HardcodedLines == 0 ? (r.TotalTurkishLines > 0 ? "✅" : "—") : cov >= 50 ? "⚠️" : "❌";

            sb.AppendLine($"### {icon} `{r.PageName}`");
            sb.AppendLine();
            sb.AppendLine($"- **Kapsam:** %{cov} ({r.TranslatedLines} çevrilmiş / {r.TotalTurkishLines} toplam)");
            sb.AppendLine($"- **Hardcoded satır:** {r.HardcodedLines}");

            if (r.Samples.Count > 0)
            {
                sb.AppendLine("- **Örnekler:**");
                foreach (var (lineNo, sample) in r.Samples)
                    sb.AppendLine($"  - Satır {lineNo}: `\"{sample}\"`");
            }

            sb.AppendLine();
        }

        return sb.ToString();
    }

    private static string BuildChangelogEntry(
        List<PageResult> results, int totalHardcoded, int totalTranslated, int coveragePct)
    {
        var sb = new StringBuilder();
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine($"## {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC — %{coveragePct} kapsam");
        sb.AppendLine();
        sb.AppendLine($"Çevrilmiş: **{totalTranslated}** satır | Hardcoded: **{totalHardcoded}** satır");
        sb.AppendLine();

        var hardcodedPages = results.Where(r => r.HardcodedLines > 0).OrderByDescending(r => r.HardcodedLines).Take(10).ToList();
        if (hardcodedPages.Count > 0)
        {
            sb.AppendLine("| Sayfa | Hardcoded | Kapsam |");
            sb.AppendLine("|-------|-----------|--------|");
            foreach (var r in hardcodedPages)
            {
                var cov = r.TotalTurkishLines > 0 ? r.TranslatedLines * 100 / r.TotalTurkishLines : 100;
                sb.AppendLine($"| `{r.PageName}` | {r.HardcodedLines} | %{cov} |");
            }
        }
        else
        {
            sb.AppendLine("✅ Tüm sayfalar tam çevrilmiş.");
        }

        sb.AppendLine();
        return sb.ToString();
    }

    private static async Task UpdateStatusDoc(
        string statusFile,
        List<PageResult> results,
        int coveragePct,
        int totalPages, int fullyTranslated, int partiallyTranslated, int untranslated,
        int totalHardcoded, int totalTranslated,
        Func<string, Task> log,
        CancellationToken ct)
    {
        string existingHistory = "";
        if (File.Exists(statusFile))
        {
            var existing = await File.ReadAllTextAsync(statusFile, Encoding.UTF8, ct);
            var histIdx = existing.IndexOf("## Geçmiş", StringComparison.Ordinal);
            if (histIdx >= 0) existingHistory = existing[histIdx..];
        }

        var sb = new StringBuilder();
        sb.AppendLine("# i18n Durum Raporu");
        sb.AppendLine();
        sb.AppendLine($"> Son güncelleme: {DateTime.UtcNow:dd.MM.yyyy HH:mm} UTC (I18nPageScannerJob otomatik)");
        sb.AppendLine();
        sb.AppendLine("## Genel Durum");
        sb.AppendLine();
        sb.AppendLine("| Metrik | Değer |");
        sb.AppendLine("|--------|-------|");
        sb.AppendLine($"| Genel Kapsam | **%{coveragePct}** |");
        sb.AppendLine($"| Toplam Sayfa | {totalPages} |");
        sb.AppendLine($"| ✅ Tam Çevrilmiş | {fullyTranslated} |");
        sb.AppendLine($"| ⚠️ Kısmi Çeviri | {partiallyTranslated} |");
        sb.AppendLine($"| ❌ Çeviri Yok | {untranslated} |");
        sb.AppendLine($"| Çevrilmiş Satır | {totalTranslated} |");
        sb.AppendLine($"| Hardcoded Satır | {totalHardcoded} |");
        sb.AppendLine();

        var hardcodedPages = results.Where(r => r.HardcodedLines > 0).OrderByDescending(r => r.HardcodedLines).ToList();
        if (hardcodedPages.Count > 0)
        {
            sb.AppendLine("## Bekleyen Sayfalar");
            sb.AppendLine();
            sb.AppendLine("| Sayfa | Hardcoded | Kapsam |");
            sb.AppendLine("|-------|-----------|--------|");
            foreach (var r in hardcodedPages)
            {
                var cov = r.TotalTurkishLines > 0 ? r.TranslatedLines * 100 / r.TotalTurkishLines : 100;
                var icon = cov >= 80 ? "⚠️" : "❌";
                sb.AppendLine($"| {icon} `{r.PageName}` | {r.HardcodedLines} | %{cov} |");
            }
            sb.AppendLine();
        }

        if (!string.IsNullOrEmpty(existingHistory))
        {
            sb.Append(existingHistory);
            sb.AppendLine($"- **{DateTime.UtcNow:yyyy-MM-dd HH:mm}**: Tarama — %{coveragePct} kapsam, {totalHardcoded} hardcoded satır");
        }
        else
        {
            sb.AppendLine("## Geçmiş");
            sb.AppendLine();
            sb.AppendLine($"- **{DateTime.UtcNow:yyyy-MM-dd HH:mm}**: İlk tarama — %{coveragePct} kapsam, {totalHardcoded} hardcoded satır");
        }

        await File.WriteAllTextAsync(statusFile, sb.ToString(), Encoding.UTF8, ct);
        await log("  ✓ I18N_STATUS.md güncellendi");
    }

    private async Task<Dictionary<string, string>> LoadSiteSettingsAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        return await db.SiteSettings.ToDictionaryAsync(s => s.Key, s => s.Value, ct);
    }

    private string? ResolveDocsPath(string projectRoot, IReadOnlyDictionary<string, string> siteSettings)
    {
        var configured = ResolveSetting(siteSettings, "I18nJob:DocsPath");
        if (!string.IsNullOrEmpty(configured) && Directory.Exists(configured))
            return configured;
        var parent = Directory.GetParent(projectRoot)?.FullName;
        if (parent is null) return null;
        foreach (var name in new[] { "dotnet-ecom-docs", "dotnet_ecom_docs", "ecom-docs" })
        {
            var p = Path.Combine(parent, name);
            if (Directory.Exists(p)) return p;
        }
        return null;
    }

    private bool AllowDocsWrite(IReadOnlyDictionary<string, string> siteSettings) =>
        ResolveBoolSetting(siteSettings, "I18nJob:AllowDocsWrite", false);

    private bool AllowBuilderTrigger(IReadOnlyDictionary<string, string> siteSettings) =>
        ResolveBoolSetting(siteSettings, "I18nJob:TriggerBuilderFromScanner", false);

    private string? ResolveProjectRoot(IReadOnlyDictionary<string, string> siteSettings)
    {
        var configured = ResolveSetting(siteSettings, "I18nJob:ProjectRoot");
        if (!string.IsNullOrEmpty(configured) && Directory.Exists(configured))
            return configured;
        var dir = env.ContentRootPath;
        for (var i = 0; i < 8; i++)
        {
            if (Directory.Exists(Path.Combine(dir, "backend")) &&
                Directory.Exists(Path.Combine(dir, "frontend")))
                return dir;
            var parent = Directory.GetParent(dir)?.FullName;
            if (parent is null || parent == dir) break;
            dir = parent;
        }
        return null;
    }

    private string? ResolveSetting(IReadOnlyDictionary<string, string> siteSettings, string key) =>
        siteSettings.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : config[key];

    private static bool ResolveBoolSetting(IReadOnlyDictionary<string, string> siteSettings, string key, bool fallback)
    {
        if (siteSettings.TryGetValue(key, out var value) && bool.TryParse(value, out var parsed))
            return parsed;
        return fallback;
    }
}
