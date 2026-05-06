using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Payments.Commands;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController(
    IMediator mediator,
    ICurrentUserService currentUser,
    IConfiguration config) : ControllerBase
{
    [HttpPost("initiate")]
    [Authorize]
    public async Task<IActionResult> Initiate([FromBody] InitiatePaymentRequest req, CancellationToken ct)
    {
        var callbackBase = config["Iyzico:CallbackBaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var callbackUrl = $"{callbackBase}/api/payments/iyzico-callback";

        var buyerIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await mediator.Send(new InitiatePaymentCommand(
            req.OrderId, currentUser.UserId, req.Method, callbackUrl, buyerIp), ct);

        if (!result.Succeeded) return BadRequest(result.Error);

        var data = result.Data!;
        return Ok(new
        {
            transactionId = data.TransactionId,
            requiresRedirect = data.RequiresRedirect,
            redirectUrl = data.RedirectUrl,
            checkoutFormContent = data.CheckoutFormContent
        });
    }

    /// <summary>
    /// Mock callback — body: {"transactionId":"...", "payload":"{\"success\":true}", "isSuccess":true}
    /// </summary>
    [HttpPost("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromBody] PaymentCallbackRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(
            new PaymentCallbackCommand(req.TransactionId, req.Payload, req.IsSuccess), ct);

        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    /// <summary>
    /// İyzico Checkout Form callback — İyzico bu endpoint'i POST ile çağırır.
    /// Body form-encoded: token=xxx&status=success
    /// </summary>
    [HttpPost("iyzico-callback")]
    [AllowAnonymous]
    public async Task<IActionResult> IyzicoCallback(
        [FromForm] string? token,
        [FromForm] string? status,
        CancellationToken ct)
    {
        if (string.IsNullOrEmpty(token))
            return BadRequest("Token missing");

        // token = İyzico ödeme token'ı (transactionId olarak saklandı)
        var isSuccess = string.Equals(status, "success", StringComparison.OrdinalIgnoreCase);

        var result = await mediator.Send(
            new PaymentCallbackCommand(token, token, isSuccess), ct);

        // İyzico callback'ten sonra frontend'e yönlendir
        var frontendBase = config["AllowedOrigins:0"] ?? "http://localhost:3000";
        var redirectPath = result.Succeeded && isSuccess
            ? $"{frontendBase}/odeme/basarili"
            : $"{frontendBase}/odeme/basarisiz";

        return Redirect(redirectPath);
    }
}

public class InitiatePaymentRequest
{
    public Guid OrderId { get; set; }
    public PaymentMethod Method { get; set; } = PaymentMethod.CreditCard;
}

public class PaymentCallbackRequest
{
    public string TransactionId { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
}
