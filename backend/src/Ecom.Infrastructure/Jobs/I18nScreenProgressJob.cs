using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Ecom.Infrastructure.Jobs;

/// <summary>
/// Processes admin and customer screens one batch at a time.
/// Tracks per-screen progress in i18n_screen_progress.json (docs dir or project root).
/// Never writes to source .tsx files.
/// </summary>
public class I18nScreenProgressJob(
    IServiceScopeFactory scopeFactory,
    IWebHostEnvironment env,
    IConfiguration config) : IJobRunner
{
    public string Name => "I18nScreenProgressJob";
    public string Description => "Admin ve Customer ekranlarını sırayla tarar, değişimi algılar, ilerlemeyi kaydeder";
    public int IntervalMinutes => 60;

    private const int BatchSize = 4;

    private static readonly Regex TurkishChar = new("[ğüşıöçİĞÜŞÖÇ]", RegexOptions.Compiled);
    private static readonly Regex TCall = new(@"\bt\s*\(", RegexOptions.Compiled);
    private static readonly Regex HardcodedStr = new(
        "\"([^\"\\n\\\\]*[ğüşıöçİĞÜŞÖÇ][^\"\\n\\\\]*)\"", RegexOptions.Compiled);

    private record ScreenEntry(
        string Path,
        string Side,
        string FileHash,
        string Status,
        int Hardcoded,
        int Translated,
        string LastChecked,
        string? LastChanged);

    private record ProgressFile(
        int Cursor,
        string UpdatedAt,
        Dictionary<string, ScreenEntry> Screens);

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await log("i18n Screen Progress tarayıcı başlıyor...");

        var projectRoot = ResolveProjectRoot(await LoadSettingsAsync(ct));
        if (projectRoot is null)
        {
            await log("  ⚠ Proje kökü bulunamadı — I18nJob:ProjectRoot veya dosya sistemi ile belirleyin");
            return;
        }
        await log($"  Proje kökü: {projectRoot}");

        var progressFile = ResolveProgressFile(projectRoot);
        var progress = LoadProgress(progressFile);

        // Collect all screen files
        var allScreens = CollectScreens(projectRoot);
        if (allScreens.Count == 0)
        {
            await log("  ⚠ Hiç ekran dosyası bulunamadı");
            return;
        }

        await log($"  Toplam ekran: {allScreens.Count} (admin + customer)");

        // Process BatchSize screens starting from cursor
        var cursor = progress.Cursor % allScreens.Count;
        var processed = 0;
        var changed = 0;
        var unchanged = 0;

        for (var i = 0; i < BatchSize && i < allScreens.Count; i++)
        {
            ct.ThrowIfCancellationRequested();
            var idx = (cursor + i) % allScreens.Count;
            var screen = allScreens[idx];
            var key = screen.RelPath;

            string fileHash;
            try { fileHash = ComputeHash(screen.FullPath); }
            catch { continue; }

            var existing = progress.Screens.GetValueOrDefault(key);
            var isChanged = existing is null || existing.FileHash != fileHash;

            if (!isChanged)
            {
                unchanged++;
                progress.Screens[key] = existing! with { LastChecked = UtcNow() };
                await log($"  — [{screen.Side}] {key}: değişmedi (atlandı)");
                continue;
            }

            // Scan file
            var (hardcoded, translated) = await ScanFileAsync(screen.FullPath, ct);
            var status = hardcoded == 0 && translated == 0 ? "none"
                : hardcoded == 0 ? "done"
                : translated == 0 ? "missing"
                : "partial";

            var covPct = (translated + hardcoded) > 0 ? translated * 100 / (translated + hardcoded) : 100;
            var icon = status == "done" ? "✅" : status == "missing" ? "❌" : status == "none" ? "—" : "⚠";

            progress.Screens[key] = new ScreenEntry(
                key, screen.Side, fileHash, status,
                hardcoded, translated,
                LastChecked: UtcNow(),
                LastChanged: UtcNow());

            await log($"  {icon} [{screen.Side}] {key}: hardcoded={hardcoded}, çevrilmiş={translated}, kapsam=%{covPct}");
            changed++;
            processed++;
        }

        var nextCursor = (cursor + BatchSize) % allScreens.Count;
        progress = progress with { Cursor = nextCursor, UpdatedAt = UtcNow() };

        // Summary
        var totalScreens = progress.Screens.Count;
        var doneCount = progress.Screens.Values.Count(s => s.Status == "done");
        var missingCount = progress.Screens.Values.Count(s => s.Status == "missing");
        var partialCount = progress.Screens.Values.Count(s => s.Status == "partial");
        var overallPct = totalScreens > 0 ? doneCount * 100 / totalScreens : 0;

        await log($"  Tarandı: {processed} yeni + {unchanged} değişmemiş | Sıradaki: {nextCursor}/{allScreens.Count}");
        await log($"  Genel ilerleme: {doneCount}/{totalScreens} ekran tamamlandı (%{overallPct}) | ⚠ Kısmi: {partialCount} | ❌ Eksik: {missingCount}");

        // Show screens with most hardcoded strings
        var top = progress.Screens.Values
            .Where(s => s.Hardcoded > 0)
            .OrderByDescending(s => s.Hardcoded)
            .Take(5)
            .ToList();
        if (top.Count > 0)
        {
            await log("  En fazla hardcoded içeren ekranlar:");
            foreach (var s in top)
                await log($"    [{s.Side}] {s.Path}: {s.Hardcoded} hardcoded satır");
        }

        SaveProgress(progressFile, progress);
        await log($"  ✓ İlerleme kaydedildi: {progressFile}");
    }

    private static List<(string FullPath, string RelPath, string Side)> CollectScreens(string projectRoot)
    {
        var result = new List<(string, string, string)>();

        var adminDir = Path.Combine(projectRoot, "frontend", "admin", "src", "app", "(admin)");
        if (Directory.Exists(adminDir))
        {
            foreach (var f in Directory.GetFiles(adminDir, "*.tsx", SearchOption.AllDirectories))
            {
                var rel = Path.GetRelativePath(adminDir, f).Replace("\\", "/");
                result.Add((f, rel, "admin"));
            }
        }

        var customerDir = Path.Combine(projectRoot, "frontend", "customer", "src", "app");
        if (Directory.Exists(customerDir))
        {
            foreach (var f in Directory.GetFiles(customerDir, "*.tsx", SearchOption.AllDirectories))
            {
                var rel = Path.GetRelativePath(customerDir, f).Replace("\\", "/");
                result.Add((f, rel, "customer"));
            }
        }

        return result;
    }

    private static async Task<(int Hardcoded, int Translated)> ScanFileAsync(string path, CancellationToken ct)
    {
        var lines = await File.ReadAllLinesAsync(path, Encoding.UTF8, ct);
        var hardcoded = 0;
        var translated = 0;

        foreach (var line in lines)
        {
            var trimmed = line.TrimStart();
            if (trimmed.StartsWith("//") || trimmed.StartsWith("*") || trimmed.StartsWith("import "))
                continue;
            if (!TurkishChar.IsMatch(line)) continue;

            if (TCall.IsMatch(line))
                translated++;
            else if (HardcodedStr.IsMatch(line))
                hardcoded++;
            else
                translated++;
        }

        return (hardcoded, translated);
    }

    private static string ComputeHash(string path)
    {
        var bytes = File.ReadAllBytes(path);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash)[..16];
    }

    private static string ResolveProgressFile(string projectRoot)
    {
        // Prefer docs dir, fallback to project root
        var parent = Directory.GetParent(projectRoot)?.FullName ?? projectRoot;
        foreach (var name in new[] { "dotnet-ecom-docs", "dotnet_ecom_docs", "ecom-docs" })
        {
            var p = Path.Combine(parent, name);
            if (Directory.Exists(p))
                return Path.Combine(p, "i18n_screen_progress.json");
        }
        return Path.Combine(projectRoot, "i18n_screen_progress.json");
    }

    private static ProgressFile LoadProgress(string path)
    {
        if (!File.Exists(path))
            return new ProgressFile(0, UtcNow(), []);
        try
        {
            var json = File.ReadAllText(path);
            var obj = JsonSerializer.Deserialize<JsonElement>(json);
            var cursor = obj.TryGetProperty("cursor", out var c) ? c.GetInt32() : 0;
            var updatedAt = obj.TryGetProperty("updatedAt", out var u) ? u.GetString() ?? UtcNow() : UtcNow();
            var screens = new Dictionary<string, ScreenEntry>();

            if (obj.TryGetProperty("screens", out var screensEl))
            {
                foreach (var prop in screensEl.EnumerateObject())
                {
                    var v = prop.Value;
                    screens[prop.Name] = new ScreenEntry(
                        v.TryGetProperty("path", out var pp) ? pp.GetString() ?? prop.Name : prop.Name,
                        v.TryGetProperty("side", out var side) ? side.GetString() ?? "admin" : "admin",
                        v.TryGetProperty("fileHash", out var fh) ? fh.GetString() ?? "" : "",
                        v.TryGetProperty("status", out var st) ? st.GetString() ?? "none" : "none",
                        v.TryGetProperty("hardcoded", out var hc) ? hc.GetInt32() : 0,
                        v.TryGetProperty("translated", out var tr) ? tr.GetInt32() : 0,
                        v.TryGetProperty("lastChecked", out var lc) ? lc.GetString() ?? UtcNow() : UtcNow(),
                        v.TryGetProperty("lastChanged", out var lch) ? lch.GetString() : null);
                }
            }

            return new ProgressFile(cursor, updatedAt, screens);
        }
        catch { return new ProgressFile(0, UtcNow(), []); }
    }

    private static void SaveProgress(string path, ProgressFile progress)
    {
        try
        {
            var dir = Path.GetDirectoryName(path);
            if (dir is not null) Directory.CreateDirectory(dir);

            var opts = new JsonSerializerOptions { WriteIndented = true };
            var obj = new
            {
                cursor = progress.Cursor,
                updatedAt = progress.UpdatedAt,
                summary = new
                {
                    total = progress.Screens.Count,
                    done = progress.Screens.Values.Count(s => s.Status == "done"),
                    partial = progress.Screens.Values.Count(s => s.Status == "partial"),
                    missing = progress.Screens.Values.Count(s => s.Status == "missing"),
                    none = progress.Screens.Values.Count(s => s.Status == "none"),
                },
                screens = progress.Screens.ToDictionary(
                    kv => kv.Key,
                    kv => new
                    {
                        path = kv.Value.Path,
                        side = kv.Value.Side,
                        fileHash = kv.Value.FileHash,
                        status = kv.Value.Status,
                        hardcoded = kv.Value.Hardcoded,
                        translated = kv.Value.Translated,
                        lastChecked = kv.Value.LastChecked,
                        lastChanged = kv.Value.LastChanged,
                    })
            };
            File.WriteAllText(path, JsonSerializer.Serialize(obj, opts), Encoding.UTF8);
        }
        catch { /* silently ignore write failures */ }
    }

    private static string UtcNow() => DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

    private string? ResolveProjectRoot(Dictionary<string, string> settings)
    {
        var configured = settings.TryGetValue("I18nJob:ProjectRoot", out var v) && !string.IsNullOrWhiteSpace(v) ? v
            : config["I18nJob:ProjectRoot"];
        if (!string.IsNullOrEmpty(configured) && Directory.Exists(configured))
            return configured;

        var dir = env.ContentRootPath;
        for (var i = 0; i < 8; i++)
        {
            if (Directory.Exists(Path.Combine(dir, "backend")) && Directory.Exists(Path.Combine(dir, "frontend")))
                return dir;
            var parent = Directory.GetParent(dir)?.FullName;
            if (parent is null || parent == dir) break;
            dir = parent;
        }
        return null;
    }

    private async Task<Dictionary<string, string>> LoadSettingsAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        return await db.SiteSettings.ToDictionaryAsync(s => s.Key, s => s.Value, ct);
    }
}
