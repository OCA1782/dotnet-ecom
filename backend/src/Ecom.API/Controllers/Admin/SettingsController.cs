using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin.Commands;
using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/settings")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SettingsController(IMediator mediator, IEmailService emailService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var result = await mediator.Send(new GetSettingsQuery(), ct);
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] Dictionary<string, string> settings, CancellationToken ct)
    {
        settings["SettingsVersion"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        await mediator.Send(new UpdateSettingsCommand(settings), ct);
        return NoContent();
    }

    [HttpPost("test-alert")]
    public async Task<IActionResult> TestAlert([FromBody] TestAlertRequest req, CancellationToken ct)
    {
        var emails = (req.Emails ?? []).Where(e => !string.IsNullOrWhiteSpace(e) && e.Contains('@')).ToList();
        if (emails.Count == 0)
            return BadRequest(new { error = "En az bir geçerli e-posta adresi gerekli." });

        var body = $"""
            <div style="font-family:sans-serif;max-width:480px;margin:32px auto;padding:24px;border:1px solid #bbf7d0;border-radius:12px;background:#fff">
              <h2 style="color:#16a34a;margin-top:0">✓ Ecom Platform — Test Uyarısı</h2>
              <p style="color:#374151">Bu e-posta, bildirim ayarlarınızın doğru çalıştığını doğrulamak için gönderildi.</p>
              <p style="color:#6b7280;font-size:13px">Gönderim zamanı: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
            </div>
            """;

        await emailService.SendAlertAsync(emails, "[Ecom] Bildirim Test Maili", body, ct);
        return Ok(new { message = $"{emails.Count} adrese test maili gönderildi." });
    }
}

public class TestAlertRequest
{
    public List<string>? Emails { get; set; }
}
