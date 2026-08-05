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
    // /health endpoint: hafif (~2ms), SSR yok, Cloudflare bypass gerekmez
    private const string HealthUrl = "https://api.autoforcepart.com/health";
    private const int IntervalSeconds = 60;
    private const int TimeoutSeconds = 30;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("SiteMonitorService başladı — {Url} her {Interval}s kontrol edilecek", HealthUrl, IntervalSeconds);

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
            using var client = httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(TimeoutSeconds);
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(TimeoutSeconds));
            var resp = await client.GetAsync(HealthUrl, HttpCompletionOption.ResponseHeadersRead, cts.Token);
            sw.Stop();
            httpCode = (int)resp.StatusCode;
            isUp = resp.IsSuccessStatusCode;
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            sw.Stop();
            isUp = false;
            errorMsg = $"Zaman aşımı ({TimeoutSeconds}s)";
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
                Url = HealthUrl,
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
