using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record GetSettingsQuery : IRequest<Dictionary<string, string>>;

public class GetSettingsHandler(IApplicationDbContext db, ICacheService cache)
    : IRequestHandler<GetSettingsQuery, Dictionary<string, string>>
{
    private const string CacheKey = "settings:v1:all";
    private static readonly TimeSpan SettingsTtl = TimeSpan.FromSeconds(30);

    public async Task<Dictionary<string, string>> Handle(GetSettingsQuery request, CancellationToken cancellationToken)
    {
        var cached = await cache.GetAsync<Dictionary<string, string>>(CacheKey, cancellationToken);
        if (cached is not null) return cached;

        var result = await db.SiteSettings
            .ToDictionaryAsync(s => s.Key, s => s.Value, cancellationToken);
        await cache.SetAsync(CacheKey, result, SettingsTtl, cancellationToken);
        return result;
    }
}
