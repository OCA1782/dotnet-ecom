using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/docs")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class DocsController(
    IMediator mediator,
    IWebHostEnvironment env,
    IConfiguration config,
    IHttpClientFactory httpFactory,
    IMemoryCache cache) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    // Resolved once per request — null means GitHub not configured
    private GitHubDocsSettings? _gh;
    private GitHubDocsSettings? Gh => _gh ??= ResolveGhSettings();
    private GitHubDocsSettings? ResolveGhSettings()
    {
        var s = config.GetSection("GitHub").Get<GitHubDocsSettings>();
        return s is { Token.Length: > 0, Owner.Length: > 0, Repo.Length: > 0 } ? s : null;
    }

    // ── Existing endpoints ─────────────────────────────────────────────────

    [HttpGet("activity")]
    public async Task<IActionResult> Activity([FromQuery] int limit = 60, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetDocsActivityQuery(limit), ct);
        return Ok(new { items = result, generatedAt = DateTime.UtcNow });
    }

    [HttpGet("git-log")]
    public IActionResult GitLog([FromQuery] int limit = 60)
    {
        var repoRoot = FindGitRoot(env.ContentRootPath);
        if (repoRoot is null)
            return Ok(new { commits = Array.Empty<object>(), error = "Git repo bulunamadı" });

        var raw = RunGit(repoRoot,
            $"log --format=\"|COMMIT|%H|%h|%an|%ad|%s\" --date=iso-strict --name-status -n {limit}");

        if (raw is null)
            return Ok(new { commits = Array.Empty<object>(), error = "git log çalıştırılamadı" });

        var commits = ParseGitLog(raw);
        return Ok(new { commits, generatedAt = DateTime.UtcNow });
    }

    // ── Files list ─────────────────────────────────────────────────────────

    [HttpGet("files")]
    public async Task<IActionResult> Files(CancellationToken ct = default)
    {
        var merged = new List<object>();
        var seenNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var source = "local";

        // 1. GitHub (primary — has all canonical docs)
        if (Gh is { } gh)
        {
            const string ck = "gh:docs:files";
            object[]? ghFiles = null;
            if (!cache.TryGetValue<object[]>(ck, out ghFiles))
            {
                try
                {
                    using var cts2 = CancellationTokenSource.CreateLinkedTokenSource(ct);
                    cts2.CancelAfter(TimeSpan.FromSeconds(25));
                    ghFiles = await GhListFilesAsync(gh, cts2.Token);
                    if (ghFiles.Length > 0)
                        cache.Set(ck, ghFiles, TimeSpan.FromSeconds(60));
                }
                catch { ghFiles = null; }
            }
            if (ghFiles is { Length: > 0 })
            {
                source = "github+local";
                foreach (var f in ghFiles)
                {
                    merged.Add(f);
                    seenNames.Add(((dynamic)f).name);
                }
            }
        }

        // 2. Local path — add files not already from GitHub
        var docsPath = ResolveLocalDocsPath();
        if (docsPath is not null)
        {
            var localFiles = Directory.GetFiles(docsPath, "*.md")
                .Select(f => new
                {
                    name = Path.GetFileName(f),
                    sizeKb = Math.Round(new FileInfo(f).Length / 1024.0, 1),
                    lastModified = System.IO.File.GetLastWriteTimeUtc(f),
                })
                .Where(f => !seenNames.Contains(f.name))
                .ToList();
            merged.AddRange(localFiles);
            if (source == "local" && localFiles.Count > 0) source = "local";
        }

        var sorted = merged
            .OrderByDescending(f => ((dynamic)f).lastModified)
            .ToList();

        return Ok(new { files = sorted, source, generatedAt = DateTime.UtcNow });
    }

    // ── Single file content ────────────────────────────────────────────────

    [HttpGet("file")]
    public async Task<IActionResult> FileContent([FromQuery] string name, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Contains("..") || !name.EndsWith(".md"))
            return BadRequest(new { error = "Geçersiz dosya adı." });

        // 1. Local path (instant, always available)
        var docsPath = ResolveLocalDocsPath();
        if (docsPath is not null)
        {
            var filePath = Path.Combine(docsPath, name);
            if (System.IO.File.Exists(filePath))
                return Ok(new
                {
                    name,
                    content = System.IO.File.ReadAllText(filePath),
                    lastModified = System.IO.File.GetLastWriteTimeUtc(filePath),
                    source = "local",
                    generatedAt = DateTime.UtcNow,
                });
        }

        // 2. GitHub (for files that exist only there, e.g. not yet pulled locally)
        if (Gh is { } gh)
        {
            var ck = $"gh:docs:file:{name}";
            if (!cache.TryGetValue<object>(ck, out var cached))
            {
                try
                {
                    using var cts2 = CancellationTokenSource.CreateLinkedTokenSource(ct);
                    cts2.CancelAfter(TimeSpan.FromSeconds(8));
                    cached = await GhGetFileAsync(gh, name, cts2.Token);
                }
                catch { cached = null; }
                if (cached is not null) cache.Set(ck, cached, TimeSpan.FromMinutes(2));
            }
            return cached is not null ? Ok(cached) : NotFound(new { error = "Dosya bulunamadı." });
        }

        return NotFound(new { error = "Dosya bulunamadı." });
    }

    // ── GitHub API helpers ─────────────────────────────────────────────────

    private async Task<object[]> GhListFilesAsync(GitHubDocsSettings gh, CancellationToken ct)
    {
        var http = httpFactory.CreateClient("github");
        var url  = $"https://api.github.com/repos/{gh.Owner}/{gh.Repo}/contents/{GhPath(gh)}";

        using var resp = await http.SendAsync(GhReq(url, gh.Token), ct);
        if (!resp.IsSuccessStatusCode) return [];

        var items = JsonSerializer.Deserialize<GhContentItem[]>(
            await resp.Content.ReadAsStringAsync(ct), JsonOpts) ?? [];

        var mdFiles = items.Where(i => i.Type == "file" && i.Name.EndsWith(".md")).ToArray();

        // Fetch last-commit date per file in parallel; use independent CTS so date timeouts don't cancel file listing
        using var dateCts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        var dates = await Task.WhenAll(mdFiles.Select(f => GhLastModifiedAsync(gh, f.Name, http, dateCts.Token)));

        return mdFiles.Zip(dates)
            .Select(p => (object)new
            {
                name         = p.First.Name,
                sizeKb       = Math.Round(p.First.Size / 1024.0, 1),
                lastModified = p.Second,
            })
            .OrderByDescending(x => ((dynamic)x).lastModified)
            .ToArray();
    }

    private async Task<DateTime> GhLastModifiedAsync(
        GitHubDocsSettings gh, string fileName, HttpClient http, CancellationToken ct)
    {
        var ck = $"gh:lm:{fileName}";
        if (cache.TryGetValue<DateTime>(ck, out var hit)) return hit;

        var url = $"https://api.github.com/repos/{gh.Owner}/{gh.Repo}/commits" +
                  $"?path={GhPath(gh, fileName)}&per_page=1";
        try
        {
            using var resp = await http.SendAsync(GhReq(url, gh.Token), ct);
            if (!resp.IsSuccessStatusCode) return DateTime.UtcNow;
            var commits = JsonSerializer.Deserialize<GhCommit[]>(
                await resp.Content.ReadAsStringAsync(ct), JsonOpts) ?? [];
            var date = commits.FirstOrDefault()?.Commit?.Committer?.Date ?? DateTime.UtcNow;
            cache.Set(ck, date, TimeSpan.FromMinutes(5));
            return date;
        }
        catch { return DateTime.UtcNow; }
    }

    private async Task<object?> GhGetFileAsync(GitHubDocsSettings gh, string fileName, CancellationToken ct)
    {
        var http = httpFactory.CreateClient("github");
        var url  = $"https://api.github.com/repos/{gh.Owner}/{gh.Repo}/contents" +
                   $"/{GhPath(gh, Uri.EscapeDataString(fileName))}";

        using var resp = await http.SendAsync(GhReq(url, gh.Token), ct);
        if (!resp.IsSuccessStatusCode) return null;

        var item = JsonSerializer.Deserialize<GhFileContent>(
            await resp.Content.ReadAsStringAsync(ct), JsonOpts);
        if (item?.Content is null) return null;

        var raw     = item.Content.Replace("\n", "").Replace("\r", "");
        var content = Encoding.UTF8.GetString(Convert.FromBase64String(raw));
        var lastMod = await GhLastModifiedAsync(gh, fileName, http, ct);

        return new { name = fileName, content, lastModified = lastMod, source = "github", generatedAt = DateTime.UtcNow };
    }

    // Builds "DOCS/file.md" or "file.md" depending on whether DocsPath is set
    private static string GhPath(GitHubDocsSettings gh, string? fileName = null)
    {
        var parts = new[] { gh.DocsPath, fileName }
            .Where(p => !string.IsNullOrEmpty(p));
        return string.Join("/", parts);
    }

    private static HttpRequestMessage GhReq(string url, string token)
    {
        var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        // User-Agent, Accept, X-GitHub-Api-Version already set on the named "github" HttpClient's DefaultRequestHeaders
        return req;
    }

    // ── Local filesystem fallback ──────────────────────────────────────────

    private string? ResolveLocalDocsPath()
    {
        // 1. Explicit config path (highest priority)
        var configured = config["Docs:LocalPath"];
        if (!string.IsNullOrWhiteSpace(configured) && Directory.Exists(configured))
            return configured;

        // 2. DOCS / docs folder in git repo root (case-insensitive search)
        var repoRoot = FindGitRoot(env.ContentRootPath);
        if (repoRoot is not null)
        {
            foreach (var name in new[] { "DOCS", "docs" })
            {
                var p = Path.Combine(repoRoot, name);
                if (Directory.Exists(p)) return p;
            }
        }
        var cwd = FindGitRoot(Directory.GetCurrentDirectory());
        if (cwd is not null)
        {
            foreach (var name in new[] { "DOCS", "docs" })
            {
                var p = Path.Combine(cwd, name);
                if (Directory.Exists(p)) return p;
            }
        }
        return null;
    }

    // ── git-log helpers (unchanged) ────────────────────────────────────────

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
                WorkingDirectory     = workDir,
                RedirectStandardOutput = true,
                RedirectStandardError  = true,
                UseShellExecute      = false,
                CreateNoWindow       = true,
            };
            using var proc = Process.Start(psi)!;
            var output = proc.StandardOutput.ReadToEnd();
            proc.WaitForExit(8_000);
            return output;
        }
        catch { return null; }
    }

    private static List<object> ParseGitLog(string raw)
    {
        var commits = new List<object>();
        string? hash = null, shortHash = null, author = null, date = null, subject = null;
        var files = new List<object>();

        void Flush()
        {
            if (hash is null) return;
            commits.Add(new
            {
                hash, shortHash, author, date, subject,
                files = files.ToList(),
                stats = new
                {
                    added    = files.Count(f => ((dynamic)f).status == "A"),
                    modified = files.Count(f => ((dynamic)f).status == "M"),
                    deleted  = files.Count(f => ((dynamic)f).status == "D"),
                    renamed  = files.Count(f => ((dynamic)f).status == "R"),
                    total    = files.Count,
                }
            });
        }

        foreach (var rawLine in raw.Split('\n'))
        {
            var line = rawLine.TrimEnd('\r');
            if (line.StartsWith("|COMMIT|"))
            {
                Flush();
                var parts = line.Split('|', 7);
                hash      = parts.Length > 2 ? parts[2] : "";
                shortHash = parts.Length > 3 ? parts[3] : "";
                author    = parts.Length > 4 ? parts[4] : "";
                date      = parts.Length > 5 ? parts[5] : "";
                subject   = parts.Length > 6 ? parts[6] : "";
                files     = [];
            }
            else if (hash != null && line.Length > 1 && line[0] is 'A' or 'M' or 'D' or 'R' or 'C' && line[1] == '\t')
            {
                var statusChar = line[0].ToString();
                var rest       = line[2..];
                var tabIdx     = rest.IndexOf('\t');
                var filePath   = tabIdx >= 0 ? rest[(tabIdx + 1)..] : rest;
                var oldPath    = tabIdx >= 0 ? rest[..tabIdx] : null;

                files.Add(new
                {
                    status   = statusChar is "R" or "C" ? "R" : statusChar,
                    path     = filePath,
                    oldPath,
                    category = CategorizeFile(filePath),
                });
            }
        }
        Flush();
        return commits;
    }

    private static string CategorizeFile(string path)
    {
        if (path.StartsWith("frontend/admin"))    return "admin";
        if (path.StartsWith("frontend/customer")) return "customer";
        if (path.StartsWith("backend"))           return "backend";
        if (path.StartsWith("DOCS"))              return "docs";
        return "infra";
    }
}

// ── Settings & GitHub API models ──────────────────────────────────────────

public record GitHubDocsSettings(string Token, string Owner, string Repo, string DocsPath = "DOCS");

internal class GhContentItem
{
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("type")] public string Type { get; set; } = "";
    [JsonPropertyName("size")] public int    Size { get; set; }
    [JsonPropertyName("sha")]  public string Sha  { get; set; } = "";
}

internal class GhFileContent : GhContentItem
{
    [JsonPropertyName("content")]  public string? Content  { get; set; }
    [JsonPropertyName("encoding")] public string? Encoding { get; set; }
}

internal class GhCommit
{
    [JsonPropertyName("commit")] public GhCommitDetail? Commit { get; set; }
}

internal class GhCommitDetail
{
    [JsonPropertyName("committer")] public GhCommitter? Committer { get; set; }
}

internal class GhCommitter
{
    [JsonPropertyName("date")] public DateTime Date { get; set; }
}
