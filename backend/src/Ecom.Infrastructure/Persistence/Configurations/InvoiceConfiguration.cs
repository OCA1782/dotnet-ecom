using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecom.Infrastructure.Persistence.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.InvoiceNumber).HasMaxLength(50).IsRequired();
        b.HasIndex(e => e.InvoiceNumber).IsUnique();
        b.Property(e => e.SubTotal).HasColumnType("decimal(18,2)");
        b.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
        b.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
        b.Property(e => e.GuestEmail).HasMaxLength(250);
        b.Property(e => e.ProviderInvoiceId).HasMaxLength(200);

        b.HasOne(e => e.Order)
            .WithMany()
            .HasForeignKey(e => e.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasMany(e => e.Items)
            .WithOne(i => i.Invoice)
            .HasForeignKey(i => i.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class InvoiceItemConfiguration : IEntityTypeConfiguration<InvoiceItem>
{
    public void Configure(EntityTypeBuilder<InvoiceItem> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.ProductName).HasMaxLength(300).IsRequired();
        b.Property(e => e.SKU).HasMaxLength(100);
        b.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
        b.Property(e => e.TaxRate).HasColumnType("decimal(5,2)");
        b.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
        b.Property(e => e.LineTotal).HasColumnType("decimal(18,2)");
    }
}
