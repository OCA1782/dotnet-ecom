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
    bool IsActive,
    bool EmailConfirmed,
    DateTime CreatedDate,
    DateTime? LastLoginDate,
    IEnumerable<string> Roles
);

public record GetUsersQuery(int Page = 1, int PageSize = 20, string? Search = null) : IRequest<PaginatedList<UserListItemDto>>;

public class GetUsersHandler(IApplicationDbContext db) : IRequestHandler<GetUsersQuery, PaginatedList<UserListItemDto>>
{
    public async Task<PaginatedList<UserListItemDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var query = db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(u => u.Email.Contains(s) || u.Name.Contains(s) || u.Surname.Contains(s));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var users = await query
            .OrderByDescending(u => u.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new
            {
                u.Id, u.Name, u.Surname, u.Email, u.IsActive, u.EmailConfirmed,
                u.CreatedDate, u.LastLoginDate
            })
            .ToListAsync(cancellationToken);

        var userIds = users.Select(u => u.Id).ToList();
        var roles = await db.UserRoles
            .Where(r => userIds.Contains(r.UserId))
            .ToListAsync(cancellationToken);

        var items = users.Select(u => new UserListItemDto(
            u.Id, u.Name, u.Surname, u.Email, u.IsActive, u.EmailConfirmed,
            u.CreatedDate, u.LastLoginDate,
            roles.Where(r => r.UserId == u.Id).Select(r => r.Role.ToString())
        ));

        return PaginatedList<UserListItemDto>.Create(items, totalCount, request.Page, request.PageSize);
    }
}
