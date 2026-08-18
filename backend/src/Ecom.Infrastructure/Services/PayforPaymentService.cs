using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

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

        return Result<PaymentInitiateResult>.Success(
            new PaymentInitiateResult(transactionId, null, false, gatewayHtml));
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
