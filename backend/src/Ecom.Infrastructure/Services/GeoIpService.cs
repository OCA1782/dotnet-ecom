using Ecom.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace Ecom.Infrastructure.Services;

public class GeoIpService(HttpClient http, IMemoryCache cache) : IGeoIpService
{
    private static readonly string[] LOOPBACK = ["::1", "127.0.0.1", "localhost"];

    public async Task<GeoLocation?> LookupAsync(string ip, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(ip) || LOOPBACK.Contains(ip))
            return null;

        var cacheKey = $"geo:{ip}";
        if (cache.TryGetValue(cacheKey, out GeoLocation? cached))
            return cached;

        GeoLocation? result = null;
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(3));

            var url = $"http://ip-api.com/json/{Uri.EscapeDataString(ip)}?fields=status,country,city,lat,lon";
            var json = await http.GetStringAsync(url, cts.Token);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.TryGetProperty("status", out var status) && status.GetString() == "success")
            {
                result = new GeoLocation(
                    Country: root.TryGetProperty("country", out var c) ? c.GetString() : null,
                    City: root.TryGetProperty("city", out var ci) ? ci.GetString() : null,
                    Lat: root.TryGetProperty("lat", out var lat) ? lat.GetDouble() : null,
                    Lon: root.TryGetProperty("lon", out var lon) ? lon.GetDouble() : null
                );
            }
        }
        catch { /* geo lookup is best-effort */ }

        // Cache result (including null) for 30 min — stays within ip-api.com free tier
        cache.Set(cacheKey, result, TimeSpan.FromMinutes(30));
        return result;
    }
}
