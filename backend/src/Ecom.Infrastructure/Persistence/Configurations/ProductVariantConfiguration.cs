using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecom.Infrastructure.Persistence.Configurations;

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.SKU).IsUnique();
        builder.Property(x => x.SKU).HasMaxLength(100).IsRequired();
        builder.Property(x => x.VariantName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Price).HasColumnType("decimal(18,2)");
        builder.Property(x => x.DiscountPrice).HasColumnType("decimal(18,2)");
        builder.Property(x => x.AttributesJson).HasColumnType("nvarchar(max)");
    }
}
