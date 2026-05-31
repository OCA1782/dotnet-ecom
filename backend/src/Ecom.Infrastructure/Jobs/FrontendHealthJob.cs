using Ecom.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace Ecom.Infrastructure.Jobs;

public record FrontendHealthSnapshot(DateTime CheckedAt, FrontendServiceHealth Customer, FrontendServiceHealth Admin);
public record FrontendServiceHealth(string Url, string Status, int? HttpCode, long LatencyMs, string? Error);

public class FrontendHealthJob(IHttpClientFactory httpFactory, IMemoryCache cache, IConfiguration config) : IJobRunner
{
    public string Name => "FrontendHealthJob";
    public string Description => "Next.js Customer ve Admin servislerinin HTTP sağlığını kontrol eder";
    public int IntervalMinutes => 1;

    public const string CacheKey = "jobs:frontend-health";

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await log("Frontend servis sağlık kontrolleri...");

        var apiUrl = config["NEXT_PUBLIC_API_URL"] ?? "http://localhost:5124";
        var baseHost = ExtractHost(apiUrl);
        var customerUrl = $"http://{baseHost}:3000";
        var adminUrl = $"http://{baseHost}:3001";

        var customerTask = CheckAsync(customerUrl, ct);
        var adminTask = CheckAsync(adminUrl, ct);

        await Task.WhenAll(customerTask, adminTask);

        var snapshot = new FrontendHealthSnapshot(DateTime.UtcNow, customerTask.Result, adminTask.Result);
        cache.Set(CacheKey, snapshot, TimeSpan.FromSeconds(90));

        await log($"  Customer ({customerUrl}): {FormatHealth(customerTask.Result)}");
        await log($"  Admin    ({adminUrl}): {FormatHealth(adminTask.Result)}");
    }

    private async Task<FrontendServiceHealth> CheckAsync(string url, CancellationToken ct)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            using var client = httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(5000);
            var resp = await client.GetAsync(url, cts.Token);
            sw.Stop();
            return new FrontendServiceHealth(url, resp.IsSuccessStatusCode ? "Healthy" : "Degraded",
                (int)resp.StatusCode, sw.ElapsedMilliseconds, null);
        }
        catch (Exception ex)
        {
            sw.Stop();
            return new FrontendServiceHealth(url, "Unhealthy", null, sw.ElapsedMilliseconds, ex.Message);
        }
    }

    private static string ExtractHost(string url)
    {
        if (Uri.TryCreate(url, UriKind.Absolute, out var u)) return u.Host;
        return "localhost";
    }

    private static string FormatHealth(FrontendServiceHealth h) =>
        h.Status == "Healthy" ? $"✓ {h.Status} HTTP {h.HttpCode} ({h.LatencyMs}ms)"
        : $"⚠ {h.Status}{(h.Error != null ? $" — {h.Error}" : $" HTTP {h.HttpCode}")}";
}
