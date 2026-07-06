using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin.Commands;
using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/settings")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SettingsController(
    IMediator mediator,
    IEmailService emailService,
    IWebHostEnvironment hostEnv,
    IConfiguration config) : ControllerBase
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

        // CustomerTemplate değiştiğinde customer .env.local'daki fallback'i otomatik senkronize et.
        // Böylece API geçici olarak erişilemez olsa bile (deploy, restart, timeout) şablon kaybolmaz.
        // Yol: appsettings.Development.json → "CustomerFrontendEnvPath" (üretimde tanımlı değilse sessizce geçer).
        if (settings.TryGetValue("CustomerTemplate", out var newTemplate) && !string.IsNullOrWhiteSpace(newTemplate))
        {
            var envPath = config["CustomerFrontendEnvPath"];
            if (!string.IsNullOrWhiteSpace(envPath))
            {
                var fullPath = Path.IsPathRooted(envPath)
                    ? envPath
                    : Path.GetFullPath(Path.Combine(hostEnv.ContentRootPath, envPath));
                SyncEnvVar(fullPath, "NEXT_PUBLIC_FALLBACK_TEMPLATE", newTemplate);
            }
        }

        return NoContent();
    }

    // .env dosyasında belirtilen key'i günceller; yoksa sona ekler.
    // Dosya yoksa veya yazma izni yoksa sessizce geçer — bu özellik geliştirme kolaylığıdır, kritik değil.
    private static void SyncEnvVar(string filePath, string key, string value)
    {
        try
        {
            var lines = System.IO.File.Exists(filePath)
                ? new List<string>(System.IO.File.ReadAllLines(filePath))
                : [];
            var idx = lines.FindIndex(l => l.StartsWith($"{key}=") || l.StartsWith($"{key} ="));
            if (idx >= 0)
                lines[idx] = $"{key}={value}";
            else
                lines.Add($"{key}={value}");
            System.IO.File.WriteAllLines(filePath, lines);
        }
        catch { /* Dosya erişim hatası — geliştirme dışı ortamda beklenen durum */ }
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
