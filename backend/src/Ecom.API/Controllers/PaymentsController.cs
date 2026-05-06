using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Payments.Commands;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController(IMediator mediator, ICurrentUserService currentUser) : ControllerBase
{
    [HttpPost("initiate")]
    [Authorize]
    public async Task<IActionResult> Initiate([FromBody] InitiatePaymentRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new InitiatePaymentCommand(
            req.OrderId, currentUser.UserId, req.Method), ct);

        return result.Succeeded
            ? Ok(new { transactionId = result.Data })
            : BadRequest(result.Error);
    }

    /// <summary>
    /// Ödeme sağlayıcısından gelen callback. Gerçek entegrasyonda HMAC/imza doğrulaması ekleyin.
    /// Mock: body'de {"transactionId":"...", "payload":"{\"success\":true}"} gönderin.
    /// </summary>
    [HttpPost("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromBody] PaymentCallbackRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new PaymentCallbackCommand(
            req.TransactionId, req.Payload, req.IsSuccess), ct);

        return result.Succeeded ? Ok() : BadRequest(result.Error);
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
