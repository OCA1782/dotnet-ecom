using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Ecom.Infrastructure.Jobs;

public class SiteMonitorService(
    ISiteMonitorHub hub,
    IHttpClientFactory httpFactory,
    IServiceScopeFactory scopeFactory,
    ILogger<SiteMonitorService> logger) : BackgroundService
{
    private const string TargetBaseUrl = "https://www.autoforcepart.com/";
    private const int IntervalSeconds = 25;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("SiteMonitorService başladı — {Url} her {Interval}s kontrol edilecek", TargetBaseUrl, IntervalSeconds);

        // Başlangıç gecikmesi: diğer servisler hazırlanırken bekle
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await CheckAsync(stoppingToken);
            try { await Task.Delay(TimeSpan.FromSeconds(IntervalSeconds), stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task CheckAsync(CancellationToken ct)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        bool isUp;
        int? httpCode = null;
        string? errorMsg = null;

        try
        {
            // Timestamp query param → Cloudflare cache miss every time (origin'e ulaşmak zorunda kalır)
            var url = $"{TargetBaseUrl}?_t={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.CacheControl = new System.Net.Http.Headers.CacheControlHeaderValue { NoCache = true, NoStore = true };
            req.Headers.Add("Pragma", "no-cache");

            using var client = httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(10));
            var resp = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, cts.Token);
            sw.Stop();
            httpCode = (int)resp.StatusCode;
            isUp = resp.IsSuccessStatusCode;

            // CF-Cache-Status: HIT/STALE → Cloudflare önbellekten yanıt verdi, origin'e ulaşılamadı.
            // Bu durumda site aslında erişilemez olabilir; isUp=false olarak işaretle.
            if (resp.Headers.TryGetValues("CF-Cache-Status", out var cfVals))
            {
                var cfStatus = string.Join(",", cfVals);
                if (cfStatus is "HIT" or "STALE")
                {
                    isUp = false;
                    errorMsg = $"⚠ Cloudflare önbellekten yanıt: CF-Cache-Status={cfStatus}. Origin sunucuya ulaşılamadı — site ziyaretçiler için erişilemez olabilir.";
                    logger.LogWarning("SiteMonitor: Cloudflare cache hit ({Status}) — origin doğrulanamadı. URL: {Url}", cfStatus, url);
                }
            }
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            sw.Stop();
            isUp = false;
            errorMsg = "Zaman aşımı (10s)";
        }
        catch (Exception ex)
        {
            sw.Stop();
            isUp = false;
            errorMsg = ex.Message;
        }

        var evt = new SiteMonitorEvent(DateTime.UtcNow, isUp, httpCode, sw.ElapsedMilliseconds, errorMsg);
        hub.Broadcast(evt);

        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            db.SiteUptimeLogs.Add(new SiteUptimeLog
            {
                Url = TargetBaseUrl,
                IsUp = isUp,
                HttpStatusCode = httpCode,
                ResponseTimeMs = sw.ElapsedMilliseconds,
                ErrorMessage = errorMsg,
                CheckedAt = evt.CheckedAt,
            });
            await db.SaveChangesAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "SiteUptimeLog kaydedilemedi");
        }
    }
}
