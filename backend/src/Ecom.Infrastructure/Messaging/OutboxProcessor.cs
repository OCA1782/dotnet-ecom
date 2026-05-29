using Ecom.Infrastructure.Persistence;
using Ecom.Infrastructure.Services;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Ecom.Infrastructure.Messaging;

public class OutboxProcessor(
    IServiceScopeFactory scopeFactory,
    IServiceStateManager serviceManager,
    ILogger<OutboxProcessor> logger)
    : BackgroundService
{
    private const string ServiceName = "OutboxProcessor";
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(10);

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        serviceManager.Register(ServiceName, "Outbox mesaj işlemcisi — olayları kuyruğa iletir (10 sn'de bir)");
        return base.StartAsync(cancellationToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            bool triggered = serviceManager.ShouldTrigger(ServiceName);

            if (!serviceManager.IsPaused(ServiceName) || triggered)
            {
                serviceManager.RecordRunStart(ServiceName);
                try
                {
                    var count = await ProcessPendingMessages(stoppingToken);
                    serviceManager.RecordRunEnd(ServiceName, true, $"{count} mesaj işlendi");
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    serviceManager.RecordRunEnd(ServiceName, false, ex.Message[..Math.Min(100, ex.Message.Length)]);
                    logger.LogError(ex, "OutboxProcessor error");
                }
            }

            await Task.Delay(Interval, stoppingToken).ContinueWith(_ => { }, CancellationToken.None);
        }
    }

    private async Task<int> ProcessPendingMessages(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var publishEndpoint = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();

        var messages = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null && m.RetryCount < 5)
            .OrderBy(m => m.CreatedAt)
            .Take(20)
            .ToListAsync(ct);

        foreach (var msg in messages)
        {
            try
            {
                await PublishMessage(publishEndpoint, msg.Type, msg.Payload, ct);
                msg.ProcessedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                msg.RetryCount++;
                msg.Error = ex.Message;
                logger.LogWarning(ex, "Failed to publish outbox message {Id} (attempt {Retry})", msg.Id, msg.RetryCount);
            }
        }

        if (messages.Count > 0)
            await db.SaveChangesAsync(ct);

        return messages.Count;
    }

    private static async Task PublishMessage(IPublishEndpoint endpoint, string typeName, string payload, CancellationToken ct)
    {
        var type = Type.GetType(typeName);
        if (type == null) return;

        var obj = JsonSerializer.Deserialize(payload, type);
        if (obj == null) return;

        await endpoint.Publish(obj, type, ct);
    }
}
