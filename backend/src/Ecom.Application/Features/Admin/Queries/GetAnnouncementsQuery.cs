using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record AnnouncementDto(
    Guid Id,
    string Title,
    string? Summary,
    string? Content,
    string? MediaUrl,
    string MediaType,
    string Category,
    string? LinkUrl,
    string? LinkText,
    bool IsActive,
    DateTime? StartsAt,
    DateTime? EndsAt,
    int DisplayOrder,
    DateTime CreatedDate,
    DateTime? UpdatedDate,
    string? DataSource = null
);

public record GetAnnouncementsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Category = null,
    bool? IsActive = null,
    string? Search = null,
    bool OnlyActive = false,
    string? SortBy = null
) : IRequest<PaginatedList<AnnouncementDto>>;

public class GetAnnouncementsHandler(IApplicationDbContext db)
    : IRequestHandler<GetAnnouncementsQuery, PaginatedList<AnnouncementDto>>
{
    public async Task<PaginatedList<AnnouncementDto>> Handle(GetAnnouncementsQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var query = db.Announcements.AsQueryable();

        if (request.OnlyActive)
        {
            query = query.Where(a => a.IsActive
                && (a.StartsAt == null || a.StartsAt <= now)
                && (a.EndsAt == null || a.EndsAt >= now));
        }
        else
        {
            if (request.IsActive.HasValue)
                query = query.Where(a => a.IsActive == request.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Category))
            query = query.Where(a => a.Category == request.Category);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(a => a.Title.Contains(request.Search) || (a.Summary != null && a.Summary.Contains(request.Search)));

        var total = await query.CountAsync(ct);
        IQueryable<Ecom.Domain.Entities.Announcement> orderedQuery = request.SortBy switch
        {
            "createdDate-asc"  => query.OrderBy(a => a.CreatedDate),
            "createdDate-desc" => query.OrderByDescending(a => a.CreatedDate),
            "dataSource-asc"   => query.OrderBy(a => a.DataSource),
            "dataSource-desc"  => query.OrderByDescending(a => a.DataSource),
            _                  => query.OrderBy(a => a.DisplayOrder).ThenByDescending(a => a.CreatedDate),
        };
        var items = await orderedQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new AnnouncementDto(
                a.Id, a.Title, a.Summary, a.Content,
                a.MediaUrl, a.MediaType, a.Category,
                a.LinkUrl, a.LinkText, a.IsActive,
                a.StartsAt, a.EndsAt, a.DisplayOrder,
                a.CreatedDate, a.UpdatedDate, a.DataSource))
            .ToListAsync(ct);

        return PaginatedList<AnnouncementDto>.Create(items, total, request.Page, request.PageSize);
    }
}
