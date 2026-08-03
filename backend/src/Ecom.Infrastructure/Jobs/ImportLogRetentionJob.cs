using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class ImportLogRetentionJob(IServiceScopeFactory scopeFactory, IConfiguration config) : IJobRunner
{
    public string Name => "ImportLogRetentionJob";
    public string Description => "Eski dış kaynak aktarım loglarını temizler";
    public int IntervalMinutes => 1440;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        var retentionDays = int.TryParse(config["Retention:ImportLogDays"], out var d) ? d : 30;
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var deleted = await db.ExternalSourceImportLogs
            .Where(l => l.CreatedDate < cutoff)
            .ExecuteDeleteAsync(ct);

        await log($"  ✓ {deleted} aktarım logu silindi (>{retentionDays} gün)");
    }
}
