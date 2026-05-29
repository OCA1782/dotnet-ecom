using Ecom.Infrastructure.Security;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Ecom.Infrastructure.Middleware;

// Her HTTP isteğinde lisansı doğrular (1 dakika cache). Lisans geçersizse 503.
// Bu kontrol startup'tan bağımsızdır — startup kodu değiştirilse bile çalışır.
public sealed class LicenseMiddleware(RequestDelegate next, IConfiguration config)
{
    private static volatile bool   _cachedValid  = true;
    private static string?         _cachedError  = null;
    private static DateTime        _cacheExpiry  = DateTime.MinValue;
    private static readonly object _lock         = new();

    public async Task InvokeAsync(HttpContext ctx)
    {
        if (ctx.Request.Path.StartsWithSegments("/health") ||
            ctx.Request.Path.StartsWithSegments("/openapi"))
        {
            await next(ctx);
            return;
        }

        bool valid;
        string? error;

        lock (_lock)
        {
            if (DateTime.UtcNow < _cacheExpiry)
            {
                valid = _cachedValid;
                error = _cachedError;
            }
            else
            {
                try
                {
                    var token = config["License"] ?? Environment.GetEnvironmentVariable("ECOM_LICENSE") ?? "";
                    LicenseValidator.Validate(token);
                    _cachedValid = true;
                    _cachedError = null;
                }
                catch (Exception ex)
                {
                    _cachedValid = false;
                    _cachedError = ex.Message;
                }
                _cacheExpiry = DateTime.UtcNow.AddMinutes(1);
                valid = _cachedValid;
                error = _cachedError;
            }
        }

        if (!valid)
        {
            ctx.Response.StatusCode = 503;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsync(
                $"{{\"error\":\"Uygulama lisansı geçersiz: {error?.Replace("\"", "'")}\"}}");
            return;
        }

        await next(ctx);
    }
}
