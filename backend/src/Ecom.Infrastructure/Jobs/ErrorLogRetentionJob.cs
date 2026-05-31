using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class ErrorLogRetentionJob(IServiceScopeFactory scopeFactory, IConfiguration config) : IJobRunner
{
    public string Name => "ErrorLogRetentionJob";
    public string Description => "30 günden eski hata loglarını temizler";
    public int IntervalMinutes => 60;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        var retentionDays = int.TryParse(config["Retention:ErrorLogDays"], out var d) ? d : 30;
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var deleted = await db.ErrorLogs
            .Where(e => e.CreatedDate < cutoff)
            .ExecuteDeleteAsync(ct);

        await log($"  ✓ {deleted} hata logu silindi (>{retentionDays} gün)");
    }
}
