using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Payments.Commands;
using Ecom.Domain.Enums;
using Ecom.Infrastructure.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController(
    IMediator mediator,
    ICurrentUserService currentUser,
    IConfiguration config,
    IApplicationDbContext db,
    IPaymentService paymentService) : ControllerBase
{
    [HttpPost("initiate")]
    [AllowAnonymous]   // guest checkout desteği; handler sahiplik kontrolü yapar
    public async Task<IActionResult> Initiate([FromBody] InitiatePaymentRequest req, CancellationToken ct)
    {
        var siteCallbackBase = await db.SiteSettings
            .AsNoTracking()
            .Where(x => x.Key == "Payfor_CallbackBaseUrl" && !x.IsDeleted)
            .Select(x => x.Value)
            .FirstOrDefaultAsync(ct);

        var callbackBase = (siteCallbackBase is { Length: > 0 } ? siteCallbackBase : null)
            ?? config["Payfor:CallbackBaseUrl"]
            ?? $"{Request.Scheme}://{Request.Host}";

        var callbackPath = paymentService is PayforPaymentService
            ? "payfor-callback"
            : "iyzico-callback";

        var callbackUrl = $"{callbackBase}/api/payments/{callbackPath}";
        var buyerIp     = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await mediator.Send(new InitiatePaymentCommand(
            req.OrderId, currentUser.UserId, req.Method, callbackUrl, buyerIp), ct);

        if (!result.Succeeded) return BadRequest(new { error = result.Error });

        var data = result.Data!;
        return Ok(new
        {
            transactionId       = data.TransactionId,
            requiresRedirect    = data.RequiresRedirect,
            redirectUrl         = data.RedirectUrl,
            checkoutFormContent = data.CheckoutFormContent
        });
    }

    /// <summary>
    /// Payfor (QNB Finansbank) 3DHost callback — banka bu endpoint'i POST ile çağırır.
    /// OkUrl ve FailUrl olarak aynı endpoint kullanılır; ProcReturnCode "00" ise başarılı.
    /// </summary>
    [HttpPost("payfor-callback")]
    [AllowAnonymous]
    public async Task<IActionResult> PayforCallback(CancellationToken ct)
    {
        var form           = Request.Form;
        var orderNumber    = form["OrderId"].ToString();
        var procReturnCode = form["ProcReturnCode"].ToString();
        var authCode       = form["AuthCode"].ToString();
        var errMsg         = form["ErrMsg"].ToString();

        var isSuccess = procReturnCode == "00" && !string.IsNullOrEmpty(authCode);

        // Tüm callback alanlarını JSON olarak sakla (PaymentCallbackCommand.ProviderResponseJson)
        var payload = JsonSerializer.Serialize(
            form.Keys.ToDictionary(k => k, k => form[k].ToString()));

        // Siparişi OrderNumber ile bul, ilgili Payment kaydını al
        var payment = await db.Payments
            .Include(p => p.Order)
                .ThenInclude(o => o!.Items)
            .Where(p => p.Order != null && p.Order.OrderNumber == orderNumber)
            .OrderByDescending(p => p.CreatedDate)
            .FirstOrDefaultAsync(ct);

        var frontendBase = config["AllowedOrigins:0"] ?? "http://localhost:3000";

        if (payment is null)
            return Redirect($"{frontendBase}/odeme/basarisiz?err=siparis_bulunamadi");

        var result = await mediator.Send(
            new PaymentCallbackCommand(payment.TransactionId!, payload, isSuccess), ct);

        if (result.Succeeded && isSuccess)
            return Redirect($"{frontendBase}/odeme/basarili?siparis={Uri.EscapeDataString(orderNumber)}");

        var errParam = string.IsNullOrEmpty(errMsg) ? "odeme_hatasi" : errMsg;
        return Redirect($"{frontendBase}/odeme/basarisiz?siparis={Uri.EscapeDataString(orderNumber)}&err={Uri.EscapeDataString(errParam)}");
    }

    /// <summary>
    /// Mock / manuel callback — body: {"transactionId":"...", "payload":"{\"success\":true}", "isSuccess":true}
    /// </summary>
    [HttpPost("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromBody] PaymentCallbackRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(
            new PaymentCallbackCommand(req.TransactionId, req.Payload, req.IsSuccess), ct);

        return result.Succeeded ? NoContent() : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// İyzico Checkout Form callback — İyzico bu endpoint'i POST ile çağırır.
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

        var isSuccess = string.Equals(status, "success", StringComparison.OrdinalIgnoreCase);
        var result    = await mediator.Send(new PaymentCallbackCommand(token, token, isSuccess), ct);

        var frontendBase = config["AllowedOrigins:0"] ?? "http://localhost:3000";
        return Redirect(result.Succeeded && isSuccess
            ? $"{frontendBase}/odeme/basarili"
            : $"{frontendBase}/odeme/basarisiz");
    }
}

public class InitiatePaymentRequest
{
    public Guid OrderId { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public PaymentMethod Method { get; set; } = PaymentMethod.CreditCard;
}

public class PaymentCallbackRequest
{
    public string TransactionId { get; set; } = string.Empty;
    public string Payload       { get; set; } = string.Empty;
    public bool   IsSuccess     { get; set; }
}
