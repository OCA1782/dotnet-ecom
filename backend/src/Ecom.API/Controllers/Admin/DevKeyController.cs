using Ecom.Application.Common.Interfaces;
using Ecom.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using System.Text.Json;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/dev-key")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class DevKeyController(IApplicationDbContext db, IConfiguration config) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetStatus(CancellationToken ct)
    {
        var token = config["License"] ?? Environment.GetEnvironmentVariable("ECOM_LICENSE") ?? "";

        if (string.IsNullOrEmpty(token))
            return Ok(new { isConfigured = false, maskedKey = (string?)null, isValid = false, revealPasswordSet = false });

        bool isValid = false;
        string? validationError = null;
        string? issuer = null;
        string? notBefore = null;
        string? expiresAt = null;

        try
        {
            var info = LicenseValidator.Validate(token);
            isValid = true;
            issuer = info.Issuer;
            notBefore = info.NotBefore.ToString("yyyy-MM-dd");
            expiresAt = info.ExpiresAt.ToString("yyyy-MM-dd");
        }
        catch (LicenseException ex) { validationError = ex.Message; }

        bool isSuperAdmin = User.IsInRole("SuperAdmin");

        var revealHash = await db.SiteSettings
            .Where(s => s.Key == "RevealPasswordHash")
            .Select(s => s.Value)
            .FirstOrDefaultAsync(ct);

        return Ok(new
        {
            isConfigured      = true,
            isValid,
            validationError,
            maskedKey         = LicenseValidator.MaskToken(token),
            fullKey           = isSuperAdmin ? token : null,
            issuer,
            notBefore,
            expiresAt,
            revealPasswordSet = !string.IsNullOrEmpty(revealHash),
        });
    }

    // Kept for backward compatibility — regular admins (non-SuperAdmin) can still use this
    // if a RevealPasswordHash is set. For SuperAdmin the full key is returned directly from GetStatus.
    [HttpPost("reveal")]
    public async Task<IActionResult> Reveal([FromBody] RevealRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Şifre boş olamaz." });

        var revealHash = await db.SiteSettings
            .Where(s => s.Key == "RevealPasswordHash")
            .Select(s => s.Value)
            .FirstOrDefaultAsync(ct);

        if (string.IsNullOrEmpty(revealHash))
            return BadRequest(new { error = "Görüntüleme şifresi yapılandırılmamış." });

        if (CryptoHelper.Hash(req.Password) != revealHash)
            return Unauthorized(new { error = "Geçersiz şifre." });

        var token = config["License"] ?? Environment.GetEnvironmentVariable("ECOM_LICENSE") ?? "";
        if (string.IsNullOrEmpty(token))
            return NotFound(new { error = "Lisans yapılandırılmamış." });

        return Ok(new { key = token });
    }
}

public record RevealRequest(string Password);
