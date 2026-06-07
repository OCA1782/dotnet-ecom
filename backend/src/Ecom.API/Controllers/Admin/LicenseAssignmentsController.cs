using Ecom.Application.Common.Interfaces;
using DomainEnums = Ecom.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace Ecom.API.Controllers.Admin;

/// <summary>
/// License assignment management — thin proxy to dotnet-ecom-licence service.
/// User resolution (email → id) happens here since Users table is in Ecom DB.
/// </summary>
[ApiController]
[Route("api/admin/license-assignments")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class LicenseAssignmentsController(
    ILicenceServiceClient licenceClient,
    IApplicationDbContext db,
    IAuditService audit,
    ICurrentUserService currentUser,
    IConfiguration config) : ControllerBase
{
    private bool IsConfigured => !string.IsNullOrWhiteSpace(config["LicenceService:BaseUrl"]);

    [HttpGet]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        if (!IsConfigured) return ServiceUnavailable();
        var json = await licenceClient.GetAssignmentsAsync(ct);
        return Content(json, "application/json");
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Assign([FromBody] AssignLicenseRequest req, CancellationToken ct)
    {
        if (!IsConfigured) return ServiceUnavailable();

        if (string.IsNullOrWhiteSpace(req.AdminIdentifier))
            return BadRequest(new { error = "Kullanıcı e-postası veya adı zorunludur." });
        if (string.IsNullOrWhiteSpace(req.LicenseToken))
            return BadRequest(new { error = "Lisans token zorunludur." });

        var identifier = req.AdminIdentifier.Trim();
        var user = await db.Users
            .FirstOrDefaultAsync(u => !u.IsDeleted && (
                u.Email == identifier ||
                (u.Name + " " + u.Surname).Trim() == identifier), ct);

        if (user == null)
            return NotFound(new { error = $"'{identifier}' e-posta veya adına sahip kullanıcı bulunamadı." });

        bool isAdmin = await db.UserRoles.AnyAsync(r => r.UserId == user.Id &&
            (r.Role == DomainEnums.UserRole.Admin || r.Role == DomainEnums.UserRole.SuperAdmin), ct);
        if (!isAdmin)
            return BadRequest(new { error = "Bu kullanıcı admin rolüne sahip değil." });

        var payload = JsonSerializer.Serialize(new
        {
            adminUserId = user.Id,
            adminEmail  = user.Email,
            adminName   = $"{user.Name} {user.Surname}".Trim(),
            licenseToken = req.LicenseToken,
            notes        = req.Notes,
        });

        var json = await licenceClient.AssignLicenseAsync(payload, ct);

        await audit.LogAsync("LicenseAssigned", "Lisans", user.Id.ToString(),
            newValue: $"{user.Email} — {req.Notes ?? "—"}",
            userId: currentUser.UserId, cancellationToken: ct);

        return Content(json, "application/json");
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Revoke(Guid id, [FromQuery] string? reason, CancellationToken ct)
    {
        if (!IsConfigured) return ServiceUnavailable();
        var json = await licenceClient.RevokeAssignmentAsync(id, reason, ct);
        await audit.LogAsync("LicenseRevoked", "Lisans", id.ToString(),
            newValue: reason ?? "Manuel iptal",
            userId: currentUser.UserId, cancellationToken: ct);
        return Content(json, "application/json");
    }

    [HttpPost("{id:guid}/reset-password")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ResetViewPassword(Guid id, CancellationToken ct)
    {
        if (!IsConfigured) return ServiceUnavailable();
        var json = await licenceClient.ResetViewPasswordAsync(id, ct);
        await audit.LogAsync("LicensePasswordReset", "Lisans", id.ToString(),
            userId: currentUser.UserId, cancellationToken: ct);
        return Content(json, "application/json");
    }

    [HttpGet("history")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetHistory([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        if (!IsConfigured) return ServiceUnavailable();
        var json = await licenceClient.GetAssignmentHistoryAsync(limit, ct);
        return Content(json, "application/json");
    }

    [HttpPost("my-license")]
    public async Task<IActionResult> RevealMyLicense([FromBody] RevealMyLicenseRequest req, CancellationToken ct)
    {
        if (!IsConfigured) return ServiceUnavailable();
        if (string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Şifre boş olamaz." });

        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized(new { error = "Geçersiz oturum." });

        var payload = JsonSerializer.Serialize(new { adminUserId = userId, password = req.Password });
        var json = await licenceClient.RevealMyLicenseAsync(payload, ct);
        return Content(json, "application/json");
    }

    private IActionResult ServiceUnavailable() =>
        StatusCode(503, new { error = "Lisans servisi yapılandırılmamış. LicenceService:BaseUrl ayarlanmalıdır." });
}

public record AssignLicenseRequest(string AdminIdentifier, string LicenseToken, string? Notes);
public record RevealMyLicenseRequest(string Password);
