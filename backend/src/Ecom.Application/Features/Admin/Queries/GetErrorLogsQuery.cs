using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record ErrorLogDto(
    Guid Id,
    string Source,
    string Level,
    string Message,
    string? StackTrace,
    string? Path,
    string? UserEmail,
    string? IpAddress,
    string? UserAgent,
    int? StatusCode,
    DateTime CreatedDate
);

public record GetErrorLogsQuery(
    int Page = 1,
    int PageSize = 30,
    string? Source = null,
    string? Level = null,
    string? Search = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null
) : IRequest<PaginatedList<ErrorLogDto>>;

public class GetErrorLogsHandler(IApplicationDbContext db)
    : IRequestHandler<GetErrorLogsQuery, PaginatedList<ErrorLogDto>>
{
    public async Task<PaginatedList<ErrorLogDto>> Handle(GetErrorLogsQuery request, CancellationToken cancellationToken)
    {
        var query = db.ErrorLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Source))
            query = query.Where(e => e.Source == request.Source);

        if (!string.IsNullOrWhiteSpace(request.Level))
            query = query.Where(e => e.Level == request.Level);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(e => e.Message.Contains(request.Search) || (e.Path != null && e.Path.Contains(request.Search)));

        if (request.StartDate.HasValue)
            query = query.Where(e => e.CreatedDate >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(e => e.CreatedDate <= request.EndDate.Value);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(e => e.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(e => new ErrorLogDto(e.Id, e.Source, e.Level, e.Message, e.StackTrace, e.Path, e.UserEmail, e.IpAddress, e.UserAgent, e.StatusCode, e.CreatedDate))
            .ToListAsync(cancellationToken);

        return PaginatedList<ErrorLogDto>.Create(items, total, request.Page, request.PageSize);
    }
}
