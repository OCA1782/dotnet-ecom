using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class TokenCleanupJob(IServiceScopeFactory scopeFactory) : IJobRunner
{
    public string Name => "TokenCleanupJob";
    public string Description => "Süresi dolmuş refresh token kayıtlarını temizler";
    public int IntervalMinutes => 60;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var cutoff = DateTime.UtcNow;
        var deleted = await db.UserRefreshTokens
            .Where(t => t.ExpiresAt < cutoff)
            .ExecuteDeleteAsync(ct);

        await log($"  ✓ {deleted} süresi dolmuş refresh token silindi");
    }
}
