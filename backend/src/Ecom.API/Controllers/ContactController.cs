using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController(IMediator mediator, IEmailService emailService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] ContactRequest req, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var settings = await mediator.Send(new GetSettingsQuery(), ct);
        var recipientEmail = settings.GetValueOrDefault("ContactEmail", "");

        if (!string.IsNullOrWhiteSpace(recipientEmail))
        {
            try
            {
                await emailService.SendContactFormAsync(recipientEmail, req.Name, req.Email, req.Message, ct);
            }
            catch { /* log ama müşteriye hata gösterme */ }
        }

        return Ok(new { message = "Mesajınız alındı. En kısa sürede dönüş yapacağız." });
    }
}

public class ContactRequest
{
    [Required(ErrorMessage = "Ad Soyad zorunludur.")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "E-posta zorunludur.")]
    [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz.")]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mesaj zorunludur.")]
    [MaxLength(2000)]
    public string Message { get; set; } = string.Empty;
}
