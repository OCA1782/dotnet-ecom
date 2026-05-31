using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class AuditLogRetentionJob(IServiceScopeFactory scopeFactory, IConfiguration config) : IJobRunner
{
    public string Name => "AuditLogRetentionJob";
    public string Description => "90 günden eski denetim loglarını temizler";
    public int IntervalMinutes => 60;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        var retentionDays = int.TryParse(config["Retention:AuditLogDays"], out var d) ? d : 90;
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var deleted = await db.AuditLogs
            .Where(a => a.CreatedDate < cutoff)
            .ExecuteDeleteAsync(ct);

        await log($"  ✓ {deleted} denetim logu silindi (>{retentionDays} gün)");
    }
}
