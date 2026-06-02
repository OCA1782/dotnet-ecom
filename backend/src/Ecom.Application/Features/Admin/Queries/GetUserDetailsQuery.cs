using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserRoleEnum = Ecom.Domain.Enums.UserRole;

namespace Ecom.Application.Features.Admin.Queries;

public record AdminUserDetailsDto(
    Guid Id,
    string Name,
    string Surname,
    string Email,
    string? PhoneNumber,
    string? AvatarUrl,
    bool IsActive,
    bool EmailConfirmed,
    int FailedLoginCount,
    DateTime? LockoutUntil,
    DateTime CreatedDate,
    DateTime? LastLoginDate,
    bool CommercialConsent,
    IEnumerable<string> Roles,
    IEnumerable<AdminUserAddressDto> Addresses,
    IEnumerable<AdminUserOrderDto> RecentOrders,
    int TotalOrderCount,
    decimal TotalSpent
);

public record AdminUserAddressDto(
    Guid Id,
    string AddressTitle,
    string City,
    string District,
    string FullAddress,
    bool IsDefaultShipping,
    bool IsDefaultBilling
);

public record AdminUserOrderDto(
    Guid Id,
    string OrderNumber,
    decimal GrandTotal,
    string Status,
    string PaymentStatus,
    DateTime CreatedDate
);

public record GetUserDetailsQuery(Guid UserId) : IRequest<AdminUserDetailsDto?>;

public class GetUserDetailsHandler(IApplicationDbContext db)
    : IRequestHandler<GetUserDetailsQuery, AdminUserDetailsDto?>
{
    public async Task<AdminUserDetailsDto?> Handle(GetUserDetailsQuery request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .IgnoreQueryFilters()
            .Where(u => u.Id == request.UserId)
            .Select(u => new
            {
                u.Id, u.Name, u.Surname, u.Email, u.PhoneNumber, u.AvatarUrl,
                u.IsActive, u.EmailConfirmed, u.FailedLoginCount, u.LockoutUntil,
                u.CreatedDate, u.LastLoginDate, u.CommercialConsent
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null) return null;

        var roles = await db.UserRoles
            .Where(r => r.UserId == request.UserId)
            .Select(r => r.Role.ToString())
            .ToListAsync(cancellationToken);

        var addresses = await db.UserAddresses
            .Where(a => a.UserId == request.UserId && !a.IsDeleted)
            .Select(a => new AdminUserAddressDto(
                a.Id, a.AddressTitle, a.City, a.District, a.FullAddress,
                a.IsDefaultShipping, a.IsDefaultBilling))
            .ToListAsync(cancellationToken);

        var orders = await db.Orders
            .Where(o => o.UserId == request.UserId)
            .OrderByDescending(o => o.CreatedDate)
            .Take(10)
            .Select(o => new AdminUserOrderDto(
                o.Id, o.OrderNumber, o.GrandTotal,
                o.Status.ToString(), o.PaymentStatus.ToString(), o.CreatedDate))
            .ToListAsync(cancellationToken);

        var stats = await db.Orders
            .Where(o => o.UserId == request.UserId)
            .GroupBy(_ => 1)
            .Select(g => new { Count = g.Count(), Total = g.Sum(o => o.GrandTotal) })
            .FirstOrDefaultAsync(cancellationToken);

        return new AdminUserDetailsDto(
            user.Id, user.Name, user.Surname, user.Email, user.PhoneNumber, user.AvatarUrl,
            user.IsActive, user.EmailConfirmed, user.FailedLoginCount, user.LockoutUntil,
            user.CreatedDate, user.LastLoginDate, user.CommercialConsent,
            roles, addresses, orders,
            stats?.Count ?? 0, stats?.Total ?? 0m
        );
    }
}
