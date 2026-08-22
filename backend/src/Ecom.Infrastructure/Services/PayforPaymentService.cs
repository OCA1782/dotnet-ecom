using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Ecom.Infrastructure.Services;

// QNB Finansbank Payfor — 3DPay entegrasyonu (Default.aspx).
// Kart verileri kendi UI'ımızda alınır; sunucu, kart + merchant parametrelerini
// tek bir server-to-server POST ile QNB'ye iletir (M047: browser IP kısıtlaması aşımı).
// Hash: Base64(SHA1(MbrId + OrderId + PurchAmount + OkUrl + FailUrl + TxnType + InstallmentCount + Rnd + MerchantPass))
public class PayforPaymentService(IApplicationDbContext db, ILogger<PayforPaymentService> logger) : IPaymentService
{
    private const string TestGateway = "https://vpostest.qnbfinansbank.com/Gateway/Default.aspx";
    private const string LiveGateway = "https://vpos.qnb.com.tr/Gateway/Default.aspx";

    public async Task<Result<PaymentInitiateResult>> InitiateAsync(
        PaymentContext context, CancellationToken ct = default)
    {
        var keys = new[]
        {
            "PaymentSanalPosEnabled", "PaymentSanalPosProvider", "PaymentSanalPosTestMode",
            "Payfor_MbrId", "Payfor_MerchantID", "Payfor_UserCode",
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

        // OrgOrderId must be included as empty string per QNB 3DPay specification
        var formFields = new Dictionary<string, string>
        {
            ["MbrId"]            = mbrId,
            ["MerchantID"]       = merchantId!,
            ["UserCode"]         = userCode!,
            ["SecureType"]       = "3DPay",
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

        var sessionId = PayforSessionCache.Store(new QnbFormData(
            gatewayUrl,
            formFields,
            DateTimeOffset.UtcNow.AddMinutes(20)));

        logger.LogInformation("Payfor-initiate: sessionId={SessionId} gateway={Gateway} orderId={OrderId} amount={Amount}",
            sessionId, gatewayUrl, orderId, amount);

        var amountForDisplay = context.Amount.ToString("N2", new System.Globalization.CultureInfo("tr-TR")) + " TL";

        var json = JsonSerializer.Serialize(new
        {
            type      = "payfor_3dhost",
            sessionId,
            amount    = amountForDisplay,
        });

        return Result<PaymentInitiateResult>.Success(
            new PaymentInitiateResult(transactionId, gatewayUrl, false, json));
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
