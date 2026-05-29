using Ecom.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/queues")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class QueuesController(ApplicationDbContext db, IConfiguration configuration) : ControllerBase
{
    // ── GET /api/admin/queues ────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        // ── Outbox genel istatistikler ──────────────────────────────────
        var total     = await db.OutboxMessages.CountAsync(ct);
        var processed = await db.OutboxMessages.CountAsync(m => m.ProcessedAt != null, ct);
        var pending   = await db.OutboxMessages.CountAsync(m => m.ProcessedAt == null && m.RetryCount < 5, ct);
        var failed    = await db.OutboxMessages.CountAsync(m => m.ProcessedAt == null && m.RetryCount >= 5, ct);

        // ── Event tipine göre dağılım ───────────────────────────────────
        var byTypeRaw = await db.OutboxMessages
            .GroupBy(m => m.Type)
            .Select(g => new
            {
                Type      = g.Key,
                Total     = g.Count(),
                Processed = g.Count(m => m.ProcessedAt != null),
                Pending   = g.Count(m => m.ProcessedAt == null && m.RetryCount < 5),
                Failed    = g.Count(m => m.ProcessedAt == null && m.RetryCount >= 5),
                LastActivity = g.Max(m => m.ProcessedAt ?? m.CreatedAt),
            })
            .ToListAsync(ct);

        var byType = byTypeRaw.Select(t => new
        {
            shortName    = ShortTypeName(t.Type),
            fullName     = t.Type,
            t.Total, t.Processed, t.Pending, t.Failed,
            successRate  = t.Total > 0 ? Math.Round((double)t.Processed / t.Total * 100, 1) : 0.0,
            lastActivity = t.LastActivity,
        });

        // ── Saga state dağılımı ─────────────────────────────────────────
        var sagaRaw = await db.OrderSagaStates
            .GroupBy(s => s.CurrentState)
            .Select(g => new { State = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var totalSagas = sagaRaw.Sum(s => s.Count);
        var sagaStates = sagaRaw.Select(s => new
        {
            s.State, s.Count,
            percent = totalSagas > 0 ? Math.Round((double)s.Count / totalSagas * 100, 1) : 0.0,
        });

        // ── Başarısız mesajlar (max 20) ─────────────────────────────────
        var recentFailedRaw = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null && m.RetryCount >= 5)
            .OrderByDescending(m => m.CreatedAt)
            .Take(20)
            .Select(m => new { m.Id, m.Type, m.RetryCount, m.Error, m.CreatedAt })
            .ToListAsync(ct);

        var recentFailed = recentFailedRaw.Select(m => new
        {
            m.Id, m.Type, m.RetryCount, m.Error, m.CreatedAt,
            ShortType = ShortTypeName(m.Type),
        });

        // ── Bekleyen mesajlar (max 10) ──────────────────────────────────
        var recentPendingRaw = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null && m.RetryCount < 5)
            .OrderBy(m => m.CreatedAt)
            .Take(10)
            .Select(m => new { m.Id, m.Type, m.RetryCount, m.CreatedAt })
            .ToListAsync(ct);

        var recentPending = recentPendingRaw.Select(m => new
        {
            m.Id, m.Type, m.RetryCount, m.CreatedAt,
            ShortType = ShortTypeName(m.Type),
        });

        // ── İptal Edilen İçe Aktarma İşleri (max 20) ───────────────────
        var cancelledCount = await db.ImportJobs.CountAsync(j => j.Status == "Cancelled", ct);
        var cancelledJobs = await db.ImportJobs
            .Where(j => j.Status == "Cancelled")
            .OrderByDescending(j => j.CompletedAt)
            .Take(20)
            .Select(j => new
            {
                j.Id,
                SourceName  = j.ExternalSource.Name,
                j.TargetEntity,
                j.TotalRows,
                j.ProcessedRows,
                j.ErrorMessage,
                j.CompletedAt,
            })
            .ToListAsync(ct);

        // ── Broker bilgisi ──────────────────────────────────────────────
        var rmqHost      = configuration["RabbitMQ:Host"];
        var isConfigured = !string.IsNullOrWhiteSpace(rmqHost);

        return Ok(new
        {
            stats = new { total, processed, pending, failed },
            byType,
            sagaStates,
            totalSagas,
            recentFailed,
            recentPending,
            cancelledCount,
            cancelledJobs,
            broker = new
            {
                provider    = isConfigured ? "RabbitMQ" : "InMemory (MassTransit)",
                host        = rmqHost ?? "localhost",
                port        = configuration["RabbitMQ:Port"] ?? "5672",
                virtualHost = configuration["RabbitMQ:VirtualHost"] ?? "/",
                username    = configuration["RabbitMQ:Username"] ?? "guest",
                isConfigured,
            },
            outboxProcessor = new
            {
                batchSize    = 20,
                intervalSecs = 10,
                maxRetries   = 5,
            },
            checkedAt = DateTime.UtcNow,
        });
    }

    // ── POST /api/admin/queues/messages/{id}/retry ────────────────────────
    [HttpPost("messages/{id:guid}/retry")]
    public async Task<IActionResult> RetryMessage(Guid id, CancellationToken ct)
    {
        var msg = await db.OutboxMessages.FindAsync([id], ct);
        if (msg is null) return NotFound(new { error = "Mesaj bulunamadı." });

        msg.RetryCount = 0;
        msg.Error      = null;
        await db.SaveChangesAsync(ct);
        return Ok(new { message = $"Mesaj yeniden kuyruğa alındı. Sonraki döngüde işlenecek." });
    }

    // ── POST /api/admin/queues/retry-failed ───────────────────────────────
    [HttpPost("retry-failed")]
    public async Task<IActionResult> RetryAllFailed(CancellationToken ct)
    {
        var messages = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null && m.RetryCount >= 5)
            .ToListAsync(ct);

        foreach (var m in messages) { m.RetryCount = 0; m.Error = null; }
        await db.SaveChangesAsync(ct);
        return Ok(new { message = $"{messages.Count} başarısız mesaj yeniden kuyruğa alındı." });
    }

    // ── DELETE /api/admin/queues/messages/{id} ────────────────────────────
    [HttpDelete("messages/{id:guid}")]
    public async Task<IActionResult> DeleteMessage(Guid id, CancellationToken ct)
    {
        var msg = await db.OutboxMessages.FindAsync([id], ct);
        if (msg is null) return NotFound(new { error = "Mesaj bulunamadı." });

        db.OutboxMessages.Remove(msg);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── DELETE /api/admin/queues/failed ───────────────────────────────────
    [HttpDelete("failed")]
    public async Task<IActionResult> DeleteAllFailed(CancellationToken ct)
    {
        var messages = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null && m.RetryCount >= 5)
            .ToListAsync(ct);

        db.OutboxMessages.RemoveRange(messages);
        await db.SaveChangesAsync(ct);
        return Ok(new { message = $"{messages.Count} başarısız mesaj silindi." });
    }

    // ── Yardımcı ─────────────────────────────────────────────────────────
    private static string ShortTypeName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return "—";
        var dot = fullName.LastIndexOf('.');
        return dot >= 0 ? fullName[(dot + 1)..] : fullName;
    }
}
