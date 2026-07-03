using Ecom.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using System.Collections.Concurrent;
using System.Text.Json;

namespace Ecom.Infrastructure.Services;

public class CacheService(IDistributedCache cache) : ICacheService
{
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(5);
    // Static: tüm scoped instance'lar aynı key kaydını paylaşır; uygulama restart'ında
    // in-memory cache de sıfırlanır, dolayısıyla senkron kalır.
    private static readonly ConcurrentDictionary<string, bool> s_keys = new();

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default) where T : class
    {
        var bytes = await cache.GetAsync(key, ct);
        if (bytes is null) return null;
        return JsonSerializer.Deserialize<T>(bytes);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null, CancellationToken ct = default) where T : class
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(value);
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl ?? DefaultTtl
        };
        await cache.SetAsync(key, bytes, options, ct);
        s_keys.TryAdd(key, true);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        await cache.RemoveAsync(key, ct);
        s_keys.TryRemove(key, out _);
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        var keys = s_keys.Keys
            .Where(k => k.StartsWith(prefix, StringComparison.Ordinal))
            .ToList();
        foreach (var key in keys)
            await RemoveAsync(key, ct);
    }
}
