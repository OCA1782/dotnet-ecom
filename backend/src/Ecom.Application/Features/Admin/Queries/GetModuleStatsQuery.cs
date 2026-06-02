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

public class GetModuleStatsQueryHandler(IApplicationDbContext db) : IRequestHandler<GetModuleStatsQuery, ModuleStatsDto>
{
    public async Task<ModuleStatsDto> Handle(GetModuleStatsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var thirtyDaysAgo = now.AddDays(-30);

        // Ürünler
        var totalProducts  = await db.Products.CountAsync(cancellationToken);
        var activeProducts = await db.Products.CountAsync(p => p.IsActive, cancellationToken);

        // Kategoriler
        var totalCategories  = await db.Categories.CountAsync(cancellationToken);
        var activeCategories = await db.Categories.CountAsync(c => c.IsActive, cancellationToken);

        // Markalar
        var totalBrands  = await db.Brands.CountAsync(cancellationToken);
        var activeBrands = await db.Brands.CountAsync(b => b.IsActive, cancellationToken);

        // Stok
        var criticalStock  = await db.Stocks.CountAsync(s => (s.Quantity - s.ReservedQuantity) <= s.CriticalStockLevel && (s.Quantity - s.ReservedQuantity) > 0, cancellationToken);
        var outOfStock     = await db.Stocks.CountAsync(s => (s.Quantity - s.ReservedQuantity) <= 0, cancellationToken);
        var totalStocks    = await db.Stocks.CountAsync(cancellationToken);
        var healthyStock   = totalStocks - criticalStock - outOfStock;

        // Yorumlar
        var pendingReviews  = await db.ProductReviews.CountAsync(r => !r.IsApproved, cancellationToken);
        var approvedReviews = await db.ProductReviews.CountAsync(r => r.IsApproved, cancellationToken);

        // Duyurular
        var activeAnnouncements = await db.Announcements.CountAsync(a => a.IsActive, cancellationToken);
        var totalAnnouncements  = await db.Announcements.CountAsync(cancellationToken);

        // Siparişler
        var todayOrders = await db.Orders.CountAsync(o => o.CreatedDate >= todayStart && !o.IsDeleted, cancellationToken);
        var pendingOrders = await db.Orders.CountAsync(o =>
            (o.Status == OrderStatus.Created || o.Status == OrderStatus.PaymentPending ||
             o.Status == OrderStatus.PaymentCompleted || o.Status == OrderStatus.Preparing)
            && !o.IsDeleted, cancellationToken);
        var refundRequested = await db.Orders.CountAsync(o => o.Status == OrderStatus.RefundRequested && !o.IsDeleted, cancellationToken);

        // Kuponlar
        var activeCoupons  = await db.Coupons.CountAsync(c => c.IsActive && (c.EndDate == null || c.EndDate > now), cancellationToken);
        var totalCoupons   = await db.Coupons.CountAsync(cancellationToken);
        var expiredCoupons = await db.Coupons.CountAsync(c => c.EndDate != null && c.EndDate <= now, cancellationToken);

        // Ödemeler
        var pendingPayments = await db.Payments.CountAsync(p => p.Status == PaymentStatus.Pending, cancellationToken);
        var failedPayments  = await db.Payments.CountAsync(p => p.Status == PaymentStatus.Failed, cancellationToken);
        var todayPayments   = await db.Payments.CountAsync(p => p.CreatedDate >= todayStart, cancellationToken);

        // İadeler (Refunded sipariş = tamamlanmış iade, RefundRequested = açık)
        var openRefunds      = refundRequested;
        var processedRefunds = await db.Orders.CountAsync(o => o.Status == OrderStatus.Refunded && !o.IsDeleted, cancellationToken);

        // Kargo
        var shipped         = await db.Shipments.CountAsync(s => s.Status == ShipmentStatus.Shipped, cancellationToken);
        var inTransit       = await db.Shipments.CountAsync(s => s.Status == ShipmentStatus.InTransit, cancellationToken);
        var deliveryFailed  = await db.Shipments.CountAsync(s => s.Status == ShipmentStatus.FailedDelivery, cancellationToken);

        // Faturalar
        var draftInvoices = await db.Invoices.CountAsync(i => i.Status == InvoiceStatus.Draft, cancellationToken);
        var errorInvoices = await db.Invoices.CountAsync(i => i.Status == InvoiceStatus.Error, cancellationToken);
        var totalInvoices = await db.Invoices.CountAsync(cancellationToken);

        // Kullanıcılar
        var totalUsers     = await db.Users.CountAsync(cancellationToken);
        var newUsersMonth  = await db.Users.CountAsync(u => u.CreatedDate >= monthStart, cancellationToken);
        var activeUsers    = await db.Orders
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
