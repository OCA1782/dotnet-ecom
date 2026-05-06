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
    int NewCustomerCount,
    IEnumerable<MonthlySummaryDto> MonthlySummary,
    IEnumerable<WeeklyOrderDto> WeeklyOrders,
    IEnumerable<OrderStatusCountDto> OrderStatusBreakdown,
    IEnumerable<RecentOrderDto> RecentOrders
);

public record MonthlySummaryDto(string Month, decimal Revenue, int OrderCount);
public record WeeklyOrderDto(string Day, string Label, int OrderCount, decimal Revenue);
public record OrderStatusCountDto(int Status, string Label, int Count);
public record RecentOrderDto(string Id, string OrderNumber, string CustomerName, decimal GrandTotal, int Status, DateTime CreatedDate);

public record GetDashboardQuery : IRequest<DashboardDto>;

public class GetDashboardHandler(IApplicationDbContext db) : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    private static readonly string[] DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

    private static readonly Dictionary<OrderStatus, string> STATUS_LABELS = new()
    {
        [OrderStatus.Created] = "Oluşturuldu",
        [OrderStatus.PaymentPending] = "Ödeme Bekliyor",
        [OrderStatus.PaymentCompleted] = "Ödendi",
        [OrderStatus.Preparing] = "Hazırlanıyor",
        [OrderStatus.Shipped] = "Kargoda",
        [OrderStatus.Delivered] = "Teslim Edildi",
        [OrderStatus.Completed] = "Tamamlandı",
        [OrderStatus.Cancelled] = "İptal",
        [OrderStatus.Failed] = "Başarısız",
    };

    public async Task<DashboardDto> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var twelveMonthsAgo = new DateTime(now.Year, now.Month, 1).AddMonths(-11);
        var sevenDaysAgo = todayStart.AddDays(-6);

        // ── Today ────────────────────────────────────────────────────────────
        var todayOrders = await db.Orders
            .Where(o => o.CreatedDate >= todayStart
                     && o.Status != OrderStatus.Cancelled
                     && o.Status != OrderStatus.Failed)
            .ToListAsync(cancellationToken);

        // ── Month ─────────────────────────────────────────────────────────────
        var monthOrders = await db.Orders
            .Where(o => o.CreatedDate >= monthStart
                     && o.Status != OrderStatus.Cancelled
                     && o.Status != OrderStatus.Failed)
            .ToListAsync(cancellationToken);

        // ── Pending ───────────────────────────────────────────────────────────
        var pendingCount = await db.Orders.CountAsync(
            o => o.Status == OrderStatus.Created
              || o.Status == OrderStatus.PaymentPending
              || o.Status == OrderStatus.PaymentCompleted
              || o.Status == OrderStatus.Preparing, cancellationToken);

        // ── Critical stock ────────────────────────────────────────────────────
        var criticalStockCount = await db.Stocks
            .CountAsync(s => (s.Quantity - s.ReservedQuantity) <= s.CriticalStockLevel, cancellationToken);

        // ── Customers ─────────────────────────────────────────────────────────
        var totalCustomers = await db.UserRoles.CountAsync(r => r.Role == UserRoleEnum.Customer, cancellationToken);

        var newCustomers = await db.Users
            .CountAsync(u => u.CreatedDate >= monthStart, cancellationToken);

        // ── Monthly summary (last 12 months) ─────────────────────────────────
        var allOrders12 = await db.Orders
            .Where(o => o.CreatedDate >= twelveMonthsAgo
                     && o.Status != OrderStatus.Cancelled
                     && o.Status != OrderStatus.Failed)
            .Select(o => new { o.CreatedDate, o.GrandTotal })
            .ToListAsync(cancellationToken);

        var monthlySummary = allOrders12
            .GroupBy(o => new { o.CreatedDate.Year, o.CreatedDate.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new MonthlySummaryDto(
                Month: $"{g.Key.Year}-{g.Key.Month:D2}",
                Revenue: g.Sum(o => o.GrandTotal),
                OrderCount: g.Count()
            ))
            .ToList();

        // ── Weekly orders (last 7 days) ───────────────────────────────────────
        var weekOrders = await db.Orders
            .Where(o => o.CreatedDate >= sevenDaysAgo)
            .Select(o => new { o.CreatedDate, o.GrandTotal })
            .ToListAsync(cancellationToken);

        var weeklyOrders = Enumerable.Range(0, 7)
            .Select(i =>
            {
                var day = sevenDaysAgo.AddDays(i);
                var dayOrders = weekOrders.Where(o => o.CreatedDate.Date == day.Date).ToList();
                return new WeeklyOrderDto(
                    Day: day.ToString("yyyy-MM-dd"),
                    Label: DAY_LABELS[(int)day.DayOfWeek],
                    OrderCount: dayOrders.Count,
                    Revenue: dayOrders.Sum(o => o.GrandTotal)
                );
            })
            .ToList();

        // ── Order status breakdown ────────────────────────────────────────────
        var statusCounts = await db.Orders
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var statusBreakdown = statusCounts
            .OrderByDescending(s => s.Count)
            .Select(s => new OrderStatusCountDto(
                Status: (int)s.Status,
                Label: STATUS_LABELS.GetValueOrDefault(s.Status, s.Status.ToString()),
                Count: s.Count
            ))
            .ToList();

        // ── Recent orders (with customer name) ───────────────────────────────
        var recentOrders = await db.Orders
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedDate)
            .Take(10)
            .Select(o => new RecentOrderDto(
                o.Id.ToString(),
                o.OrderNumber,
                o.User != null ? o.User.Name + " " + o.User.Surname : (o.GuestEmail ?? "Misafir"),
                o.GrandTotal,
                (int)o.Status,
                o.CreatedDate
            ))
            .ToListAsync(cancellationToken);

        return new DashboardDto(
            TodaySales: todayOrders.Sum(o => o.GrandTotal),
            TodayOrderCount: todayOrders.Count,
            PendingOrderCount: pendingCount,
            CriticalStockCount: criticalStockCount,
            MonthSales: monthOrders.Sum(o => o.GrandTotal),
            MonthOrderCount: monthOrders.Count,
            TotalCustomerCount: totalCustomers,
            NewCustomerCount: newCustomers,
            MonthlySummary: monthlySummary,
            WeeklyOrders: weeklyOrders,
            OrderStatusBreakdown: statusBreakdown,
            RecentOrders: recentOrders
        );
    }
}
