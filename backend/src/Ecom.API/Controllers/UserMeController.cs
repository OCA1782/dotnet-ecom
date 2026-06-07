using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Auth.Commands;
using Ecom.Application.Features.Users.Commands;
using Ecom.Application.Features.Users.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/users/me")]
[Authorize]
public class UserMeController(IMediator mediator, ICurrentUserService currentUser, IWebHostEnvironment env) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var result = await mediator.Send(new GetCurrentUserQuery(currentUser.UserId!.Value), ct);
        return result is null ? Unauthorized() : Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateCurrentUserCommand
        {
            UserId = currentUser.UserId!.Value,
            Name = req.Name,
            Surname = req.Surname,
            PhoneNumber = req.PhoneNumber,
            CommercialConsent = req.CommercialConsent,
        }, ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    [HttpPost("avatar")]
    [EnableRateLimiting("upload")]
    public async Task<IActionResult> UploadAvatar(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Dosya bulunamadı." });

        string[] allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.Contains(file.ContentType))
            return BadRequest(new { error = "Sadece JPEG, PNG, WebP ve GIF desteklenmektedir." });

        if (file.Length > 3 * 1024 * 1024)
            return BadRequest(new { error = "Dosya boyutu en fazla 3 MB olabilir." });

        var uploadsPath = Path.Combine(
            env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"),
            "uploads", "avatars");
        Directory.CreateDirectory(uploadsPath);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"avatar_{currentUser.UserId}{ext}";
        var filePath = Path.Combine(uploadsPath, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream, ct);

        var url = $"{Request.Scheme}://{Request.Host}/uploads/avatars/{fileName}";

        var profile = await mediator.Send(new GetCurrentUserQuery(currentUser.UserId!.Value), ct);
        if (profile is null) return NotFound();

        await mediator.Send(new UpdateCurrentUserCommand
        {
            UserId = currentUser.UserId!.Value,
            Name = profile.Name,
            Surname = profile.Surname,
            PhoneNumber = profile.PhoneNumber,
            CommercialConsent = profile.CommercialConsent,
            AvatarUrl = url,
        }, ct);

        return Ok(new { url });
    }

    [HttpPatch("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new ChangePasswordCommand
        {
            UserId = currentUser.UserId!.Value,
            CurrentPassword = req.CurrentPassword,
            NewPassword = req.NewPassword,
            ConfirmPassword = req.ConfirmPassword,
        }, ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification(CancellationToken ct)
    {
        var result = await mediator.Send(new ResendVerificationCommand(currentUser.UserId!.Value), ct);
        return result.Succeeded ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    [HttpPost("2fa/setup")]
    public async Task<IActionResult> Setup2FA(CancellationToken ct)
    {
        var result = await mediator.Send(new Setup2FACommand(), ct);
        return result.Succeeded ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    [HttpPost("2fa/enable")]
    public async Task<IActionResult> Enable2FA([FromBody] TwoFactorCodeRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new Enable2FACommand(req.Code), ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpPost("2fa/disable")]
    public async Task<IActionResult> Disable2FA([FromBody] TwoFactorCodeRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new Disable2FACommand(req.Code), ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }
}

public class TwoFactorCodeRequest { public string Code { get; set; } = string.Empty; }

public class UpdateProfileRequest
{
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool CommercialConsent { get; set; }
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}
