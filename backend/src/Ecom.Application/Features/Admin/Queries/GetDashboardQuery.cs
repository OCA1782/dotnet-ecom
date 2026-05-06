using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserRoleEnum = Ecom.Domain.Enums.UserRole;

namespace Ecom.Application.Features.Admin.Queries;

public record DashboardDto(
    decimal TodaySales,
    int TodayOrderCount,
    int PendingOrderCount,
    int CriticalStockCount,
    decimal MonthSales,
    int MonthOrderCount,
    int TotalCustomerCount,
    IEnumerable<RecentOrderDto> RecentOrders
);

public record RecentOrderDto(
    string OrderNumber,
    decimal GrandTotal,
    OrderStatus Status,
    DateTime CreatedDate
);

public record GetDashboardQuery : IRequest<DashboardDto>;

public class GetDashboardHandler(IApplicationDbContext db) : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    public async Task<DashboardDto> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var todayOrders = await db.Orders
            .Where(o => o.CreatedDate >= todayStart &&
                        o.Status != OrderStatus.Cancelled &&
                        o.Status != OrderStatus.Failed)
            .ToListAsync(cancellationToken);

        var monthOrders = await db.Orders
            .Where(o => o.CreatedDate >= monthStart &&
                        o.Status != OrderStatus.Cancelled &&
                        o.Status != OrderStatus.Failed)
            .ToListAsync(cancellationToken);

        var pendingCount = await db.Orders
            .CountAsync(o => o.Status == OrderStatus.Created ||
                             o.Status == OrderStatus.PaymentPending ||
                             o.Status == OrderStatus.PaymentCompleted ||
                             o.Status == OrderStatus.Preparing, cancellationToken);

        var criticalStockCount = await db.Stocks
            .CountAsync(s => (s.Quantity - s.ReservedQuantity) <= s.CriticalStockLevel, cancellationToken);

        var totalCustomers = await db.UserRoles
            .CountAsync(r => r.Role == UserRoleEnum.Customer, cancellationToken);

        var recentOrders = await db.Orders
            .OrderByDescending(o => o.CreatedDate)
            .Take(10)
            .Select(o => new RecentOrderDto(o.OrderNumber, o.GrandTotal, o.Status, o.CreatedDate))
            .ToListAsync(cancellationToken);

        return new DashboardDto(
            TodaySales: todayOrders.Sum(o => o.GrandTotal),
            TodayOrderCount: todayOrders.Count,
            PendingOrderCount: pendingCount,
            CriticalStockCount: criticalStockCount,
            MonthSales: monthOrders.Sum(o => o.GrandTotal),
            MonthOrderCount: monthOrders.Count,
            TotalCustomerCount: totalCustomers,
            RecentOrders: recentOrders
        );
    }
}
