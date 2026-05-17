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
    DbSet<SalesGoal> SalesGoals { get; }
    DbSet<ErrorLog> ErrorLogs { get; }
    DbSet<WishlistItem> WishlistItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
