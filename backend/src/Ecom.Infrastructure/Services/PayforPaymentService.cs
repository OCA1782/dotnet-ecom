using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Ecom.Infrastructure.Services;

// QNB Finansbank Payfor — 3DHost entegrasyonu.
// Kart verileri asla sunucuya gelmez; banka kendi sayfasında toplar.
// Hash: Base64(SHA1(MbrId + OrderId + PurchAmount + OkUrl + FailUrl + TxnType + InstallmentCount + Rnd + MerchantPass))
public class PayforPaymentService(IApplicationDbContext db, IHttpClientFactory httpClientFactory) : IPaymentService
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

        var mbrId       = s.GetValueOrDefault("Payfor_MbrId",       "5")!;
        var merchantId  = s.GetValueOrDefault("Payfor_MerchantID",  "");
        var userCode    = s.GetValueOrDefault("Payfor_UserCode",     "");
        var userPass    = s.GetValueOrDefault("Payfor_UserPass",     "");
        var merchantPass= s.GetValueOrDefault("Payfor_MerchantPass","");

        if (string.IsNullOrWhiteSpace(merchantId) || string.IsNullOrWhiteSpace(userCode) || string.IsNullOrWhiteSpace(merchantPass))
            return Result<PaymentInitiateResult>.Failure(
                "Payfor kimlik bilgileri eksik. Yönetim panelinden MerchantID, UserCode ve MerchantPass girin.");

        var isTest = !string.Equals(s.GetValueOrDefault("PaymentSanalPosTestMode"), "false", StringComparison.OrdinalIgnoreCase);
        var gatewayUrl = s.GetValueOrDefault("Payfor_GatewayUrl") is { Length: > 0 } g
            ? g
            : (isTest ? TestGateway : LiveGateway);

        var okUrl  = context.CallbackUrl ?? throw new InvalidOperationException("CallbackUrl required for Payfor");
        var failUrl= context.CallbackUrl;
        var orderId= context.OrderNumber;
        var amount = context.Amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);
        const string txnType          = "Auth";
        const string installmentCount = "0";     // bank 3DHost sayfasında gösterir
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

        // M047 fix: POST to QNB from server so QNB sees server IP, not browser IP.
        var http = httpClientFactory.CreateClient();
        using var gatewayResponse = await http.PostAsync(gatewayUrl, new FormUrlEncodedContent(formFields), ct);
        var gatewayHtml = await gatewayResponse.Content.ReadAsStringAsync(ct);

        // Inline QNB's CSS server-side so browser never needs to load cross-origin stylesheets.
        // Also inject <base> tag so remaining relative URLs (images, form action) resolve correctly.
        gatewayHtml = await InlineCssAndInjectBaseAsync(gatewayHtml, gatewayUrl, http, ct);

        return Result<PaymentInitiateResult>.Success(
            new PaymentInitiateResult(transactionId, gatewayUrl, false, gatewayHtml));
    }

    // Fetches all <link rel="stylesheet"> files from QNB's server and inlines them as <style> blocks,
    // then injects a <base> tag so remaining relative URLs (images, form action) point to QNB's domain.
    private static async Task<string> InlineCssAndInjectBaseAsync(
        string html, string pageUrl, HttpClient http, CancellationToken ct)
    {
        var baseUri = new Uri(pageUrl);
        var origin  = $"{baseUri.Scheme}://{baseUri.Host}";

        // Inject <base> tag as first element inside <head>
        var headIdx = html.IndexOf("<head>", StringComparison.OrdinalIgnoreCase);
        if (headIdx >= 0)
            html = html.Insert(headIdx + 6, $"<base href=\"{origin}/\">");
        else
            html = $"<!DOCTYPE html><html><head><base href=\"{origin}/\"></head><body>{html}</body></html>";

        // Find all <link rel="stylesheet"> tags
        var linkRegex  = new Regex(@"<link\b([^>]*)>", RegexOptions.IgnoreCase);
        var hrefRegex  = new Regex(@"\bhref=[""']([^""']+)[""']", RegexOptions.IgnoreCase);
        var relRegex   = new Regex(@"\brel=[""']stylesheet[""']", RegexOptions.IgnoreCase);
        var typeRegex  = new Regex(@"\btype=[""']text/css[""']", RegexOptions.IgnoreCase);

        var stylesheetMatches = linkRegex.Matches(html)
            .Cast<Match>()
            .Where(m =>
            {
                var attrs = m.Groups[1].Value;
                return relRegex.IsMatch(attrs) || typeRegex.IsMatch(attrs);
            })
            .OrderByDescending(m => m.Index)
            .ToList();

        // Fetch each CSS in parallel with individual 5-second timeouts
        var fetchTasks = stylesheetMatches.Select(async match =>
        {
            var hrefMatch = hrefRegex.Match(match.Groups[1].Value);
            if (!hrefMatch.Success) return (match, (string?)null);

            var href = hrefMatch.Groups[1].Value;
            if (href.StartsWith("data:", StringComparison.OrdinalIgnoreCase)) return (match, (string?)null);

            Uri cssUri;
            try { cssUri = href.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? new Uri(href) : new Uri(baseUri, href); }
            catch { return (match, (string?)null); }

            try
            {
                using var fetchCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                fetchCts.CancelAfter(TimeSpan.FromSeconds(5));
                var css = await http.GetStringAsync(cssUri, fetchCts.Token);
                return (match, (string?)$"<style>/* {cssUri} */\n{css}\n</style>");
            }
            catch { return (match, (string?)null); }
        });

        var results = await Task.WhenAll(fetchTasks);

        // Apply replacements in reverse index order to preserve string positions
        foreach (var (match, replacement) in results.Where(r => r.Item2 != null))
            html = html[..match.Index] + replacement + html[(match.Index + match.Length)..];

        return html;
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
