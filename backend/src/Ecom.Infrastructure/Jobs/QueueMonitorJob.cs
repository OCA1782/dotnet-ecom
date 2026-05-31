using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public record QueueStats(
    DateTime CheckedAt,
    int OutboxPending,
    int OutboxFailed,
    int OutboxProcessedToday,
    Dictionary<string, int> SagaByState,
    int TotalSaga,
    RabbitQueueInfo? RabbitMQ);

public record RabbitQueueInfo(bool Available, string? Error, List<RabbitQueue> Queues);
public record RabbitQueue(string Name, int Messages, int Consumers);

public class QueueMonitorJob(
    IServiceScopeFactory scopeFactory,
    IMemoryCache cache,
    IConfiguration config,
    IHttpClientFactory httpFactory) : IJobRunner
{
    public string Name => "QueueMonitorJob";
    public string Description => "Admin > Kuyruklar — Outbox, Saga ve RabbitMQ istatistiklerini izler";
    public int IntervalMinutes => 1;

    public const string CacheKey = "jobs:queue-stats";

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await log("Kuyruk istatistikleri sorgulanıyor...");

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var now = DateTime.UtcNow;
        var todayStart = now.Date;

        var outboxPending = await db.OutboxMessages
            .CountAsync(m => m.ProcessedAt == null && m.RetryCount < 5, ct);
        var outboxFailed = await db.OutboxMessages
            .CountAsync(m => m.ProcessedAt == null && m.RetryCount >= 5, ct);
        var outboxProcessedToday = await db.OutboxMessages
            .CountAsync(m => m.ProcessedAt != null && m.ProcessedAt >= todayStart, ct);

        await log($"  Outbox — Bekleyen: {outboxPending}, Başarısız: {outboxFailed}, Bugün işlenen: {outboxProcessedToday}");

        // Saga states
        var sagaStates = new Dictionary<string, int>();
        try
        {
            if (db is Microsoft.EntityFrameworkCore.DbContext efDb)
            {
                var states = await efDb.Set<Ecom.Infrastructure.Messaging.Sagas.OrderSagaState>()
                    .GroupBy(s => s.CurrentState)
                    .Select(g => new { State = g.Key, Count = g.Count() })
                    .ToListAsync(ct);
                foreach (var s in states) sagaStates[s.State ?? "Unknown"] = s.Count;
                await log($"  Saga — {sagaStates.Count} farklı durum, toplam {sagaStates.Values.Sum()} kayıt");
            }
        }
        catch { await log("  Saga — erişilemedi (migration bekliyor olabilir)"); }

        // RabbitMQ Management API
        var rabbitInfo = await CheckRabbitMqAsync(ct);
        if (rabbitInfo.Available)
            await log($"  RabbitMQ — {rabbitInfo.Queues.Count} kuyruk aktif");
        else
            await log($"  RabbitMQ — {rabbitInfo.Error}");

        var stats = new QueueStats(
            CheckedAt: now,
            OutboxPending: outboxPending,
            OutboxFailed: outboxFailed,
            OutboxProcessedToday: outboxProcessedToday,
            SagaByState: sagaStates,
            TotalSaga: sagaStates.Values.Sum(),
            RabbitMQ: rabbitInfo);

        cache.Set(CacheKey, stats, TimeSpan.FromSeconds(90));
        await log("  Cache güncellendi");
    }

    private async Task<RabbitQueueInfo> CheckRabbitMqAsync(CancellationToken ct)
    {
        var host = config["RabbitMQ:Host"];
        if (string.IsNullOrEmpty(host)) return new RabbitQueueInfo(false, "RabbitMQ yapılandırılmamış", []);

        try
        {
            var user = config["RabbitMQ:Username"] ?? "guest";
            var pass = config["RabbitMQ:Password"] ?? "guest";
            var mgmtUrl = $"http://{host}:15672/api/queues";

            using var client = httpFactory.CreateClient();
            var byteArray = System.Text.Encoding.ASCII.GetBytes($"{user}:{pass}");
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Basic",
                    Convert.ToBase64String(byteArray));
            client.Timeout = TimeSpan.FromSeconds(5);

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(5000);
            var resp = await client.GetAsync(mgmtUrl, cts.Token);
            if (!resp.IsSuccessStatusCode)
                return new RabbitQueueInfo(false, $"HTTP {(int)resp.StatusCode}", []);

            var json = await resp.Content.ReadAsStringAsync(cts.Token);
            var queues = System.Text.Json.JsonSerializer.Deserialize<List<RabbitMqQueueDto>>(json,
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];

            return new RabbitQueueInfo(true, null,
                queues.Select(q => new RabbitQueue(q.Name, q.Messages, q.Consumers)).ToList());
        }
        catch (Exception ex)
        {
            return new RabbitQueueInfo(false, ex.Message, []);
        }
    }

    private sealed class RabbitMqQueueDto
    {
        public string Name { get; set; } = "";
        public int Messages { get; set; }
        public int Consumers { get; set; }
    }
}
