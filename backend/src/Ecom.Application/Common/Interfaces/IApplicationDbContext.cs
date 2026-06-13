using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<UserAddress> UserAddresses { get; }
    DbSet<Category> Categories { get; }
    DbSet<Brand> Brands { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<Stock> Stocks { get; }
    DbSet<StockMovement> StockMovements { get; }
    DbSet<Cart> Carts { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<OrderStatusHistory> OrderStatusHistories { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Shipment> Shipments { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<SiteSetting> SiteSettings { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<CouponUsage> CouponUsages { get; }
    DbSet<ProductReview> ProductReviews { get; }
    DbSet<ReviewLike> ReviewLikes { get; }
    DbSet<ReviewReply> ReviewReplies { get; }
    DbSet<ReviewReport> ReviewReports { get; }
    DbSet<License> Licenses { get; }
    DbSet<SalesGoal> SalesGoals { get; }
    DbSet<ErrorLog> ErrorLogs { get; }
    DbSet<WishlistItem> WishlistItems { get; }
    DbSet<ExternalSource> ExternalSources { get; }
    DbSet<ExternalSourceImportLog> ExternalSourceImportLogs { get; }
    DbSet<ImportJob> ImportJobs { get; }
    DbSet<VisitorLog> VisitorLogs { get; }
    DbSet<OutboxMessage> OutboxMessages { get; }
    DbSet<UserRefreshToken> UserRefreshTokens { get; }
    DbSet<ShippingCarrier> ShippingCarriers { get; }
    DbSet<Invoice> Invoices { get; }
    DbSet<InvoiceItem> InvoiceItems { get; }
    DbSet<Announcement> Announcements { get; }
    DbSet<DeployServer> DeployServers { get; }
    DbSet<DeployLog> DeployLogs { get; }
    DbSet<JobLog> JobLogs { get; }
    DbSet<UploadedFile> UploadedFiles { get; }
    DbSet<Campaign> Campaigns { get; }
    DbSet<AlertCondition> AlertConditions { get; }
    DbSet<LicenseAssignment> LicenseAssignments { get; }
    DbSet<MailLog> MailLogs { get; }

    void ClearChangeTracker();
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
