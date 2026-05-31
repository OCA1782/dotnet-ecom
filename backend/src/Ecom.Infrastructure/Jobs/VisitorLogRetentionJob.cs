using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class VisitorLogRetentionJob(IServiceScopeFactory scopeFactory, IConfiguration config) : IJobRunner
{
    public string Name => "VisitorLogRetentionJob";
    public string Description => "Eski ziyaretçi log kayıtlarını temizler";
    public int IntervalMinutes => 60;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        var retentionDays = int.TryParse(config["Retention:VisitorLogDays"], out var d) ? d : 30;
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var deleted = await db.VisitorLogs
            .Where(v => v.CreatedDate < cutoff)
            .ExecuteDeleteAsync(ct);

        await log($"  ✓ {deleted} ziyaretçi logu silindi (>{retentionDays} gün)");
    }
}
