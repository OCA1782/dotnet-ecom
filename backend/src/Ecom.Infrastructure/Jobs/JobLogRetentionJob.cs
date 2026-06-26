using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class JobLogRetentionJob(IServiceScopeFactory scopeFactory, IConfiguration config) : IJobRunner
{
    public string Name => "JobLogRetentionJob";
    public string Description => "7 günden eski job loglarını temizler";
    public int IntervalMinutes => 60;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        var retentionDays = int.TryParse(config["Retention:JobLogDays"], out var d) ? d : 7;
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var deleted = await db.JobLogs
            .Where(j => j.StartedAt < cutoff)
            .ExecuteDeleteAsync(ct);

        await log($"  ✓ {deleted} job logu silindi (>{retentionDays} gün)");
    }
}
