using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using DomainEnums = Ecom.Domain.Enums;
using Ecom.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/license-assignments")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class LicenseAssignmentsController(IApplicationDbContext db, IEmailService email) : ControllerBase
{
    // GET /api/admin/license-assignments — SuperAdmin: list all assignments
    [HttpGet]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var list = await db.LicenseAssignments
            .Where(a => !a.IsDeleted)
            .OrderByDescending(a => a.CreatedDate)
            .Select(a => new
            {
                a.Id,
                a.AdminUserId,
                a.AdminEmail,
                a.AdminName,
                maskedToken = MaskToken(a.LicenseToken),
                a.IsRevoked,
                a.Notes,
                a.CreatedDate,
                licenseInfo = ParseLicenseInfo(a.LicenseToken),
            })
            .ToListAsync(ct);

        return Ok(list);
    }

    // POST /api/admin/license-assignments — SuperAdmin: assign license to admin user
    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Assign([FromBody] AssignLicenseRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.AdminEmail))
            return BadRequest(new { error = "Kullanıcı e-postası zorunludur." });

        if (string.IsNullOrWhiteSpace(req.LicenseToken))
            return BadRequest(new { error = "Lisans token zorunludur." });

        var user = await db.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == req.AdminEmail && !u.IsDeleted, ct);

        if (user == null)
            return NotFound(new { error = $"'{req.AdminEmail}' e-postasına sahip kullanıcı bulunamadı." });

        bool isAdmin = user.Roles.Any(r => r.Role == DomainEnums.UserRole.Admin || r.Role == DomainEnums.UserRole.SuperAdmin);
        if (!isAdmin)
            return BadRequest(new { error = "Bu kullanıcı admin rolüne sahip değil. Lisans yalnızca admin kullanıcılara atanabilir." });

        // Generate random view password: 4 groups of 4 uppercase alphanumeric
        var viewPassword = GenerateViewPassword();
        var viewPasswordHash = CryptoHelper.Hash(viewPassword);

        // Parse license for email metadata
        string issuer = "—";
        string expiresAt = "—";
        try
        {
            var info = ParseLicenseInfoObj(req.LicenseToken);
            if (info != null) { issuer = info.Value.Issuer; expiresAt = info.Value.ExpiresAt; }
        }
        catch { }

        var assignment = new LicenseAssignment
        {
            AdminUserId     = user.Id,
            AdminEmail      = user.Email,
            AdminName       = $"{user.Name} {user.Surname}".Trim(),
            LicenseToken    = req.LicenseToken,
            ViewPasswordHash = viewPasswordHash,
            Notes           = req.Notes,
        };

        db.LicenseAssignments.Add(assignment);
        await db.SaveChangesAsync(ct);

        // Send email (fire-and-forget on failure — assignment is already saved)
        try
        {
            await email.SendLicenseAssignmentAsync(
                user.Email, $"{user.Name} {user.Surname}".Trim(),
                req.LicenseToken, viewPassword, issuer, expiresAt, ct);
        }
        catch { /* email failure does not roll back assignment */ }

        return Ok(new
        {
            id = assignment.Id,
            viewPassword,  // returned once so SuperAdmin can note it if needed
            message = $"Lisans {user.Email} adresine atandı. Görüntüleme şifresi e-posta ile iletildi.",
        });
    }

    // DELETE /api/admin/license-assignments/{id} — SuperAdmin: revoke
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Revoke(Guid id, CancellationToken ct)
    {
        var assignment = await db.LicenseAssignments
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, ct);

        if (assignment == null)
            return NotFound(new { error = "Atama bulunamadı." });

        assignment.IsRevoked = true;
        assignment.UpdatedDate = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(new { message = "Lisans ataması iptal edildi." });
    }

    // POST /api/admin/license-assignments/my-license — any Admin: reveal own assigned license
    [HttpPost("my-license")]
    public async Task<IActionResult> RevealMyLicense([FromBody] RevealMyLicenseRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Şifre boş olamaz." });

        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized(new { error = "Geçersiz oturum." });

        var assignment = await db.LicenseAssignments
            .Where(a => a.AdminUserId == userId && !a.IsDeleted && !a.IsRevoked)
            .OrderByDescending(a => a.CreatedDate)
            .FirstOrDefaultAsync(ct);

        if (assignment == null)
            return NotFound(new { error = "Size atanmış aktif bir lisans bulunamadı. Sistem yöneticinizle iletişime geçin." });

        if (CryptoHelper.Hash(req.Password) != assignment.ViewPasswordHash)
            return Unauthorized(new { error = "Geçersiz görüntüleme şifresi." });

        string? issuer = null, notBefore = null, expiresAt = null, app = null;
        try
        {
            var info = ParseLicenseInfoObj(assignment.LicenseToken);
            if (info != null)
            {
                issuer = info.Value.Issuer;
                notBefore = info.Value.NotBefore;
                expiresAt = info.Value.ExpiresAt;
                app = info.Value.App;
            }
        }
        catch { }

        return Ok(new
        {
            licenseToken = assignment.LicenseToken,
            assignedAt   = assignment.CreatedDate,
            app,
            issuer,
            notBefore,
            expiresAt,
        });
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static string GenerateViewPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var rng = new byte[16];
        System.Security.Cryptography.RandomNumberGenerator.Fill(rng);
        var sb = new StringBuilder(19);
        for (int i = 0; i < 16; i++)
        {
            if (i > 0 && i % 4 == 0) sb.Append('-');
            sb.Append(chars[rng[i] % chars.Length]);
        }
        return sb.ToString();
    }

    private static string MaskToken(string token)
    {
        if (string.IsNullOrEmpty(token)) return "****";
        var dot = token.IndexOf('.');
        if (dot < 0) return token.Length <= 12 ? new string('*', token.Length) : token[..6] + "···";
        var header = token[..dot];
        return header.Length <= 12 ? header + ".***" : header[..10] + "···" + ".***";
    }

    private static object? ParseLicenseInfo(string token)
    {
        try
        {
            var info = ParseLicenseInfoObj(token);
            if (info == null) return null;
            return new { info.Value.App, info.Value.Issuer, info.Value.NotBefore, info.Value.ExpiresAt };
        }
        catch { return null; }
    }

    private static (string App, string Issuer, string NotBefore, string ExpiresAt)? ParseLicenseInfoObj(string token)
    {
        var parts = token.Trim().Split('.');
        if (parts.Length < 1) return null;
        var p = parts[0].Replace('-', '+').Replace('_', '/');
        switch (p.Length % 4) { case 2: p += "=="; break; case 3: p += "="; break; }
        var json = Encoding.UTF8.GetString(Convert.FromBase64String(p));
        var doc = JsonDocument.Parse(json).RootElement;
        return (
            doc.GetProperty("app").GetString() ?? "",
            doc.GetProperty("iss").GetString() ?? "",
            doc.GetProperty("nbf").GetString() ?? "",
            doc.GetProperty("exp").GetString() ?? ""
        );
    }
}

public record AssignLicenseRequest(string AdminEmail, string LicenseToken, string? Notes);
public record RevealMyLicenseRequest(string Password);
