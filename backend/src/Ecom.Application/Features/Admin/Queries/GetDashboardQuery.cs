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
    int OutOfStockCount,
    int TotalProductCount,
    decimal MonthSales,
    int MonthOrderCount,
    int TotalCustomerCount,
    int NewCustomerCount,
    int ActiveCustomerCount,
    int CancelledOrderCount,
    int AbandonedOrderCount,
    double SatisfactionRate,
    int ReviewCount,
    IEnumerable<MonthlySummaryDto> MonthlySummary,
    IEnumerable<WeeklyOrderDto> WeeklyOrders,
    IEnumerable<OrderStatusCountDto> OrderStatusBreakdown,
    IEnumerable<RecentOrderDto> RecentOrders,
    IEnumerable<WeeklyCountDto> WeeklyNewUsers,
    decimal? MonthTargetRevenue,
    int? MonthTargetOrderCount
);

public record MonthlySummaryDto(string Month, decimal Revenue, int OrderCount);
public record WeeklyOrderDto(string Day, string Label, int OrderCount, decimal Revenue);
public record WeeklyCountDto(string Day, string Label, int Count);
public record OrderStatusCountDto(int Status, string Label, int Count);
public record RecentOrderDto(string Id, string OrderNumber, string CustomerName, decimal GrandTotal, int Status, DateTime CreatedDate);

public record GetDashboardQuery : IRequest<DashboardDto>;

public class GetDashboardHandler(IApplicationDbContext db, IDapperQueryService dapper, ICacheService cache, ICurrentUserService currentUser) : IRequestHandler<GetDashboardQuery, DashboardDto>
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
        [OrderStatus.OnHold] = "Askıda",
    };

    public async Task<DashboardDto> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var isSuperAdmin = currentUser.IsSuperAdmin;
        var adminId = currentUser.UserId;
        var cacheUserKey = isSuperAdmin ? "super" : adminId?.ToString() ?? "unknown";
        var cacheKey = $"dashboard:stats:{cacheUserKey}";

        var cached = await cache.GetAsync<DashboardDto>(cacheKey, cancellationToken);
        if (cached is not null) return cached;

        List<Guid> managedUserIds = [];
        if (!isSuperAdmin && adminId.HasValue)
        {
            managedUserIds = await db.Users
                .Where(u => u.CreatedByAdminId == adminId.Value || u.Id == adminId.Value)
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);
        }

        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var thirtyDaysAgo = now.AddDays(-30);
        var twelveMonthsAgo = new DateTime(now.Year, now.Month, 1).AddMonths(-11);
        var sevenDaysAgo = todayStart.AddDays(-6);
        var oneHourAgo = now.AddHours(-1);

        // Base order queryable with optional tenant filter
        var ordersBase = db.Orders.AsQueryable();
        if (!isSuperAdmin)
            ordersBase = ordersBase.Where(o => o.UserId != null && managedUserIds.Contains(o.UserId.Value));

        decimal todaySales, monthSales;
        int todayOrderCount, monthOrderCount;

        if (isSuperAdmin)
        {
            // Dapper: faster for global aggregates
            todaySales = await dapper.QueryFirstOrDefaultAsync<decimal?>(
                @"SELECT COALESCE(SUM(""GrandTotal""),0) FROM ""Orders"" WHERE ""CreatedDate"" >= @from AND ""Status"" NOT IN (8,11) AND ""IsDeleted""=false",
                new { from = todayStart }, cancellationToken) ?? 0m;
            todayOrderCount = await dapper.QueryFirstOrDefaultAsync<int>(
                @"SELECT COUNT(*) FROM ""Orders"" WHERE ""CreatedDate"" >= @from AND ""Status"" NOT IN (8,11) AND ""IsDeleted""=false",
                new { from = todayStart }, cancellationToken);
            monthSales = await dapper.QueryFirstOrDefaultAsync<decimal?>(
                @"SELECT COALESCE(SUM(""GrandTotal""),0) FROM ""Orders"" WHERE ""CreatedDate"" >= @from AND ""Status"" NOT IN (8,11) AND ""IsDeleted""=false",
                new { from = monthStart }, cancellationToken) ?? 0m;
            monthOrderCount = await dapper.QueryFirstOrDefaultAsync<int>(
                @"SELECT COUNT(*) FROM ""Orders"" WHERE ""CreatedDate"" >= @from AND ""Status"" NOT IN (8,11) AND ""IsDeleted""=false",
                new { from = monthStart }, cancellationToken);
        }
        else
        {
            var tenantSalesBase = ordersBase.Where(o => !o.IsDeleted
                && o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Failed);
            todaySales = await tenantSalesBase.Where(o => o.CreatedDate >= todayStart)
                .SumAsync(o => (decimal?)o.GrandTotal, cancellationToken) ?? 0m;
            todayOrderCount = await tenantSalesBase.CountAsync(o => o.CreatedDate >= todayStart, cancellationToken);
            monthSales = await tenantSalesBase.Where(o => o.CreatedDate >= monthStart)
                .SumAsync(o => (decimal?)o.GrandTotal, cancellationToken) ?? 0m;
            monthOrderCount = await tenantSalesBase.CountAsync(o => o.CreatedDate >= monthStart, cancellationToken);
        }

        var pendingCount = await ordersBase.CountAsync(
            o => o.Status == OrderStatus.Created
              || o.Status == OrderStatus.PaymentPending
              || o.Status == OrderStatus.PaymentCompleted
              || o.Status == OrderStatus.Preparing, cancellationToken);

        var criticalStockCount = await db.Stocks
            .CountAsync(s => (s.Quantity - s.ReservedQuantity) <= s.CriticalStockLevel, cancellationToken);

        var outOfStockCount = await db.Stocks
            .CountAsync(s => (s.Quantity - s.ReservedQuantity) <= 0, cancellationToken);

        // Products - filter by admin
        var productsBase = db.Products.AsQueryable();
        if (!isSuperAdmin && adminId.HasValue)
            productsBase = productsBase.Where(p => p.CreatedByAdminId == adminId.Value);

        var totalProductCount = await productsBase.CountAsync(p => p.IsActive, cancellationToken);

        // Users / customers - filter by admin
        var usersBase = db.Users.AsQueryable();
        if (!isSuperAdmin && adminId.HasValue)
            usersBase = usersBase.Where(u => u.CreatedByAdminId == adminId.Value);

        var totalCustomers = isSuperAdmin
            ? await db.UserRoles.CountAsync(r => r.Role == UserRoleEnum.Customer, cancellationToken)
            : await usersBase.CountAsync(cancellationToken);

        var newCustomers = await usersBase.CountAsync(u => u.CreatedDate >= monthStart, cancellationToken);

        var activeCustomerCount = await ordersBase
            .Where(o => o.CreatedDate >= thirtyDaysAgo && o.UserId != null
                     && o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Failed)
            .Select(o => o.UserId)
            .Distinct()
            .CountAsync(cancellationToken);

        var cancelledOrderCount = await ordersBase
            .CountAsync(o => o.Status == OrderStatus.Cancelled, cancellationToken);

        var abandonedOrderCount = await ordersBase
            .CountAsync(o => (o.Status == OrderStatus.Created || o.Status == OrderStatus.PaymentPending)
                          && o.CreatedDate < oneHourAgo, cancellationToken);

        // Reviews - filter by admin's products
        var reviewsBase = db.ProductReviews.AsQueryable();
        if (!isSuperAdmin && adminId.HasValue)
            reviewsBase = reviewsBase.Where(r => r.Product.CreatedByAdminId == adminId.Value);

        var approvedReviews = await reviewsBase
            .Where(r => r.IsApproved)
            .Select(r => r.Rating)
            .ToListAsync(cancellationToken);
        var satisfactionRate = approvedReviews.Count > 0 ? Math.Round((approvedReviews.Average() / 5.0) * 100, 1) : 0;

        var allOrders12 = await ordersBase
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

        var weekOrders = await ordersBase
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

        var weekUsers = await usersBase
            .Where(u => u.CreatedDate >= sevenDaysAgo)
            .Select(u => u.CreatedDate)
            .ToListAsync(cancellationToken);

        var weeklyNewUsers = Enumerable.Range(0, 7)
            .Select(i =>
            {
                var day = sevenDaysAgo.AddDays(i);
                return new WeeklyCountDto(
                    Day: day.ToString("yyyy-MM-dd"),
                    Label: DAY_LABELS[(int)day.DayOfWeek],
                    Count: weekUsers.Count(u => u.Date == day.Date)
                );
            })
            .ToList();

        var statusCounts = await ordersBase
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

        var currentGoal = await db.SalesGoals
            .FirstOrDefaultAsync(g => g.Year == now.Year && g.Month == now.Month, cancellationToken);

        var recentOrdersQ = db.Orders.Include(o => o.User).AsQueryable();
        if (!isSuperAdmin)
            recentOrdersQ = recentOrdersQ.Where(o => o.UserId != null && managedUserIds.Contains(o.UserId.Value));

        var recentOrders = await recentOrdersQ
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

        var result = new DashboardDto(
            TodaySales: todaySales,
            TodayOrderCount: todayOrderCount,
            PendingOrderCount: pendingCount,
            CriticalStockCount: criticalStockCount,
            OutOfStockCount: outOfStockCount,
            TotalProductCount: totalProductCount,
            MonthSales: monthSales,
            MonthOrderCount: monthOrderCount,
            TotalCustomerCount: totalCustomers,
            NewCustomerCount: newCustomers,
            ActiveCustomerCount: activeCustomerCount,
            CancelledOrderCount: cancelledOrderCount,
            AbandonedOrderCount: abandonedOrderCount,
            SatisfactionRate: satisfactionRate,
            ReviewCount: approvedReviews.Count,
            MonthlySummary: monthlySummary,
            WeeklyOrders: weeklyOrders,
            OrderStatusBreakdown: statusBreakdown,
            RecentOrders: recentOrders,
            WeeklyNewUsers: weeklyNewUsers,
            MonthTargetRevenue: currentGoal?.TargetRevenue,
            MonthTargetOrderCount: currentGoal?.TargetOrderCount
        );

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(1), cancellationToken);
        return result;
    }
}
