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
    IPaymentService paymentService,
    ILogger<PaymentsController> logger) : ControllerBase
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
    [HttpGet("payfor-callback")]
    [HttpPost("payfor-callback")]
    [AllowAnonymous]
    public async Task<IActionResult> PayforCallback(CancellationToken ct)
    {
        // Support both POST (standard 3DHost form submission) and GET (QNB immediate redirect without 3DS)
        string GetField(string key)
        {
            if (Request.HasFormContentType && Request.Form.ContainsKey(key))
                return Request.Form[key].ToString();
            return Request.Query[key].ToString();
        }

        var orderNumber    = GetField("OrderId");
        var procReturnCode = GetField("ProcReturnCode");
        var authCode       = GetField("AuthCode");
        var errMsg         = GetField("ErrMsg");

        var isSuccess = procReturnCode == "00" && !string.IsNullOrEmpty(authCode);

        // Tüm callback alanlarını JSON olarak sakla
        var payload = Request.HasFormContentType
            ? JsonSerializer.Serialize(Request.Form.Keys.ToDictionary(k => k, k => Request.Form[k].ToString()))
            : JsonSerializer.Serialize(Request.Query.Keys.ToDictionary(k => k, k => Request.Query[k].ToString()));

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
    /// Payfor 3DHost proxy — kart verisini sunucu üzerinden QNB'ye iletir (M047 IP kısıtlaması aşımı).
    /// Browser doğrudan QNB'ye bağlanamadığı için kart bilgileri buraya POST edilir.
    /// </summary>
    [HttpPost("payfor-forward")]
    [AllowAnonymous]
    public async Task<IActionResult> PayforForward([FromBody] PayforCardRequest req, CancellationToken ct)
    {
        var session = PayforSessionCache.Get(req.SessionId);
        if (session is null)
            return BadRequest(new { error = "Oturum süresi doldu veya geçersiz. Lütfen ödeme adımını yeniden başlatın." });

        var postFields = new Dictionary<string, string>(session.HiddenFields);
        postFields["Pan"]            = req.Pan.Replace(" ", "");
        postFields["CardHolderName"] = req.CardHolderName;
        // QNB 3DHost expects ExpiryDate as MMYY (4-digit combined), not separate fields
        var year2 = req.ExpiryYear.Length >= 2 ? req.ExpiryYear[^2..] : req.ExpiryYear;
        postFields["ExpiryDate"]     = $"{req.ExpiryMonth}{year2}";
        postFields["Cvv2"]           = req.Cvv2;

        logger.LogInformation("Payfor-forward: action={Action} hiddenCount={Count} pan={Pan}",
            session.FormAction, session.HiddenFields.Count, MaskPan(req.Pan));

        using var http = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false });
        http.Timeout = TimeSpan.FromSeconds(30);

        HttpResponseMessage response;
        try
        {
            response = await http.PostAsync(session.FormAction, new FormUrlEncodedContent(postFields), ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Payfor-forward: QNB POST failed action={Action}", session.FormAction);
            return BadRequest(new { error = "QNB sunucusuna bağlanılamadı. Lütfen tekrar deneyin." });
        }

        var statusCode = (int)response.StatusCode;
        logger.LogInformation("Payfor-forward: QNB response status={Status}", statusCode);

        if (statusCode is 301 or 302 or 303 or 307 or 308)
        {
            var location = response.Headers.Location?.ToString();
            logger.LogInformation("Payfor-forward: redirect → {Location}", location);
            if (!string.IsNullOrEmpty(location))
            {
                // Relative redirect (e.g. /error/500) = QNB error — don't forward to browser
                if (!location.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                {
                    logger.LogWarning("Payfor-forward: QNB relative error redirect → {Location}", location);
                    return Ok(new { type = "qnb_error", html = string.Empty });
                }
                return Ok(new { type = "redirect", url = location });
            }
        }

        var html = await response.Content.ReadAsStringAsync(ct);
        var preview = html.Length > 400 ? html[..400].Replace('\n', ' ').Replace('\r', ' ') : html;
        logger.LogInformation("Payfor-forward: QNB HTML len={Len} preview={Preview}", html.Length, preview);

        // No <form> → QNB returned an error page, not a 3DS challenge
        if (!html.Contains("<form", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning("Payfor-forward: QNB response has no <form> — likely error page");
            return Ok(new { type = "qnb_error", html });
        }

        // Inject <base> tag so all relative URLs in QNB's 3DS page resolve to QNB's domain,
        // not to our domain (which causes 404 when blob-URL iframe submits to relative paths).
        try
        {
            var baseUri  = new Uri(session.FormAction);
            var lastSlash = baseUri.AbsolutePath.LastIndexOf('/');
            var dir = lastSlash > 0 ? baseUri.AbsolutePath[..(lastSlash + 1)] : "/";
            var baseHref = $"{baseUri.Scheme}://{baseUri.Host}{dir}";
            if (!html.Contains("<base ", StringComparison.OrdinalIgnoreCase))
            {
                var headIdx = html.IndexOf("<head>", StringComparison.OrdinalIgnoreCase);
                html = headIdx >= 0
                    ? html.Insert(headIdx + 6, $"<base href=\"{baseHref}\">")
                    : $"<base href=\"{baseHref}\">{html}";
            }
        }
        catch { /* keep html as-is if URI parse fails */ }

        return Ok(new { type = "html", html });
    }

    private static string MaskPan(string pan)
    {
        var d = pan.Replace(" ", "");
        return d.Length >= 8 ? d[..4] + "••••" + d[^4..] : "••••";
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

public class PayforCardRequest
{
    public string SessionId      { get; set; } = string.Empty;
    public string Pan            { get; set; } = string.Empty;
    public string CardHolderName { get; set; } = string.Empty;
    public string ExpiryMonth    { get; set; } = string.Empty;
    public string ExpiryYear     { get; set; } = string.Empty;
    public string Cvv2           { get; set; } = string.Empty;
}
