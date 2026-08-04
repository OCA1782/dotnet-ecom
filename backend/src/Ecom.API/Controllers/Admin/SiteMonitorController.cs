using Ecom.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/site-monitor")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SiteMonitorController(
    ISiteMonitorHub hub,
    IApplicationDbContext db) : ControllerBase
{
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
    public async Task<IActionResult> GetLogs([FromQuery] int page = 1, CancellationToken ct = default)
    {
        var q = db.SiteUptimeLogs.OrderByDescending(l => l.CheckedAt);
        var total = await q.CountAsync(ct);
        var logs = await q
            .Skip((page - 1) * 50)
            .Take(50)
            .Select(l => new
            {
                l.Id, l.Url, l.IsUp, l.HttpStatusCode,
                l.ResponseTimeMs, l.ErrorMessage, l.CheckedAt,
            })
            .ToListAsync(ct);

        var upCount = await db.SiteUptimeLogs.CountAsync(l => l.IsUp, ct);
        var totalCount = await db.SiteUptimeLogs.CountAsync(ct);

        return Ok(new { total, page, logs, upCount, totalCount });
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
}
