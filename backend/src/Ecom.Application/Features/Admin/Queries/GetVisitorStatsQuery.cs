using Dapper;
using Ecom.Application.Common.Interfaces;
using MediatR;

namespace Ecom.Application.Features.Admin.Queries;

public record GetVisitorStatsQuery(int Days = 30) : IRequest<VisitorStatsDto>;

public record VisitorStatsDto(
    IEnumerable<PageVisitDto> TopPages,
    IEnumerable<CountryVisitDto> CountryBreakdown,
    IEnumerable<DailyVisitDto> DailyVisits
);

public record PageVisitDto(string Page, int Visits);
public record CountryVisitDto(string Country, int Visits);
public record DailyVisitDto(string Day, int Visits);

public class GetVisitorStatsQueryHandler(IDapperQueryService dapper, ICacheService cache)
    : IRequestHandler<GetVisitorStatsQuery, VisitorStatsDto>
{
    public async Task<VisitorStatsDto> Handle(GetVisitorStatsQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"visitor:stats:{request.Days}";
        var cached = await cache.GetAsync<VisitorStatsDto>(cacheKey, cancellationToken);
        if (cached is not null) return cached;

        var since = DateTime.UtcNow.AddDays(-request.Days);
        var param = new DynamicParameters();
        param.Add("Since", since);

        var topPages = await dapper.QueryAsync<PageVisitDto>(
            @"SELECT TOP 20 Page, COUNT(*) AS Visits
              FROM VisitorLogs
              WHERE IsDeleted = 0 AND CreatedDate >= @Since AND Page IS NOT NULL
              GROUP BY Page
              ORDER BY Visits DESC",
            param, cancellationToken);

        var countries = await dapper.QueryAsync<CountryVisitDto>(
            @"SELECT ISNULL(Country, 'Bilinmiyor') AS Country, COUNT(*) AS Visits
              FROM VisitorLogs
              WHERE IsDeleted = 0 AND CreatedDate >= @Since
              GROUP BY ISNULL(Country, 'Bilinmiyor')
              ORDER BY Visits DESC",
            param, cancellationToken);

        var dailyVisits = await dapper.QueryAsync<DailyVisitDto>(
            @"SELECT CONVERT(varchar(10), CreatedDate, 120) AS Day, COUNT(*) AS Visits
              FROM VisitorLogs
              WHERE IsDeleted = 0 AND CreatedDate >= @Since
              GROUP BY CONVERT(varchar(10), CreatedDate, 120)
              ORDER BY Day",
            param, cancellationToken);

        var result = new VisitorStatsDto(topPages, countries, dailyVisits);
        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), cancellationToken);
        return result;
    }
}
