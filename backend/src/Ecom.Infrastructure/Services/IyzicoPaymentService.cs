using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Ecom.Infrastructure.Services;

public class IyzicoPaymentService : IPaymentService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _secretKey;
    private readonly string _baseUrl;

    private static readonly JsonSerializerOptions _json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public IyzicoPaymentService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Iyzico:ApiKey"] ?? throw new InvalidOperationException("Iyzico:ApiKey not configured");
        _secretKey = config["Iyzico:SecretKey"] ?? throw new InvalidOperationException("Iyzico:SecretKey not configured");
        _baseUrl = config["Iyzico:BaseUrl"] ?? "https://sandbox-api.iyzipay.com";
    }

    public async Task<Result<PaymentInitiateResult>> InitiateAsync(
        PaymentContext context, CancellationToken ct = default)
    {
        var callbackUrl = context.CallbackUrl
            ?? throw new InvalidOperationException("CallbackUrl is required for Iyzico payments");

        var request = new
        {
            locale = "tr",
            conversationId = context.IdempotencyKey,
            price = context.Amount.ToString("F2"),
            paidPrice = context.Amount.ToString("F2"),
            currency = context.Currency,
            basketId = context.OrderNumber,
            paymentGroup = "PRODUCT",
            callbackUrl,
            enabledInstallments = new[] { 1, 2, 3, 6, 9, 12 },
            buyer = new
            {
                id = context.OrderId.ToString(),
                name = context.BuyerName,
                surname = context.BuyerSurname,
                gsmNumber = context.BuyerPhone ?? "+905000000000",
                email = context.BuyerEmail,
                identityNumber = "11111111111",
                ip = context.BuyerIp ?? "85.34.78.112",
                registrationAddress = "Türkiye",
                city = "Istanbul",
                country = "Turkey",
            },
            shippingAddress = new
            {
                contactName = $"{context.BuyerName} {context.BuyerSurname}",
                city = "Istanbul",
                country = "Turkey",
                address = "Türkiye"
            },
            billingAddress = new
            {
                contactName = $"{context.BuyerName} {context.BuyerSurname}",
                city = "Istanbul",
                country = "Turkey",
                address = "Türkiye"
            },
            basketItems = context.BasketItems.Select(i => new
            {
                id = i.Id,
                name = i.Name.Length > 50 ? i.Name[..50] : i.Name,
                category1 = "Ürün",
                itemType = "PHYSICAL",
                price = (i.Price * i.Quantity).ToString("F2")
            }).ToArray()
        };

        var body = JsonSerializer.Serialize(request, _json);
        var response = await SendAsync("POST", "/payment/iyzipos/initialize", body, ct);

        var json = JsonNode.Parse(response);
        var status = json?["status"]?.GetValue<string>();

        if (status != "success")
        {
            var errMsg = json?["errorMessage"]?.GetValue<string>() ?? "İyzico ödeme başlatılamadı.";
            return Result<PaymentInitiateResult>.Failure(errMsg);
        }

        var token = json?["token"]?.GetValue<string>() ?? context.IdempotencyKey;
        var pageUrl = json?["paymentPageUrl"]?.GetValue<string>();
        var formContent = json?["checkoutFormContent"]?.GetValue<string>();

        return Result<PaymentInitiateResult>.Success(
            new PaymentInitiateResult(token, pageUrl, true, formContent));
    }

    public async Task<Result<bool>> VerifyCallbackAsync(
        string transactionId, string providerPayload, CancellationToken ct = default)
    {
        // providerPayload = the İyzico token from callback POST
        var request = new
        {
            locale = "tr",
            conversationId = transactionId,
            token = providerPayload
        };

        var body = JsonSerializer.Serialize(request, _json);
        var response = await SendAsync("POST", "/payment/iyzipos/detail", body, ct);

        var json = JsonNode.Parse(response);
        var status = json?["status"]?.GetValue<string>();
        var paymentStatus = json?["paymentStatus"]?.GetValue<string>();

        var isSuccess = status == "success" && paymentStatus == "SUCCESS";
        return Result<bool>.Success(isSuccess);
    }

    // ── HTTP + Auth ───────────────────────────────────────────────────────────

    private async Task<string> SendAsync(string method, string path, string body, CancellationToken ct)
    {
        var randomString = DateTime.UtcNow.ToString("ddMMyyyyHHmmssfff");
        var pkiString = BuildPki(JsonNode.Parse(body)!);
        var authHeader = BuildAuthHeader(randomString, pkiString);

        var request = new HttpRequestMessage(new HttpMethod(method), _baseUrl + path)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
        request.Headers.TryAddWithoutValidation("Authorization", authHeader);
        request.Headers.TryAddWithoutValidation("x-iyzi-rnd", randomString);
        request.Headers.TryAddWithoutValidation("x-iyzi-client-version", "ecom/1.0");

        var response = await _http.SendAsync(request, ct);
        return await response.Content.ReadAsStringAsync(ct);
    }

    private string BuildAuthHeader(string randomString, string pkiString)
    {
        var data = _apiKey + randomString + pkiString;
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(data));
        return $"IYZWS {_apiKey}:{Convert.ToBase64String(hash)}";
    }

    private static string BuildPki(JsonNode node)
    {
        if (node is JsonObject obj)
        {
            var sb = new StringBuilder();
            foreach (var (key, value) in obj)
            {
                if (value is null) continue;
                sb.Append('[').Append(key).Append(',').Append(BuildPki(value)).Append(']');
            }
            return sb.ToString();
        }

        if (node is JsonArray arr)
        {
            var sb = new StringBuilder();
            foreach (var item in arr)
            {
                if (item is null) continue;
                sb.Append('[').Append(BuildPki(item)).Append(']');
            }
            return sb.ToString();
        }

        return node.GetValue<string?>() ?? string.Empty;
    }
}
