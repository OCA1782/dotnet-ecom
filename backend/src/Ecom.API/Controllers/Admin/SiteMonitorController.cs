using Ecom.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/site-monitor")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SiteMonitorController(
    ISiteMonitorHub hub,
    IApplicationDbContext db) : ControllerBase
{
    // nginx combined format + optional $host $http_cf_connecting_ip at end
    private static readonly Regex NginxRegex = new(
        @"^(\S+) - \S+ \[([^\]]+)\] ""([^""]*)"" (\d+) (\d+) ""[^""]*"" ""([^""]*)""(?:\s+(\S+))?(?:\s+(\S+))?",
        RegexOptions.Compiled);

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        var latest = hub.Latest;
        if (latest == null)
            return Ok(new { available = false });

        return Ok(new
        {
            available = true,
            isUp = latest.IsUp,
            httpStatusCode = latest.HttpStatusCode,
            responseTimeMs = latest.ResponseTimeMs,
            errorMessage = latest.ErrorMessage,
            checkedAt = latest.CheckedAt,
        });
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string filter = "all",
        [FromQuery] string sortBy = "checkedAt",
        [FromQuery] string sortDir = "desc",
        CancellationToken ct = default)
    {
        pageSize = Math.Clamp(pageSize, 10, 200);
        page = Math.Max(1, page);

        var q = db.SiteUptimeLogs.AsQueryable();

        if (filter == "up") q = q.Where(l => l.IsUp);
        else if (filter == "down") q = q.Where(l => !l.IsUp);

        q = (sortBy, sortDir) switch
        {
            ("responseTimeMs", "asc") => q.OrderBy(l => l.ResponseTimeMs),
            ("responseTimeMs", _)     => q.OrderByDescending(l => l.ResponseTimeMs),
            ("httpStatusCode", "asc") => q.OrderBy(l => l.HttpStatusCode),
            ("httpStatusCode", _)     => q.OrderByDescending(l => l.HttpStatusCode),
            (_, "asc")               => q.OrderBy(l => l.CheckedAt),
            _                        => q.OrderByDescending(l => l.CheckedAt),
        };

        var total = await q.CountAsync(ct);
        var logs = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new
            {
                l.Id, l.Url, l.IsUp, l.HttpStatusCode,
                l.ResponseTimeMs, l.ErrorMessage, l.CheckedAt,
            })
            .ToListAsync(ct);

        var upCount = await db.SiteUptimeLogs.CountAsync(l => l.IsUp, ct);
        var totalCount = await db.SiteUptimeLogs.CountAsync(ct);

        return Ok(new { total, page, pageSize, logs, upCount, totalCount });
    }

    [HttpGet("nginx-logs")]
    public IActionResult GetNginxLogs(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 100,
        [FromQuery] string? ip = null,
        [FromQuery] string? status = null,
        [FromQuery] string? path = null)
    {
        limit = Math.Clamp(limit, 10, 200);
        page = Math.Max(1, page);

        const string logPath = "/var/log/nginx/access.log";
        if (!System.IO.File.Exists(logPath))
            return Ok(new { available = false, error = "Nginx log dosyasına erişilemiyor. Docker volume mount kontrol edin.", entries = Array.Empty<object>(), total = 0 });

        var rawLines = ReadLastLines(logPath, 5000);
        var entries = rawLines.Select(ParseNginxLine).Where(e => e != null).ToList();

        if (!string.IsNullOrWhiteSpace(ip))
            entries = entries.Where(e => e!.RemoteAddr.Contains(ip.Trim())).ToList();
        if (!string.IsNullOrWhiteSpace(status))
            entries = entries.Where(e => e!.StatusCode.ToString().StartsWith(status.Trim())).ToList();
        if (!string.IsNullOrWhiteSpace(path))
            entries = entries.Where(e => e!.Path.Contains(path.Trim(), StringComparison.OrdinalIgnoreCase)).ToList();

        var total = entries.Count;
        var paged = entries
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(e => new
            {
                remoteAddr = e!.RemoteAddr,
                timeLocal = e.TimeLocal,
                method = e.Method,
                path = e.Path,
                statusCode = e.StatusCode,
                bodyBytesSent = e.BodyBytesSent,
                userAgent = e.UserAgent,
                host = e.Host,
                cfIp = e.CfIp,
            })
            .ToList();

        return Ok(new { available = true, total, page, limit, entries = paged });
    }

    [HttpGet("stream")]
    public async Task Stream(CancellationToken ct)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";
        Response.Headers.Append("X-Accel-Buffering", "no");

        var subscriberId = Guid.NewGuid().ToString("N");
        try
        {
            await foreach (var evt in hub.SubscribeAsync(subscriberId, ct))
            {
                var json = JsonSerializer.Serialize(new
                {
                    isUp = evt.IsUp,
                    httpStatusCode = evt.HttpStatusCode,
                    responseTimeMs = evt.ResponseTimeMs,
                    errorMessage = evt.ErrorMessage,
                    checkedAt = evt.CheckedAt,
                });
                await Response.WriteAsync($"data: {json}\n\n", ct);
                await Response.Body.FlushAsync(ct);
            }
        }
        catch (OperationCanceledException) { }
        finally
        {
            hub.Unsubscribe(subscriberId);
        }
    }

    private static List<string> ReadLastLines(string path, int maxCount)
    {
        const int bufferSize = 2 * 1024 * 1024; // 2MB
        try
        {
            using var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            if (fs.Length == 0) return [];

            long startPos = Math.Max(0, fs.Length - bufferSize);
            fs.Seek(startPos, SeekOrigin.Begin);

            using var reader = new StreamReader(fs, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
            if (startPos > 0) reader.ReadLine(); // skip partial first line

            var lines = new List<string>();
            string? line;
            while ((line = reader.ReadLine()) != null)
                if (!string.IsNullOrWhiteSpace(line))
                    lines.Add(line);

            return lines.Count <= maxCount
                ? lines
                : lines.GetRange(lines.Count - maxCount, maxCount);
        }
        catch { return []; }
    }

    private record NginxEntry(string RemoteAddr, string TimeLocal, string Method, string Path, int StatusCode, long BodyBytesSent, string UserAgent, string Host, string CfIp);

    private NginxEntry? ParseNginxLine(string line)
    {
        var m = NginxRegex.Match(line);
        if (!m.Success) return null;

        var requestParts = m.Groups[3].Value.Split(' ');
        var method = requestParts.Length >= 1 ? requestParts[0] : "-";
        var rawPath = requestParts.Length >= 2 ? requestParts[1] : "-";

        if (!int.TryParse(m.Groups[4].Value, out var sc)) return null;
        if (!long.TryParse(m.Groups[5].Value, out var bytes)) return null;

        var host = m.Groups[7].Success && m.Groups[7].Value != "-" ? m.Groups[7].Value : "-";
        var cfIp = m.Groups[8].Success && m.Groups[8].Value != "-" ? m.Groups[8].Value : "-";

        return new NginxEntry(m.Groups[1].Value, m.Groups[2].Value, method, rawPath, sc, bytes, m.Groups[6].Value, host, cfIp);
    }
}
