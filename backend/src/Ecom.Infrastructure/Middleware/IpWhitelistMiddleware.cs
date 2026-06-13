using System.Net;
using Ecom.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Ecom.Infrastructure.Middleware;

// Yalnızca /api/admin/* isteklerine uygulanır.
// Security:IpWhitelistEnabled = "true" iken izin listesinde olmayan IP → 403.
// Ayarlar DB'den okunur ve 60 saniye önbelleğe alınır.
// Loopback adresler (127.0.0.1, ::1) her zaman izin verilir.
public sealed class IpWhitelistMiddleware(
    RequestDelegate next,
    IMemoryCache cache,
    IServiceScopeFactory scopeFactory,
    ILogger<IpWhitelistMiddleware> logger)
{
    private const string CacheKey = "security:ip-whitelist";

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api/admin"))
        {
            await next(context);
            return;
        }

        var (enabled, allowedIps) = await GetWhitelistAsync();

        if (!enabled)
        {
            await next(context);
            return;
        }

        var remoteIp = context.Connection.RemoteIpAddress;
        var ipStr    = remoteIp?.ToString() ?? "";

        // Always allow loopback
        if (remoteIp != null && IPAddress.IsLoopback(remoteIp))
        {
            await next(context);
            return;
        }

        if (!allowedIps.Contains(ipStr))
        {
            logger.LogWarning("[SECURITY] IP whitelist blocked {Ip} → {Path}", ipStr, context.Request.Path);
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "IP adresiniz bu sunucuya erişim yetkisine sahip değil.",
                ip = ipStr,
            });
            return;
        }

        await next(context);
    }

    private async Task<(bool Enabled, HashSet<string> AllowedIps)> GetWhitelistAsync()
    {
        if (cache.TryGetValue(CacheKey, out (bool, HashSet<string>) cached))
            return cached;

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var keys = new[] { "Security:IpWhitelistEnabled", "Security:IpWhitelist" };
        var settings = await db.SiteSettings
            .Where(s => keys.Contains(s.Key))
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        var enabled = settings.TryGetValue("Security:IpWhitelistEnabled", out var e) && e == "true";
        var ipList  = settings.TryGetValue("Security:IpWhitelist", out var ips) ? ips : "";

        var allowedIps = ipList
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet();

        var result = (enabled, allowedIps);
        cache.Set(CacheKey, result, TimeSpan.FromSeconds(60));
        return result;
    }
}
