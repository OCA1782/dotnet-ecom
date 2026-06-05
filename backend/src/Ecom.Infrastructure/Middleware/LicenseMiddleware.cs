using System.Net;
using System.Text;
using System.Text.Json;
using Ecom.Infrastructure.Security;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Ecom.Infrastructure.Middleware;

// Her HTTP isteğinde lisansı doğrular (RSA: 1 dk cache, online aktivasyon: 5 dk cache).
// Lisans geçersizse veya aktivasyon başarısızsa 503 döner.
// Bu kontrol startup'tan bağımsızdır — startup kodu değiştirilse bile çalışır.
public sealed class LicenseMiddleware(
    RequestDelegate next,
    IConfiguration config,
    IHttpClientFactory httpClientFactory)
{
    // ── RSA doğrulama cache (1 dakika) ────────────────────────────────────
    private static volatile bool   _licValid  = true;
    private static string?         _licError  = null;
    private static DateTime        _licExpiry = DateTime.MinValue;
    private static readonly object _licLock   = new();

    // ── Online aktivasyon cache (5 dakika) ────────────────────────────────
    private static volatile bool   _actValid  = true;
    private static string?         _actError  = null;
    private static DateTime        _actExpiry = DateTime.MinValue;
    private static readonly object _actLock   = new();

    public async Task InvokeAsync(HttpContext ctx)
    {
        if (ctx.Request.Path.StartsWithSegments("/health") ||
            ctx.Request.Path.StartsWithSegments("/openapi"))
        {
            await next(ctx);
            return;
        }

        // 1. RSA imza + tarih + host doğrulama (cache: 1 dk)
        bool licValid;
        string? licError;
        lock (_licLock)
        {
            if (DateTime.UtcNow < _licExpiry)
            {
                licValid = _licValid;
                licError = _licError;
            }
            else
            {
                try
                {
                    var token = config["License"] ?? Environment.GetEnvironmentVariable("ECOM_LICENSE") ?? "";
                    LicenseValidator.Validate(token);
                    _licValid = true; _licError = null;
                }
                catch (Exception ex)
                {
                    _licValid = false; _licError = ex.Message;
                }
                _licExpiry = DateTime.UtcNow.AddMinutes(1);
                licValid = _licValid; licError = _licError;
            }
        }

        if (!licValid)
        {
            ctx.Response.StatusCode = 503;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsync(
                $"{{\"error\":\"Lisans geçersiz: {licError?.Replace("\"", "'")}\"}}");
            return;
        }

        // 2. Online aktivasyon (cache: 5 dk) — LICENSE_ACTIVATION_URL boşsa atlanır
        var activationUrl = config["License:ActivationUrl"]
            ?? Environment.GetEnvironmentVariable("LICENSE_ACTIVATION_URL");

        if (!string.IsNullOrWhiteSpace(activationUrl))
        {
            bool needsRefresh;
            bool actValid;
            string? actError;

            lock (_actLock)
            {
                needsRefresh = DateTime.UtcNow >= _actExpiry;
                actValid     = _actValid;
                actError     = _actError;
            }

            if (needsRefresh)
            {
                var (ok, err) = await CheckActivationAsync(activationUrl);
                lock (_actLock)
                {
                    _actValid  = ok;
                    _actError  = err;
                    _actExpiry = DateTime.UtcNow.AddMinutes(5);
                    actValid   = ok;
                    actError   = err;
                }
            }

            if (!actValid)
            {
                ctx.Response.StatusCode = 503;
                ctx.Response.ContentType = "application/json";
                await ctx.Response.WriteAsync(
                    $"{{\"error\":\"Lisans aktivasyonu reddedildi: {actError?.Replace("\"", "'")}\"}}");
                return;
            }
        }

        await next(ctx);
    }

    private async Task<(bool ok, string? error)> CheckActivationAsync(string activationUrl)
    {
        try
        {
            var token    = config["License"] ?? Environment.GetEnvironmentVariable("ECOM_LICENSE") ?? "";
            var hash     = LicenseValidator.ComputeActivationHash(token);
            var hostname = Dns.GetHostName();

            var body   = JsonSerializer.Serialize(new { hash, hostname });
            var client = httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);

            var response = await client.PostAsync(
                activationUrl,
                new StringContent(body, Encoding.UTF8, "application/json"));

            if (response.IsSuccessStatusCode)
                return (true, null);

            return (false,
                $"Aktivasyon sunucusu HTTP {(int)response.StatusCode} döndürdü. Lisans bu sunucu için yetkili değil.");
        }
        catch (Exception ex)
        {
            // Sunucuya ulaşılamazsa fail-closed: güvenli taraf, uygulama durur.
            return (false, $"Aktivasyon sunucusuna ulaşılamadı: {ex.Message}");
        }
    }
}
