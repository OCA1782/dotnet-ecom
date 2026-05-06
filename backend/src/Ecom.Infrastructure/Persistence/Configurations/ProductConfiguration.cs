using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecom.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.SKU).IsUnique();
        builder.Property(x => x.Name).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(300).IsRequired();
        builder.Property(x => x.SKU).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Price).HasColumnType("decimal(18,2)");
        builder.Property(x => x.DiscountPrice).HasColumnType("decimal(18,2)");
        builder.Property(x => x.TaxRate).HasColumnType("decimal(5,2)");
        builder.Property(x => x.Currency).HasMaxLength(3);

        builder.HasOne(x => x.Category).WithMany(c => c.Products).HasForeignKey(x => x.CategoryId);
        builder.HasOne(x => x.Brand).WithMany(b => b.Products).HasForeignKey(x => x.BrandId);
        builder.HasMany(x => x.Images).WithOne(i => i.Product).HasForeignKey(i => i.ProductId);
        builder.HasMany(x => x.Variants).WithOne(v => v.Product).HasForeignKey(v => v.ProductId);
        builder.HasOne(x => x.Stock).WithOne(s => s.Product).HasForeignKey<Stock>(s => s.ProductId);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
