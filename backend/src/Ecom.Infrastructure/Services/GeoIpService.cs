using Ecom.Application.Common.Interfaces;
using System.Text.Json;

namespace Ecom.Infrastructure.Services;

public class GeoIpService(HttpClient http) : IGeoIpService
{
    private static readonly string[] LOOPBACK = ["::1", "127.0.0.1", "localhost"];

    public async Task<GeoLocation?> LookupAsync(string ip, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(ip) || LOOPBACK.Contains(ip))
            return null;

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
                return new GeoLocation(
                    Country: root.TryGetProperty("country", out var c) ? c.GetString() : null,
                    City: root.TryGetProperty("city", out var ci) ? ci.GetString() : null,
                    Lat: root.TryGetProperty("lat", out var lat) ? lat.GetDouble() : null,
                    Lon: root.TryGetProperty("lon", out var lon) ? lon.GetDouble() : null
                );
            }
        }
        catch { /* geo lookup is best-effort */ }

        return null;
    }
}
