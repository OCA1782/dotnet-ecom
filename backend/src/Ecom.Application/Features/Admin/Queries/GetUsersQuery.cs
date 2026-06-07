using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserRoleEnum = Ecom.Domain.Enums.UserRole;

namespace Ecom.Application.Features.Admin.Queries;

public record UserListItemDto(
    Guid Id,
    string Name,
    string Surname,
    string Email,
    string? PhoneNumber,
    string? AvatarUrl,
    bool IsActive,
    bool EmailConfirmed,
    bool PhoneConfirmed,
    DateTime CreatedDate,
    DateTime? LastLoginDate,
    IEnumerable<string> Roles,
    string? DataSource = null,
    string? CreatedByAdminEmail = null
);

public record GetUsersQuery(int Page = 1, int PageSize = 20, string? Search = null, string? SortBy = null) : IRequest<PaginatedList<UserListItemDto>>;

public class GetUsersHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<GetUsersQuery, PaginatedList<UserListItemDto>>
{
    public async Task<PaginatedList<UserListItemDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var query = db.Users.AsQueryable();

        if (!currentUser.IsSuperAdmin && currentUser.UserId.HasValue)
        {
            var adminId = currentUser.UserId.Value;
            query = query.Where(u => u.CreatedByAdminId == adminId || u.Id == adminId);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(u => u.Email.Contains(s) || u.Name.Contains(s) || u.Surname.Contains(s));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var orderedQuery = request.SortBy switch
        {
            "name-asc"         => query.OrderBy(u => u.Name).ThenBy(u => u.Surname),
            "name-desc"        => query.OrderByDescending(u => u.Name).ThenByDescending(u => u.Surname),
            "createdDate-asc"  => query.OrderBy(u => u.CreatedDate),
            "createdDate-desc" => query.OrderByDescending(u => u.CreatedDate),
            "dataSource-asc"   => query.OrderBy(u => u.DataSource),
            "dataSource-desc"  => query.OrderByDescending(u => u.DataSource),
            _                  => query.OrderByDescending(u => u.CreatedDate),
        };

        var users = await orderedQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new
            {
                u.Id, u.Name, u.Surname, u.Email, u.PhoneNumber, u.AvatarUrl, u.IsActive,
                u.EmailConfirmed, u.PhoneConfirmed,
                u.CreatedDate, u.LastLoginDate, u.DataSource, u.CreatedByAdminId
            })
            .ToListAsync(cancellationToken);

        var userIds = users.Select(u => u.Id).ToList();
        var adminIds = users.Where(u => u.CreatedByAdminId.HasValue).Select(u => u.CreatedByAdminId!.Value).Distinct().ToList();
        var roles = await db.UserRoles
            .Where(r => userIds.Contains(r.UserId))
            .ToListAsync(cancellationToken);
        var adminEmails = adminIds.Count > 0
            ? await db.Users.Where(u => adminIds.Contains(u.Id)).Select(u => new { u.Id, u.Email }).ToListAsync(cancellationToken)
            : [];

        var items = users.Select(u => new UserListItemDto(
            u.Id, u.Name, u.Surname, u.Email, u.PhoneNumber, u.AvatarUrl, u.IsActive,
            u.EmailConfirmed, u.PhoneConfirmed,
            u.CreatedDate, u.LastLoginDate,
            roles.Where(r => r.UserId == u.Id).Select(r => r.Role.ToString()),
            u.DataSource,
            u.CreatedByAdminId.HasValue ? adminEmails.FirstOrDefault(a => a.Id == u.CreatedByAdminId.Value)?.Email : null
        ));

        return PaginatedList<UserListItemDto>.Create(items, totalCount, request.Page, request.PageSize);
    }
}
