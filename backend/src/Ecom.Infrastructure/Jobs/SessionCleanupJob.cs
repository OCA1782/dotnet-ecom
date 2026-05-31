using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class SessionCleanupJob(IServiceScopeFactory scopeFactory) : IJobRunner
{
    public string Name => "SessionCleanupJob";
    public string Description => "Süresi dolmuş misafir sepetlerini ve oturum verilerini temizler";
    public int IntervalMinutes => 30;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var now = DateTime.UtcNow;

        // Expired guest carts (have ExpiresAt set and it has passed)
        var expiredCarts = await db.Carts
            .Where(c => c.ExpiresAt != null && c.ExpiresAt < now)
            .ToListAsync(ct);

        if (expiredCarts.Count == 0)
        {
            await log("  ✓ Süresi dolmuş misafir sepeti yok");
            return;
        }

        var cartIds = expiredCarts.Select(c => c.Id).ToHashSet();

        var itemsDeleted = await db.CartItems
            .Where(ci => cartIds.Contains(ci.CartId))
            .ExecuteDeleteAsync(ct);

        foreach (var cart in expiredCarts)
            db.Carts.Remove(cart);

        await db.SaveChangesAsync(ct);

        await log($"  ✓ {expiredCarts.Count} süresi dolmuş sepet temizlendi ({itemsDeleted} ürün)");
    }
}
