using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record AuditLogDto(
    Guid Id,
    Guid? UserId,
    string UserEmail,
    string Action,
    string EntityName,
    string? EntityId,
    string? IpAddress,
    DateTime CreatedDate
);

public record GetAuditLogsQuery(
    int Page = 1,
    int PageSize = 30,
    string? EntityName = null,
    string? Action = null
) : IRequest<PaginatedList<AuditLogDto>>;

public class GetAuditLogsHandler(IApplicationDbContext db)
    : IRequestHandler<GetAuditLogsQuery, PaginatedList<AuditLogDto>>
{
    public async Task<PaginatedList<AuditLogDto>> Handle(GetAuditLogsQuery request, CancellationToken cancellationToken)
    {
        var query = db.AuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.EntityName))
            query = query.Where(l => l.EntityName.Contains(request.EntityName));

        if (!string.IsNullOrWhiteSpace(request.Action))
            query = query.Where(l => l.Action.Contains(request.Action));

        var total = await query.CountAsync(cancellationToken);

        var logs = await query
            .OrderByDescending(l => l.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(l => new { l.Id, l.UserId, l.Action, l.EntityName, l.EntityId, l.IpAddress, l.CreatedDate })
            .ToListAsync(cancellationToken);

        var userIds = logs.Where(l => l.UserId.HasValue).Select(l => l.UserId!.Value).Distinct().ToList();
        var emails = await db.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Email })
            .ToListAsync(cancellationToken);

        var items = logs.Select(l => new AuditLogDto(
            l.Id, l.UserId,
            l.UserId.HasValue ? (emails.FirstOrDefault(e => e.Id == l.UserId)?.Email ?? "-") : "-",
            l.Action, l.EntityName, l.EntityId, l.IpAddress, l.CreatedDate
        )).ToList();

        return PaginatedList<AuditLogDto>.Create(items, total, request.Page, request.PageSize);
    }
}
