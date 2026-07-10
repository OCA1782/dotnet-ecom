using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Ecom.Infrastructure.Messaging.Sagas;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Infrastructure.Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : DbContext(options), IApplicationDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<CouponUsage> CouponUsages => Set<CouponUsage>();
    public DbSet<ProductReview> ProductReviews => Set<ProductReview>();
    public DbSet<ReviewLike> ReviewLikes => Set<ReviewLike>();
    public DbSet<ReviewReply> ReviewReplies => Set<ReviewReply>();
    public DbSet<ReviewReport> ReviewReports => Set<ReviewReport>();
    public DbSet<License> Licenses => Set<License>();
    public DbSet<SalesGoal> SalesGoals => Set<SalesGoal>();
    public DbSet<ErrorLog> ErrorLogs => Set<ErrorLog>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<ExternalSource> ExternalSources => Set<ExternalSource>();
    public DbSet<ExternalSourceImportLog> ExternalSourceImportLogs => Set<ExternalSourceImportLog>();
    public DbSet<ImportJob> ImportJobs => Set<ImportJob>();
    public DbSet<VisitorLog> VisitorLogs => Set<VisitorLog>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    public DbSet<UserRefreshToken> UserRefreshTokens => Set<UserRefreshToken>();
    public DbSet<OrderSagaState> OrderSagaStates => Set<OrderSagaState>();
    public DbSet<ShippingCarrier> ShippingCarriers => Set<ShippingCarrier>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<DeployServer> DeployServers => Set<DeployServer>();
    public DbSet<DeployLog> DeployLogs => Set<DeployLog>();
    public DbSet<JobLog> JobLogs => Set<JobLog>();
    public DbSet<UploadedFile> UploadedFiles => Set<UploadedFile>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<AlertCondition> AlertConditions => Set<AlertCondition>();
    public DbSet<LicenseAssignment> LicenseAssignments => Set<LicenseAssignment>();
    public DbSet<MailLog> MailLogs => Set<MailLog>();
    public DbSet<MailTemplate> MailTemplates => Set<MailTemplate>();
    public DbSet<AiTask> AiTasks => Set<AiTask>();
    public DbSet<AiTaskImage> AiTaskImages => Set<AiTaskImage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // Remap SQL Server-specific constructs for PostgreSQL
        if (Database.ProviderName?.Contains("Npgsql") == true)
        {
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                // Column types: nvarchar(max) → text, decimal(N,M) → numeric(N,M)
                foreach (var property in entity.GetProperties())
                {
                    var colType = property.GetColumnType();
                    if (colType == null) continue;
                    if (colType.Equals("nvarchar(max)", StringComparison.OrdinalIgnoreCase))
                        property.SetColumnType("text");
                    else if (colType.StartsWith("decimal(", StringComparison.OrdinalIgnoreCase))
                        property.SetColumnType(colType.Replace("decimal(", "numeric(", StringComparison.OrdinalIgnoreCase));
                }

                // Index filters: T-SQL bracket syntax → PostgreSQL double-quote syntax
                // e.g. "[IsDeleted] = 0" → "\"IsDeleted\" = false"
                foreach (var index in entity.GetIndexes())
                {
                    var filter = index.GetFilter();
                    if (string.IsNullOrEmpty(filter)) continue;
                    var pgFilter = filter
                        .Replace("[", "\"").Replace("]", "\"")
                        .Replace("= 0", "= false").Replace("= 1", "= true");
                    index.SetFilter(pgFilter);
                }
            }
        }

        base.OnModelCreating(modelBuilder);
    }

    public void ClearChangeTracker() => ChangeTracker.Clear();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Domain.Common.BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedDate = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
