using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecom.API.Controllers.Admin;

[Authorize(Roles = "SuperAdmin,Admin")]
[ApiController]
[Route("api/admin/deploy")]
public class DeployController(
    IApplicationDbContext db,
    IDeployService deployService,
    IDeployStreamHub hub,
    ICurrentUserService currentUser) : ControllerBase
{
    // ── Servers ────────────────────────────────────────────────────────────────

    [HttpGet("servers")]
    public async Task<IActionResult> GetServers(CancellationToken ct)
    {
        var servers = await db.DeployServers
            .OrderBy(s => s.Environment).ThenBy(s => s.Name)
            .Select(s => new
            {
                s.Id, s.Name, s.Environment, s.Host, s.Port, s.Username,
                s.AuthType, s.DeployPath, s.ComposeFile, s.HealthCheckUrl,
                s.Branch, s.IsActive, s.Notes,
                s.LastDeployAt, s.LastDeployStatus, s.LastDeployDurationSeconds,
                s.CreatedDate
            })
            .ToListAsync(ct);
        return Ok(servers);
    }

    [HttpGet("servers/{id}")]
    public async Task<IActionResult> GetServer(Guid id, CancellationToken ct)
    {
        var s = await db.DeployServers.FindAsync(id, ct);
        if (s == null) return NotFound();
        return Ok(new
        {
            s.Id, s.Name, s.Environment, s.Host, s.Port, s.Username,
            s.AuthType, s.DeployPath, s.ComposeFile, s.HealthCheckUrl,
            s.Branch, s.IsActive, s.Notes,
            s.LastDeployAt, s.LastDeployStatus, s.LastDeployDurationSeconds
        });
    }

    [HttpPost("servers")]
    public async Task<IActionResult> CreateServer([FromBody] ServerUpsertRequest req, CancellationToken ct)
    {
        var server = new DeployServer
        {
            Name = req.Name,
            Environment = req.Environment,
            Host = req.Host,
            Port = req.Port,
            Username = req.Username,
            AuthType = req.AuthType,
            DeployPath = req.DeployPath,
            ComposeFile = req.ComposeFile ?? "docker-compose.yml",
            HealthCheckUrl = req.HealthCheckUrl,
            Branch = req.Branch ?? "main",
            IsActive = req.IsActive,
            Notes = req.Notes
        };

        if (!string.IsNullOrEmpty(req.PlaintextCredential))
            server.EncryptedCredential = deployService.EncryptCredential(req.PlaintextCredential);

        db.DeployServers.Add(server);
        await db.SaveChangesAsync(ct);
        return Ok(new { server.Id });
    }

    [HttpPut("servers/{id}")]
    public async Task<IActionResult> UpdateServer(Guid id, [FromBody] ServerUpsertRequest req, CancellationToken ct)
    {
        var server = await db.DeployServers.FindAsync(id, ct);
        if (server == null) return NotFound();

        server.Name = req.Name;
        server.Environment = req.Environment;
        server.Host = req.Host;
        server.Port = req.Port;
        server.Username = req.Username;
        server.AuthType = req.AuthType;
        server.DeployPath = req.DeployPath;
        server.ComposeFile = req.ComposeFile ?? "docker-compose.yml";
        server.HealthCheckUrl = req.HealthCheckUrl;
        server.Branch = req.Branch ?? "main";
        server.IsActive = req.IsActive;
        server.Notes = req.Notes;

        if (!string.IsNullOrEmpty(req.PlaintextCredential))
            server.EncryptedCredential = deployService.EncryptCredential(req.PlaintextCredential);

        await db.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpDelete("servers/{id}")]
    public async Task<IActionResult> DeleteServer(Guid id, CancellationToken ct)
    {
        var server = await db.DeployServers.FindAsync(id, ct);
        if (server == null) return NotFound();
        db.DeployServers.Remove(server);
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    // ── Deploy Actions ─────────────────────────────────────────────────────────

    [HttpPost("servers/{id}/deploy")]
    public async Task<IActionResult> StartDeploy(Guid id, CancellationToken ct)
    {
        var triggeredBy = currentUser.UserId?.ToString() ?? "system";
        var logId = await deployService.StartDeployAsync(id, triggeredBy, ct);
        return Ok(new { logId });
    }

    [HttpPost("servers/{id}/test-connection")]
    public async Task<IActionResult> TestConnection(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await deployService.TestConnectionAsync(id, ct);
            return Ok(new { result });
        }
        catch (Exception ex)
        {
            return Ok(new { result = $"❌ Bağlantı hatası: {ex.Message}" });
        }
    }

    [HttpGet("servers/{id}/container-status")]
    public async Task<IActionResult> ContainerStatus(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await deployService.GetContainerStatusAsync(id, ct);
            return Ok(new { result });
        }
        catch (Exception ex)
        {
            return Ok(new { result = $"❌ Hata: {ex.Message}" });
        }
    }

    // ── SSE log stream ─────────────────────────────────────────────────────────

    [HttpGet("logs/{logId}/stream")]
    public async Task StreamLog(Guid logId, CancellationToken ct)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        await foreach (var line in hub.ReadAsync(logId, ct))
        {
            var data = line.Replace("\n", "\\n");
            await Response.WriteAsync($"data: {data}\n\n", ct);
            await Response.Body.FlushAsync(ct);
        }
    }

    // ── Deploy Logs ────────────────────────────────────────────────────────────

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs([FromQuery] Guid? serverId, [FromQuery] int page = 1, CancellationToken ct = default)
    {
        var q = db.DeployLogs
            .Include(l => l.Server)
            .AsQueryable();

        if (serverId.HasValue)
            q = q.Where(l => l.ServerId == serverId.Value);

        var total = await q.CountAsync(ct);
        var logs = await q
            .OrderByDescending(l => l.StartedAt)
            .Skip((page - 1) * 20)
            .Take(20)
            .Select(l => new
            {
                l.Id, l.ServerId,
                ServerName = l.Server.Name,
                ServerEnv = l.Server.Environment,
                l.TriggeredBy, l.StartedAt, l.FinishedAt,
                l.Status, l.DurationSeconds, l.ErrorMessage, l.Branch, l.CommitHash
            })
            .ToListAsync(ct);

        return Ok(new { total, page, logs });
    }

    [HttpGet("logs/{logId}")]
    public async Task<IActionResult> GetLog(Guid logId, CancellationToken ct)
    {
        var log = await db.DeployLogs
            .Include(l => l.Server)
            .Where(l => l.Id == logId)
            .Select(l => new
            {
                l.Id, l.ServerId,
                ServerName = l.Server.Name,
                l.TriggeredBy, l.StartedAt, l.FinishedAt,
                l.Status, l.DurationSeconds, l.FullLog, l.ErrorMessage,
                l.Branch, l.CommitHash
            })
            .FirstOrDefaultAsync(ct);

        if (log == null) return NotFound();
        return Ok(log);
    }
}

public record ServerUpsertRequest(
    string Name,
    string Environment,
    string Host,
    int Port,
    string Username,
    string AuthType,
    string? PlaintextCredential,
    string DeployPath,
    string? ComposeFile,
    string? HealthCheckUrl,
    string? Branch,
    bool IsActive,
    string? Notes
);
