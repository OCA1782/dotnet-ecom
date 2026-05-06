using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecom.Infrastructure.Persistence.Configurations;

public class StockConfiguration : IEntityTypeConfiguration<Stock>
{
    public void Configure(EntityTypeBuilder<Stock> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Ignore(x => x.AvailableQuantity);

        builder.HasMany(x => x.Movements).WithOne(m => m.Stock).HasForeignKey(m => m.StockId);

        builder.HasOne(x => x.ProductVariant)
            .WithOne(v => v.Stock)
            .HasForeignKey<Stock>(s => s.ProductVariantId);
    }
}
