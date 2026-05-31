using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class OutboxRetryJob(IServiceScopeFactory scopeFactory) : IJobRunner
{
    public string Name => "OutboxRetryJob";
    public string Description => "Başarısız outbox mesajlarını yeniden kuyruğa alır";
    public int IntervalMinutes => 2;

    private const int MaxRetries = 5;
    private const int StuckAfterMinutes = 10;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var stuckCutoff = DateTime.UtcNow.AddMinutes(-StuckAfterMinutes);

        // Find messages that have an error and haven't exceeded max retries
        var failed = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null && m.Error != null && m.RetryCount < MaxRetries)
            .ToListAsync(ct);

        // Find messages stuck in processing (no error, no ProcessedAt, old)
        var stuck = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null && m.Error == null && m.CreatedAt < stuckCutoff)
            .ToListAsync(ct);

        var total = failed.Count + stuck.Count;
        if (total == 0)
        {
            await log("  ✓ Bekleyen/başarısız outbox mesajı yok");
            return;
        }

        foreach (var msg in failed)
        {
            msg.Error = null;
            msg.RetryCount++;
        }
        foreach (var msg in stuck)
            msg.Error = null;

        await db.SaveChangesAsync(ct);

        await log($"  ✓ {failed.Count} hatalı + {stuck.Count} takılı mesaj yeniden denemeye alındı");
    }
}
