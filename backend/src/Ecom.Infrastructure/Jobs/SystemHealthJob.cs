using Ecom.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Ecom.Infrastructure.Jobs;

public record SystemHealthSnapshot(
    DateTime CheckedAt,
    string ApiStatus,
    ServiceHealthItem Database,
    ServiceHealthItem Redis,
    ServiceHealthItem RabbitMQ,
    ServiceHealthItem Smtp);

public record ServiceHealthItem(string Status, long LatencyMs, string? Detail);

public class SystemHealthJob(
    HealthCheckService healthCheckService,
    IMemoryCache cache,
    IConfiguration config) : IJobRunner
{
    public string Name => "SystemHealthJob";
    public string Description => "Admin > Sistemler — servis sağlık durumlarını kontrol eder";
    public int IntervalMinutes => 1;

    public const string CacheKey = "jobs:system-health";

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await log("Sağlık kontrolleri çalıştırılıyor...");

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var report = await healthCheckService.CheckHealthAsync(ct);
        sw.Stop();

        ServiceHealthItem GetItem(string name)
        {
            if (report.Entries.TryGetValue(name, out var entry))
                return new ServiceHealthItem(
                    entry.Status.ToString(),
                    (long)entry.Duration.TotalMilliseconds,
                    entry.Description ?? entry.Exception?.Message);
            return new ServiceHealthItem("Unknown", 0, null);
        }

        // SMTP bağlantı testi
        var smtpStatus = await CheckSmtpAsync(ct);

        // Try common DB health check names (SqlServer, database, npgsql, postgres) in order
        var dbItem = new[] { "SqlServer", "database", "npgsql", "postgres", "ef" }
            .Select(GetItem)
            .FirstOrDefault(i => i.Status != "Unknown")
            ?? GetItem("database");

        var snapshot = new SystemHealthSnapshot(
            CheckedAt: DateTime.UtcNow,
            ApiStatus: "Healthy",
            Database: dbItem,
            Redis: GetItem("redis"),
            RabbitMQ: GetItem("rabbitmq"),
            Smtp: smtpStatus);

        cache.Set(CacheKey, snapshot, TimeSpan.FromSeconds(90));

        await log($"  API:       ✓ Healthy");
        await log($"  DB:        {FormatItem(snapshot.Database)}");
        await log($"  Redis:     {FormatItem(snapshot.Redis)}");
        await log($"  RabbitMQ:  {FormatItem(snapshot.RabbitMQ)}");
        await log($"  SMTP:      {FormatItem(snapshot.Smtp)}");
        await log($"  Toplam süre: {sw.ElapsedMilliseconds}ms — Cache güncellendi");
    }

    private static string FormatItem(ServiceHealthItem item) =>
        item.Status == "Healthy" ? $"✓ {item.Status} ({item.LatencyMs}ms)"
        : $"⚠ {item.Status}{(item.Detail != null ? $" — {item.Detail}" : "")}";

    private async Task<ServiceHealthItem> CheckSmtpAsync(CancellationToken ct)
    {
        var host = config["Email:SmtpHost"];
        if (string.IsNullOrEmpty(host) || host == "smtp.example.com")
            return new ServiceHealthItem("NotConfigured", 0, "SMTP yapılandırılmamış");

        var port = int.TryParse(config["Email:SmtpPort"], out var p) ? p : 587;
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            using var tcp = new System.Net.Sockets.TcpClient();
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(5));
            await tcp.ConnectAsync(host, port, cts.Token);
            sw.Stop();
            return new ServiceHealthItem("Healthy", sw.ElapsedMilliseconds, null);
        }
        catch (Exception ex)
        {
            sw.Stop();
            return new ServiceHealthItem("Unhealthy", sw.ElapsedMilliseconds, ex.Message);
        }
    }
}
