using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record ModuleStatsDto(
    // Ürünler
    int TotalProducts,
    int ActiveProducts,
    int InactiveProducts,
    // Kategoriler
    int TotalCategories,
    int ActiveCategories,
    // Markalar
    int TotalBrands,
    int ActiveBrands,
    // Stok
    int CriticalStockCount,
    int OutOfStockCount,
    int HealthyStockCount,
    // Yorumlar
    int PendingReviewCount,
    int ApprovedReviewCount,
    int TotalReviewCount,
    // Duyurular
    int ActiveAnnouncementCount,
    int TotalAnnouncementCount,
    // Siparişler
    int TodayOrderCount,
    int PendingOrderCount,
    int RefundRequestedCount,
    // Kuponlar
    int ActiveCouponCount,
    int TotalCouponCount,
    int ExpiredCouponCount,
    // Ödemeler
    int PendingPaymentCount,
    int FailedPaymentCount,
    int TodayPaymentCount,
    // İadeler
    int OpenRefundCount,
    int ProcessedRefundCount,
    // Kargo
    int ShippedCount,
    int InTransitCount,
    int DeliveryFailedCount,
    // Faturalar
    int DraftInvoiceCount,
    int ErrorInvoiceCount,
    int TotalInvoiceCount,
    // Kullanıcılar
    int TotalUserCount,
    int NewUserThisMonthCount,
    int ActiveUserCount
);

public record GetModuleStatsQuery : IRequest<ModuleStatsDto>;

public class GetModuleStatsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<GetModuleStatsQuery, ModuleStatsDto>
{
    public async Task<ModuleStatsDto> Handle(GetModuleStatsQuery request, CancellationToken cancellationToken)
    {
        var isSuperAdmin = currentUser.IsSuperAdmin;
        var adminId = currentUser.UserId;

        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var thirtyDaysAgo = now.AddDays(-30);

        // Build managed user IDs for order-based tenant filtering
        List<Guid> managedUserIds = [];
        if (!isSuperAdmin && adminId.HasValue)
        {
            managedUserIds = await db.Users
                .Where(u => u.CreatedByAdminId == adminId.Value || u.Id == adminId.Value)
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);
        }

        // Base queryables with tenant filters
        var productsBase = db.Products.AsQueryable();
        var categoriesBase = db.Categories.AsQueryable();
        var brandsBase = db.Brands.AsQueryable();
        var stocksBase = db.Stocks.AsQueryable();
        var reviewsBase = db.ProductReviews.AsQueryable();
        var announcementsBase = db.Announcements.AsQueryable();
        var ordersBase = db.Orders.AsQueryable();
        var couponsBase = db.Coupons.AsQueryable();
        var usersBase = db.Users.AsQueryable();

        if (!isSuperAdmin && adminId.HasValue)
        {
            var id = adminId.Value;
            productsBase = productsBase.Where(p => p.CreatedByAdminId == id);
            categoriesBase = categoriesBase.Where(c => c.CreatedByAdminId == id);
            brandsBase = brandsBase.Where(b => b.CreatedByAdminId == id);
            stocksBase = stocksBase.Where(s => s.Product!.CreatedByAdminId == id);
            reviewsBase = reviewsBase.Where(r => r.Product!.CreatedByAdminId == id);
            announcementsBase = announcementsBase.Where(a => a.CreatedByAdminId == id);
            ordersBase = ordersBase.Where(o => o.UserId != null && managedUserIds.Contains(o.UserId.Value));
            couponsBase = couponsBase.Where(c => c.CreatedByAdminId == id);
            usersBase = usersBase.Where(u => u.CreatedByAdminId == id);
        }

        // Ürünler
        var totalProducts  = await productsBase.CountAsync(cancellationToken);
        var activeProducts = await productsBase.CountAsync(p => p.IsActive, cancellationToken);

        // Kategoriler
        var totalCategories  = await categoriesBase.CountAsync(cancellationToken);
        var activeCategories = await categoriesBase.CountAsync(c => c.IsActive, cancellationToken);

        // Markalar
        var totalBrands  = await brandsBase.CountAsync(cancellationToken);
        var activeBrands = await brandsBase.CountAsync(b => b.IsActive, cancellationToken);

        // Stok
        var criticalStock  = await stocksBase.CountAsync(s => (s.Quantity - s.ReservedQuantity) <= s.CriticalStockLevel && (s.Quantity - s.ReservedQuantity) > 0, cancellationToken);
        var outOfStock     = await stocksBase.CountAsync(s => (s.Quantity - s.ReservedQuantity) <= 0, cancellationToken);
        var totalStocks    = await stocksBase.CountAsync(cancellationToken);
        var healthyStock   = totalStocks - criticalStock - outOfStock;

        // Yorumlar
        var pendingReviews  = await reviewsBase.CountAsync(r => !r.IsApproved, cancellationToken);
        var approvedReviews = await reviewsBase.CountAsync(r => r.IsApproved, cancellationToken);

        // Duyurular
        var activeAnnouncements = await announcementsBase.CountAsync(a => a.IsActive, cancellationToken);
        var totalAnnouncements  = await announcementsBase.CountAsync(cancellationToken);

        // Siparişler
        var todayOrders = await ordersBase.CountAsync(o => o.CreatedDate >= todayStart && !o.IsDeleted, cancellationToken);
        var pendingOrders = await ordersBase.CountAsync(o =>
            (o.Status == OrderStatus.Created || o.Status == OrderStatus.PaymentPending ||
             o.Status == OrderStatus.PaymentCompleted || o.Status == OrderStatus.Preparing)
            && !o.IsDeleted, cancellationToken);
        var refundRequested = await ordersBase.CountAsync(o => o.Status == OrderStatus.RefundRequested && !o.IsDeleted, cancellationToken);

        // Kuponlar
        var activeCoupons  = await couponsBase.CountAsync(c => c.IsActive && (c.EndDate == null || c.EndDate > now), cancellationToken);
        var totalCoupons   = await couponsBase.CountAsync(cancellationToken);
        var expiredCoupons = await couponsBase.CountAsync(c => c.EndDate != null && c.EndDate <= now, cancellationToken);

        // Ödemeler
        var paymentsBase = db.Payments.AsQueryable();
        if (!isSuperAdmin && managedUserIds.Count > 0)
            paymentsBase = paymentsBase.Where(p => p.Order.UserId != null && managedUserIds.Contains(p.Order.UserId.Value));
        else if (!isSuperAdmin)
            paymentsBase = paymentsBase.Where(_ => false);

        var pendingPayments = await paymentsBase.CountAsync(p => p.Status == PaymentStatus.Pending, cancellationToken);
        var failedPayments  = await paymentsBase.CountAsync(p => p.Status == PaymentStatus.Failed, cancellationToken);
        var todayPayments   = await paymentsBase.CountAsync(p => p.CreatedDate >= todayStart, cancellationToken);

        // İadeler
        var openRefunds      = refundRequested;
        var processedRefunds = await ordersBase.CountAsync(o => o.Status == OrderStatus.Refunded && !o.IsDeleted, cancellationToken);

        // Kargo
        var shipmentsBase = db.Shipments.AsQueryable();
        if (!isSuperAdmin && managedUserIds.Count > 0)
            shipmentsBase = shipmentsBase.Where(s => s.Order.UserId != null && managedUserIds.Contains(s.Order.UserId.Value));
        else if (!isSuperAdmin)
            shipmentsBase = shipmentsBase.Where(_ => false);

        var shipped         = await shipmentsBase.CountAsync(s => s.Status == ShipmentStatus.Shipped, cancellationToken);
        var inTransit       = await shipmentsBase.CountAsync(s => s.Status == ShipmentStatus.InTransit, cancellationToken);
        var deliveryFailed  = await shipmentsBase.CountAsync(s => s.Status == ShipmentStatus.FailedDelivery, cancellationToken);

        // Faturalar
        var invoicesBase = db.Invoices.AsQueryable();
        if (!isSuperAdmin && managedUserIds.Count > 0)
            invoicesBase = invoicesBase.Where(i => i.Order.UserId != null && managedUserIds.Contains(i.Order.UserId.Value));
        else if (!isSuperAdmin)
            invoicesBase = invoicesBase.Where(_ => false);

        var draftInvoices = await invoicesBase.CountAsync(i => i.Status == InvoiceStatus.Draft, cancellationToken);
        var errorInvoices = await invoicesBase.CountAsync(i => i.Status == InvoiceStatus.Error, cancellationToken);
        var totalInvoices = await invoicesBase.CountAsync(cancellationToken);

        // Kullanıcılar
        var totalUsers     = await usersBase.CountAsync(cancellationToken);
        var newUsersMonth  = await usersBase.CountAsync(u => u.CreatedDate >= monthStart, cancellationToken);
        var activeUsers    = await ordersBase
            .Where(o => o.CreatedDate >= thirtyDaysAgo && o.UserId != null && !o.IsDeleted)
            .Select(o => o.UserId)
            .Distinct()
            .CountAsync(cancellationToken);

        return new ModuleStatsDto(
            TotalProducts: totalProducts,
            ActiveProducts: activeProducts,
            InactiveProducts: totalProducts - activeProducts,
            TotalCategories: totalCategories,
            ActiveCategories: activeCategories,
            TotalBrands: totalBrands,
            ActiveBrands: activeBrands,
            CriticalStockCount: criticalStock,
            OutOfStockCount: outOfStock,
            HealthyStockCount: healthyStock < 0 ? 0 : healthyStock,
            PendingReviewCount: pendingReviews,
            ApprovedReviewCount: approvedReviews,
            TotalReviewCount: pendingReviews + approvedReviews,
            ActiveAnnouncementCount: activeAnnouncements,
            TotalAnnouncementCount: totalAnnouncements,
            TodayOrderCount: todayOrders,
            PendingOrderCount: pendingOrders,
            RefundRequestedCount: refundRequested,
            ActiveCouponCount: activeCoupons,
            TotalCouponCount: totalCoupons,
            ExpiredCouponCount: expiredCoupons,
            PendingPaymentCount: pendingPayments,
            FailedPaymentCount: failedPayments,
            TodayPaymentCount: todayPayments,
            OpenRefundCount: openRefunds,
            ProcessedRefundCount: processedRefunds,
            ShippedCount: shipped,
            InTransitCount: inTransit,
            DeliveryFailedCount: deliveryFailed,
            DraftInvoiceCount: draftInvoices,
            ErrorInvoiceCount: errorInvoices,
            TotalInvoiceCount: totalInvoices,
            TotalUserCount: totalUsers,
            NewUserThisMonthCount: newUsersMonth,
            ActiveUserCount: activeUsers
        );
    }
}
