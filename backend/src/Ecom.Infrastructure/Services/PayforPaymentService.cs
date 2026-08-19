using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Ecom.Infrastructure.Services;

// QNB Finansbank Payfor — 3DHost entegrasyonu.
// Kart verileri asla sunucuya gelmez; banka kendi sayfasında toplar.
// Hash: Base64(SHA1(MbrId + OrderId + PurchAmount + OkUrl + FailUrl + TxnType + InstallmentCount + Rnd + MerchantPass))
//
// M047 fix: Browser IP'si QNB tarafından bloklanabiliyor.
// Bu nedenle sunucu QNB'ye POST yapar, dönen HTML form alanları parse edilip
// session cache'e alınır; kart formu kendi UI'ımızda gösterilir,
// kart submit'i de /api/payments/payfor-forward üzerinden proxy edilir.
public class PayforPaymentService(IApplicationDbContext db, IHttpClientFactory httpClientFactory, ILogger<PayforPaymentService> logger) : IPaymentService
{
    private const string TestGateway = "https://vpostest.qnbfinansbank.com/Gateway/3DHost.aspx";
    private const string LiveGateway = "https://vpos.qnb.com.tr/Gateway/3DHost.aspx";

    public async Task<Result<PaymentInitiateResult>> InitiateAsync(
        PaymentContext context, CancellationToken ct = default)
    {
        var keys = new[]
        {
            "PaymentSanalPosEnabled", "PaymentSanalPosProvider", "PaymentSanalPosTestMode",
            "Payfor_MbrId", "Payfor_MerchantID", "Payfor_UserCode", "Payfor_UserPass",
            "Payfor_MerchantPass", "Payfor_GatewayUrl"
        };

        var s = await db.SiteSettings
            .AsNoTracking()
            .Where(x => keys.Contains(x.Key) && !x.IsDeleted)
            .ToDictionaryAsync(x => x.Key, x => x.Value, ct);

        if (s.GetValueOrDefault("PaymentSanalPosEnabled") != "true")
            return Result<PaymentInitiateResult>.Failure(
                "Sanal POS aktif değil. Yönetim paneli > Ödeme ayarlarından etkinleştirin.");

        if (!string.Equals(s.GetValueOrDefault("PaymentSanalPosProvider"), "payfor", StringComparison.OrdinalIgnoreCase))
            return Result<PaymentInitiateResult>.Failure(
                "Ödeme sağlayıcı 'Payfor' olarak seçilmemiş.");

        var mbrId        = s.GetValueOrDefault("Payfor_MbrId",       "5")!;
        var merchantId   = s.GetValueOrDefault("Payfor_MerchantID",  "");
        var userCode     = s.GetValueOrDefault("Payfor_UserCode",     "");
        var userPass     = s.GetValueOrDefault("Payfor_UserPass",     "");
        var merchantPass = s.GetValueOrDefault("Payfor_MerchantPass","");

        if (string.IsNullOrWhiteSpace(merchantId) || string.IsNullOrWhiteSpace(userCode) || string.IsNullOrWhiteSpace(merchantPass))
            return Result<PaymentInitiateResult>.Failure(
                "Payfor kimlik bilgileri eksik. Yönetim panelinden MerchantID, UserCode ve MerchantPass girin.");

        var isTest = !string.Equals(s.GetValueOrDefault("PaymentSanalPosTestMode"), "false", StringComparison.OrdinalIgnoreCase);
        var gatewayUrl = s.GetValueOrDefault("Payfor_GatewayUrl") is { Length: > 0 } g
            ? g
            : (isTest ? TestGateway : LiveGateway);

        var okUrl   = context.CallbackUrl ?? throw new InvalidOperationException("CallbackUrl required for Payfor");
        var failUrl = context.CallbackUrl;
        var orderId = context.OrderNumber;
        var amount  = context.Amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);
        const string txnType          = "Auth";
        const string installmentCount = "0";
        var rnd = DateTime.UtcNow.Ticks.ToString();

        var hashStr = $"{mbrId}{orderId}{amount}{okUrl}{failUrl}{txnType}{installmentCount}{rnd}{merchantPass}";
        var hash    = Convert.ToBase64String(SHA1.HashData(Encoding.UTF8.GetBytes(hashStr)));

        var formFields = new Dictionary<string, string>
        {
            ["MbrId"]            = mbrId,
            ["MerchantID"]       = merchantId!,
            ["UserCode"]         = userCode!,
            ["UserPass"]         = userPass!,
            ["SecureType"]       = "3DHost",
            ["TxnType"]          = txnType,
            ["InstallmentCount"] = installmentCount,
            ["Currency"]         = "949",
            ["OkUrl"]            = okUrl,
            ["FailUrl"]          = failUrl,
            ["OrderId"]          = orderId,
            ["OrgOrderId"]       = "",
            ["PurchAmount"]      = amount,
            ["Lang"]             = "TR",
            ["Rnd"]              = rnd,
            ["Hash"]             = hash,
        };

        var transactionId = $"PF-{context.OrderId:N}-{DateTime.UtcNow:HHmmss}";

        // QNB M047 fix: all requests to gateway must come from the application server.
        // Card data + merchant params are combined in ONE server-to-server POST (payfor-forward).
        // InitiateAsync only caches the merchant params; no call to QNB here.
        var sessionId = PayforSessionCache.Store(new QnbFormData(
            gatewayUrl,
            formFields,
            DateTimeOffset.UtcNow.AddMinutes(20)));

        var amountForDisplay = context.Amount.ToString("N2", new System.Globalization.CultureInfo("tr-TR")) + " TL";
        logger.LogInformation("Payfor-initiate: session cached, gateway={Url}", gatewayUrl);

        var json = JsonSerializer.Serialize(new
        {
            type      = "payfor_3dhost",
            sessionId,
            amount    = amountForDisplay,
        });

        return Result<PaymentInitiateResult>.Success(
            new PaymentInitiateResult(transactionId, gatewayUrl, false, json));
    }

    private static (string formAction, Dictionary<string, string> hiddenFields) ParseQnbForm(
        string html, string pageUrl)
    {
        var hiddenFields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        // Extract form action
        var actionMatch = Regex.Match(html, @"<form\b[^>]*\baction=[""']([^""']+)[""']", RegexOptions.IgnoreCase);
        var rawAction   = actionMatch.Success ? actionMatch.Groups[1].Value : pageUrl;

        string formAction;
        try
        {
            formAction = rawAction.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                ? rawAction
                : new Uri(new Uri(pageUrl), rawAction).ToString();
        }
        catch { formAction = pageUrl; }

        // Extract all hidden inputs
        foreach (Match m in Regex.Matches(html, @"<input\b([^>]*)>", RegexOptions.IgnoreCase))
        {
            var attrs = m.Groups[1].Value;
            var typeM = Regex.Match(attrs, @"\btype=[""']([^""']+)[""']", RegexOptions.IgnoreCase);
            if (typeM.Success && !typeM.Groups[1].Value.Equals("hidden", StringComparison.OrdinalIgnoreCase))
                continue;

            var nameM  = Regex.Match(attrs, @"\bname=[""']([^""']+)[""']", RegexOptions.IgnoreCase);
            var valueM = Regex.Match(attrs, @"\bvalue=[""']([^""']*)[""']", RegexOptions.IgnoreCase);
            if (!nameM.Success) continue;

            hiddenFields[nameM.Groups[1].Value] = valueM.Success ? valueM.Groups[1].Value : "";
        }

        return (formAction, hiddenFields);
    }

    public async Task<Result<bool>> VerifyCallbackAsync(
        string transactionId, string providerPayload, CancellationToken ct = default)
    {
        try
        {
            var fields = JsonSerializer.Deserialize<Dictionary<string, string>>(providerPayload);
            if (fields is null) return Result<bool>.Success(false);

            var procReturnCode = fields.GetValueOrDefault("ProcReturnCode", "");
            var isSuccess      = procReturnCode == "00";

            // HASH doğrulama: HASHPARAMSVAL + MerchantPass → SHA1 → Base64
            if (isSuccess
                && fields.TryGetValue("HASH",          out var bankHash)
                && fields.TryGetValue("HASHPARAMSVAL", out var hashParamsVal)
                && !string.IsNullOrEmpty(bankHash))
            {
                var merchantPass = await db.SiteSettings
                    .AsNoTracking()
                    .Where(x => x.Key == "Payfor_MerchantPass" && !x.IsDeleted)
                    .Select(x => x.Value)
                    .FirstOrDefaultAsync(ct);

                if (!string.IsNullOrEmpty(merchantPass))
                {
                    var expected = Convert.ToBase64String(
                        SHA1.HashData(Encoding.UTF8.GetBytes(hashParamsVal + merchantPass)));
                    isSuccess = expected == bankHash;
                }
            }

            return Result<bool>.Success(isSuccess);
        }
        catch
        {
            return Result<bool>.Success(false);
        }
    }
}
