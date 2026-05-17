using Ecom.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/email")]
[Authorize(Roles = "SuperAdmin")]
public class EmailController(IEmailService emailService) : ControllerBase
{
    [HttpPost("test")]
    public async Task<IActionResult> SendTest([FromBody] TestEmailRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.ToEmail))
            return BadRequest("ToEmail gerekli.");
        await emailService.SendTestEmailAsync(req.ToEmail, ct);
        return Ok(new { message = $"Test e-postası {req.ToEmail} adresine gönderildi." });
    }
}

public record TestEmailRequest(string ToEmail);
