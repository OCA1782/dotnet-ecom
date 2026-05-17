using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record ErrorLogStatsDto(
    int TotalError,
    int TotalWarning,
    int TotalInfo,
    List<DayStatDto> ByDay,
    List<TypeStatDto> ByExceptionType,
    List<SourceStatDto> BySource,
    List<CategoryStatDto> ByCategory
);

public record DayStatDto(string Date, int Error, int Warning, int Info);
public record TypeStatDto(string ExceptionType, int Count);
public record SourceStatDto(string Source, int Error, int Warning, int Info);
public record CategoryStatDto(string Category, int Count);

public record GetErrorLogStatsQuery(int Days = 7) : IRequest<ErrorLogStatsDto>;

public class GetErrorLogStatsHandler(IApplicationDbContext db)
    : IRequestHandler<GetErrorLogStatsQuery, ErrorLogStatsDto>
{
    public async Task<ErrorLogStatsDto> Handle(GetErrorLogStatsQuery request, CancellationToken cancellationToken)
    {
        var since = DateTime.UtcNow.Date.AddDays(-request.Days + 1);

        var all = await db.ErrorLogs
            .Where(e => e.CreatedDate >= since)
            .Select(e => new { e.Level, e.ExceptionType, e.Source, Date = e.CreatedDate.Date })
            .ToListAsync(cancellationToken);

        var totalError = all.Count(e => e.Level == "Error");
        var totalWarning = all.Count(e => e.Level == "Warning");
        var totalInfo = all.Count(e => e.Level != "Error" && e.Level != "Warning");

        var byDay = Enumerable.Range(0, request.Days)
            .Select(i => since.AddDays(i))
            .Select(d => new DayStatDto(
                d.ToString("dd.MM"),
                all.Count(e => e.Date == d && e.Level == "Error"),
                all.Count(e => e.Date == d && e.Level == "Warning"),
                all.Count(e => e.Date == d && e.Level != "Error" && e.Level != "Warning")
            )).ToList();

        var byType = all
            .Where(e => e.ExceptionType != null)
            .GroupBy(e => e.ExceptionType!)
            .Select(g => new TypeStatDto(g.Key, g.Count()))
            .OrderByDescending(t => t.Count)
            .Take(8)
            .ToList();

        var bySource = new[] { "Backend", "Frontend" }
            .Select(s => new SourceStatDto(
                s,
                all.Count(e => e.Source == s && e.Level == "Error"),
                all.Count(e => e.Source == s && e.Level == "Warning"),
                all.Count(e => e.Source == s && e.Level != "Error" && e.Level != "Warning")
            ))
            .Where(s => s.Error + s.Warning + s.Info > 0)
            .ToList();

        var byCategory = all
            .Where(e => !string.IsNullOrEmpty(e.ExceptionType))
            .GroupBy(e => ExceptionCategory(e.ExceptionType))
            .Select(g => new CategoryStatDto(g.Key, g.Count()))
            .OrderByDescending(c => c.Count)
            .ToList();

        return new ErrorLogStatsDto(totalError, totalWarning, totalInfo, byDay, byType, bySource, byCategory);
    }

    private static string ExceptionCategory(string? exType)
    {
        if (string.IsNullOrEmpty(exType)) return "Diğer";
        var t = exType.ToLower();
        if (t.Contains("dbupdateexception") || t.Contains("sqlexception") || t.Contains("dbexception") || t.Contains("entityexception")) return "Veritabanı";
        if (t.Contains("httprequestexception") || t.Contains("socketexception") || t.Contains("webexception")) return "HTTP / Ağ";
        if (t.Contains("timeoutexception")) return "Zaman Aşımı";
        if (t.Contains("unauthorizedaccessexception")) return "Yetki";
        if (t.Contains("filenotfoundexception") || t.Contains("directorynotfound") || t.Contains("ioexception")) return "Dosya";
        if (t.Contains("argumentexception") || t.Contains("invalidoperationexception") || t.Contains("nullreferenceexception")) return "Uygulama";
        if (t.Contains("validationexception")) return "Doğrulama";
        return "Diğer";
    }
}
