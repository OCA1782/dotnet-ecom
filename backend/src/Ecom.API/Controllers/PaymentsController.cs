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
    /// QNB 3DPay server-side flow (M047 compliance):
    ///   Server POSTs card + merchant params to Default.aspx (initial request must be server-side per QNB policy).
    ///   QNB returns step1Form — a result-relay form containing ProcReturnCode, 3DStatus etc. pre-filled.
    ///   Browser auto-submits step1Form back to Default.aspx; QNB then redirects browser to OkUrl/FailUrl callback.
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
        var year2 = req.ExpiryYear.Length >= 2 ? req.ExpiryYear[^2..] : req.ExpiryYear;
        postFields["Expiry"]         = $"{req.ExpiryMonth}{year2}";
        postFields["Cvv2"]           = req.Cvv2;

        logger.LogInformation(
            "Payfor-forward: gateway={Action} orderId={OrderId} amount={Amount} expiry={Expiry} pan={Pan}",
            session.FormAction,
            postFields.GetValueOrDefault("OrderId"),
            postFields.GetValueOrDefault("PurchAmount"),
            postFields.GetValueOrDefault("Expiry"),
            MaskPan(req.Pan));

        var cookies = new System.Net.CookieContainer();
        using var handler = new HttpClientHandler { CookieContainer = cookies, AllowAutoRedirect = false };
        using var http = new HttpClient(handler);
        http.Timeout = TimeSpan.FromSeconds(30);
        http.DefaultRequestHeaders.UserAgent.ParseAdd(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        // Server POSTs card + merchant params — only this initial request must come from the server (M047 policy)
        HttpResponseMessage resp;
        try { resp = await http.PostAsync(session.FormAction, new FormUrlEncodedContent(postFields), ct); }
        catch (Exception ex)
        {
            logger.LogError(ex, "Payfor-forward: POST failed url={Url}", session.FormAction);
            return BadRequest(new { error = "QNB sunucusuna bağlanılamadı. Lütfen tekrar deneyin." });
        }

        var status = (int)resp.StatusCode;
        logger.LogInformation("Payfor-forward: status={Status}", status);

        if (status is 301 or 302 or 303 or 307 or 308)
        {
            var loc = QnbAbsoluteUrl(resp.Headers.Location?.ToString(), session.FormAction);
            logger.LogInformation("Payfor-forward: redirect={Url}", loc);
            if (!string.IsNullOrEmpty(loc))
                return QnbRedirectOrError(loc);
        }

        var html = await resp.Content.ReadAsStringAsync(ct);
        logger.LogInformation("Payfor-forward: HTML len={Len}", html.Length);
        if (html.Length <= 6000)
            logger.LogInformation("Payfor-forward: full HTML={Html}", html.Replace('\n', ' ').Replace('\r', ' '));

        if (!html.Contains("<form", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning("Payfor-forward: no <form> in response — QNB returned: {Content}",
                html.Length <= 1000 ? html : html[..1000]);
            return Ok(new { type = "qnb_error", html });
        }

        // Parse the result form to log payment outcome values for diagnostics
        var (formAction, formFields) = ParseHtmlForm(html, session.FormAction);
        logger.LogInformation(
            "Payfor-forward: result form action={Action} fields={Count} ProcReturnCode={PRC} 3DStatus={D3} TxnResult={Txn} AuthCode={Auth} ErrMsg={Err} ErrorData={ErrData}",
            formAction, formFields.Count,
            formFields.GetValueOrDefault("ProcReturnCode", ""),
            formFields.GetValueOrDefault("3DStatus",       ""),
            formFields.GetValueOrDefault("TxnResult",      ""),
            formFields.GetValueOrDefault("AuthCode",       ""),
            formFields.GetValueOrDefault("ErrMsg",         ""),
            formFields.GetValueOrDefault("ErrorData",      ""));

        // QNB's result form must be submitted by the browser back to Default.aspx.
        // QNB then redirects the browser to OkUrl or FailUrl based on the embedded result.
        // Inject <base> so relative URLs resolve to QNB's domain, and auto-submit so the
        // form delivers without user interaction.
        var finalHtml = QnbInjectBase(html, formAction);
        finalHtml = QnbInjectAutoSubmit(finalHtml);
        return Ok(new { type = "html", html = finalHtml });
    }

    private IActionResult QnbRedirectOrError(string url)
    {
        if (!url.StartsWith("http", StringComparison.OrdinalIgnoreCase) ||
            url.Contains("GatewayError", StringComparison.OrdinalIgnoreCase) ||
            url.Contains("/error/", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning("Payfor-forward: QNB error redirect → {Url}", url);
            return Ok(new { type = "qnb_error", html = string.Empty });
        }
        return Ok(new { type = "redirect", url });
    }

    private static (string action, Dictionary<string, string> fields) ParseHtmlForm(string html, string pageUrl)
    {
        var fields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var actionMatch = System.Text.RegularExpressions.Regex.Match(
            html, @"<form\b[^>]*\baction=[""']([^""']+)[""']", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        var action = QnbAbsoluteUrl(actionMatch.Success ? actionMatch.Groups[1].Value : null, pageUrl);

        foreach (System.Text.RegularExpressions.Match m in System.Text.RegularExpressions.Regex.Matches(
            html, @"<input\b([^>]*)/??>", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
        {
            var attrs = m.Groups[1].Value;
            var typeM = System.Text.RegularExpressions.Regex.Match(attrs,
                @"\btype=[""']([^""']+)[""']", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (typeM.Success && !typeM.Groups[1].Value.Equals("hidden", StringComparison.OrdinalIgnoreCase))
                continue;
            var nameM  = System.Text.RegularExpressions.Regex.Match(attrs,
                @"\bname=[""']([^""']+)[""']", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            var valueM = System.Text.RegularExpressions.Regex.Match(attrs,
                @"\bvalue=[""']([^""']*)[""']", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (!nameM.Success) continue;
            fields[nameM.Groups[1].Value] =
                System.Net.WebUtility.HtmlDecode(valueM.Success ? valueM.Groups[1].Value : "");
        }
        return (action, fields);
    }

    private static string QnbAbsoluteUrl(string? url, string baseUrl)
    {
        if (string.IsNullOrEmpty(url)) return baseUrl;
        if (url.StartsWith("http", StringComparison.OrdinalIgnoreCase)) return url;
        try { return new Uri(new Uri(baseUrl), url).ToString(); }
        catch { return baseUrl; }
    }

    private static string QnbInjectBase(string html, string refUrl)
    {
        try
        {
            var uri = new Uri(refUrl);
            var lastSlash = uri.AbsolutePath.LastIndexOf('/');
            var dir = lastSlash > 0 ? uri.AbsolutePath[..(lastSlash + 1)] : "/";
            var baseHref = $"{uri.Scheme}://{uri.Host}{dir}";
            if (!html.Contains("<base ", StringComparison.OrdinalIgnoreCase))
            {
                var headIdx   = html.IndexOf("<head", StringComparison.OrdinalIgnoreCase);
                var headClose = headIdx >= 0 ? html.IndexOf('>', headIdx) : -1;
                html = headClose >= 0
                    ? html.Insert(headClose + 1, $"<base href=\"{baseHref}\">")
                    : $"<base href=\"{baseHref}\">{html}";
            }
        }
        catch { /* keep html as-is */ }
        return html;
    }

    private static string QnbInjectAutoSubmit(string html)
    {
        // If QNB's page already has a submit() call, leave it as-is
        if (html.Contains(".submit()", StringComparison.OrdinalIgnoreCase))
            return html;
        const string script = "<script>window.onload=function(){" +
            "var f=document.getElementById('step1Form')||document.forms[0];" +
            "if(f)f.submit();" +
            "};</script>";
        var bodyClose = html.LastIndexOf("</body>", StringComparison.OrdinalIgnoreCase);
        return bodyClose >= 0 ? html.Insert(bodyClose, script) : html + script;
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
