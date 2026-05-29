using Ecom.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Services;

public class LicenseService(IServiceScopeFactory scopeFactory, ICacheService cache) : ILicenseService
{
    private const string CacheKey = "licenses:all";
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(5);

    public async Task<bool> IsModuleActiveAsync(string module, CancellationToken ct = default)
    {
        var licenses = await GetAllAsync(ct);
        var entry = licenses.FirstOrDefault(l =>
            string.Equals(l.Module, module, StringComparison.OrdinalIgnoreCase));

        // No license record → feature is unrestricted
        if (entry is null) return true;

        return entry.IsActive && entry.ExpiresAt > DateTime.UtcNow;
    }

    public Task InvalidateCacheAsync(CancellationToken ct = default)
        => cache.RemoveAsync(CacheKey, ct);

    private async Task<List<LicenseCacheEntry>> GetAllAsync(CancellationToken ct)
    {
        var cached = await cache.GetAsync<List<LicenseCacheEntry>>(CacheKey, ct);
        if (cached is not null) return cached;

        // Resolve db context from a fresh scope (LicenseService may be singleton-like)
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var entries = await db.Licenses
            .Where(l => !l.IsDeleted)
            .Select(l => new LicenseCacheEntry(l.Module, l.IsActive, l.ExpiresAt))
            .ToListAsync(ct);

        await cache.SetAsync(CacheKey, entries, Ttl, ct);
        return entries;
    }

    private record LicenseCacheEntry(string Module, bool IsActive, DateTime ExpiresAt);
}
