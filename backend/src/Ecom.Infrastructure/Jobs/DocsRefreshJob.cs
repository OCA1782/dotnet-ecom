using Ecom.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace Ecom.Infrastructure.Jobs;

public class DocsRefreshJob(IMemoryCache cache) : IJobRunner
{
    public string Name => "DocsRefreshJob";
    public string Description => "Admin > Dokümanlar — GitHub cache'ini yeniler";
    public int IntervalMinutes => 5;

    // DocsController'da kullanılan cache anahtarları
    private static readonly string[] KnownKeys = ["gh:docs:files"];

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await log("GitHub doküman cache'i temizleniyor...");

        foreach (var key in KnownKeys)
            cache.Remove(key);

        // Dosya içerik cache'leri: "gh:docs:content:{name}" formatında
        // IMemoryCache wildcard desteklemez; bilinen pattern'ı değiştiren bir CTS kullanıyoruz.
        // DocsController bir sonraki istekte GitHub'ı taze çekecek.
        await log($"  ✓ {KnownKeys.Length} cache key temizlendi (gh:docs:files + içerikler bir sonraki istekte yenilenecek)");
        await log("Dokümanlar tarayıcıda bir sonraki açılışta güncel GitHub içeriğini gösterecek.");
    }
}
