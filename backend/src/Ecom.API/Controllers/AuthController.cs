using Ecom.Application.Features.Auth.Commands;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Ecom.API.Controllers;

public class RefreshTokenRequest { public string RefreshToken { get; set; } = string.Empty; }
public class GoogleLoginRequest { public string IdToken { get; set; } = string.Empty; }
public class TwoFactorLoginRequest { public Guid UserId { get; set; } public string Code { get; set; } = string.Empty; public bool RememberMe { get; set; } }

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController(IMediator mediator) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        if (!result.Succeeded)
            return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailCommand command, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        if (!result.Succeeded)
            return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpPost("verify-telegram")]
    public async Task<IActionResult> VerifyTelegram([FromBody] VerifyTelegramCommand command, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        if (!result.Succeeded)
            return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        if (!result.Succeeded)
            return Unauthorized(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest req, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new RefreshTokenCommand(req.RefreshToken), cancellationToken);
        if (!result.Succeeded)
            return Unauthorized(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordCommand command, CancellationToken cancellationToken)
    {
        await mediator.Send(command, cancellationToken);
        return Ok(new { message = "Şifre sıfırlama bağlantısı gönderildi." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        if (!result.Succeeded)
            return BadRequest(new { error = result.Error });
        return Ok(new { message = "Şifreniz başarıyla güncellendi." });
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest req, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GoogleLoginCommand(req.IdToken), cancellationToken);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpPost("2fa")]
    public async Task<IActionResult> TwoFactorLogin([FromBody] TwoFactorLoginRequest req, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new TwoFactorLoginCommand(req.UserId, req.Code, req.RememberMe), cancellationToken);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }
}
