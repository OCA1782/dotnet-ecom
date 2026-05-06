using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecom.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.OrderNumber).IsUnique();
        builder.Property(x => x.OrderNumber).HasMaxLength(30).IsRequired();
        builder.Property(x => x.TotalProductAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.DiscountAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.ShippingAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.TaxAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.GrandTotal).HasColumnType("decimal(18,2)");
        builder.Property(x => x.ShippingAddressSnapshot).HasColumnType("nvarchar(max)");
        builder.Property(x => x.BillingAddressSnapshot).HasColumnType("nvarchar(max)");

        builder.HasMany(x => x.Items).WithOne(i => i.Order).HasForeignKey(i => i.OrderId);
        builder.HasMany(x => x.StatusHistory).WithOne(h => h.Order).HasForeignKey(h => h.OrderId);
        builder.HasOne(x => x.Payment).WithOne(p => p.Order).HasForeignKey<Payment>(p => p.OrderId);
        builder.HasOne(x => x.Shipment).WithOne(s => s.Order).HasForeignKey<Shipment>(s => s.OrderId);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
