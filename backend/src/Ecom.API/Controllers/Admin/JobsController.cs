using Ecom.Application.Common.Interfaces;
using Ecom.Infrastructure.Jobs;
using Ecom.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/jobs")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class JobsController(
    IEnumerable<IJobRunner> jobs,
    IServiceStateManager stateManager,
    IJobStreamHub hub,
    JobScheduler scheduler,
    IApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public IActionResult GetJobs()
    {
        var result = jobs.Select(j =>
        {
            var state = stateManager.Get(j.Name);
            return new
            {
                j.Name,
                j.Description,
                IntervalMinutes = stateManager.GetEffectiveInterval(j.Name, j.IntervalMinutes),
                DefaultIntervalMinutes = j.IntervalMinutes,
                State = state,
            };
        });
        return Ok(result);
    }

    [HttpPost("trigger-all")]
    public IActionResult TriggerAll()
    {
        var triggered = new List<string>();
        var skipped = new List<string>();

        foreach (var job in jobs)
        {
            if (stateManager.IsPaused(job.Name)) { skipped.Add(job.Name); continue; }
            try { scheduler.QueueManualTrigger(job.Name); triggered.Add(job.Name); }
            catch { skipped.Add(job.Name); }
        }

        return Accepted(new { triggered, skipped });
    }

    [HttpPut("{name}")]
    public IActionResult UpdateInterval(string name, [FromBody] UpdateJobRequest req)
    {
        var job = jobs.FirstOrDefault(j => j.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
        if (job == null) return NotFound(new { error = "Job bulunamadı" });
        if (req.IntervalMinutes < 1 || req.IntervalMinutes > 10080)
            return BadRequest(new { error = "Aralık 1–10080 dakika arasında olmalıdır" });

        stateManager.SetIntervalOverride(name, req.IntervalMinutes);
        return Ok(new { name, intervalMinutes = req.IntervalMinutes });
    }

    [HttpPost("{name}/trigger")]
    public IActionResult Trigger(string name)
    {
        try
        {
            scheduler.QueueManualTrigger(name);
            return Accepted(new { triggered = true, message = "Job kuyruğa alındı" });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPut("{name}/toggle")]
    public IActionResult Toggle(string name)
    {
        var state = stateManager.Get(name);
        if (state == null) return NotFound(new { error = "Job bulunamadı" });

        stateManager.SetPaused(name, !stateManager.IsPaused(name));
        return Ok(new { paused = stateManager.IsPaused(name) });
    }

    [HttpGet("{name}/logs")]
    public async Task<IActionResult> GetLogs(string name, [FromQuery] int page = 1, CancellationToken ct = default)
    {
        var q = db.JobLogs.Where(l => l.JobName == name);
        var total = await q.CountAsync(ct);
        var logs = await q
            .OrderByDescending(l => l.StartedAt)
            .Skip((page - 1) * 20)
            .Take(20)
            .Select(l => new
            {
                l.Id, l.JobName, l.StartedAt, l.FinishedAt,
                l.Status, l.DurationMs, l.ErrorMessage, l.IsManualTrigger
            })
            .ToListAsync(ct);

        return Ok(new { total, page, logs });
    }

    [HttpGet("{name}/logs/{logId}")]
    public async Task<IActionResult> GetLog(string name, Guid logId, CancellationToken ct)
    {
        var log = await db.JobLogs
            .Where(l => l.Id == logId && l.JobName == name)
            .FirstOrDefaultAsync(ct);

        return log == null ? NotFound() : Ok(log);
    }

    public record UpdateJobRequest(int IntervalMinutes);

    [HttpGet("{name}/stream")]
    public async Task Stream(string name, CancellationToken ct)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";
        Response.Headers.Append("X-Accel-Buffering", "no"); // nginx proxy için SSE buffer kapatma

        // Job henüz başlamadıysa kısa süre bekle (tetikleme → scheduler döngüsü arasındaki gecikme)
        var deadline = DateTime.UtcNow.AddSeconds(6);
        while (!hub.IsActive(name) && DateTime.UtcNow < deadline && !ct.IsCancellationRequested)
            await Task.Delay(250, ct);

        if (!hub.IsActive(name))
        {
            await Response.WriteAsync("data: __NOTRUNNING__\n\n", ct);
            await Response.Body.FlushAsync(ct);
            return;
        }

        await foreach (var line in hub.ReadAsync(name, ct))
        {
            var data = line.Replace("\n", "\\n");
            await Response.WriteAsync($"data: {data}\n\n", ct);
            await Response.Body.FlushAsync(ct);
        }
    }
}
