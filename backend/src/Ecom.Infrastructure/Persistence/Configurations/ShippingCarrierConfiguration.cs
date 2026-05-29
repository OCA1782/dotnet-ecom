using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecom.Infrastructure.Persistence.Configurations;

public class ShippingCarrierConfiguration : IEntityTypeConfiguration<ShippingCarrier>
{
    public void Configure(EntityTypeBuilder<ShippingCarrier> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Name).HasMaxLength(150).IsRequired();
        b.Property(e => e.Code).HasMaxLength(50).IsRequired();
        b.HasIndex(e => e.Code);
        b.Property(e => e.BasePrice).HasColumnType("decimal(18,2)");
        b.Property(e => e.FreeShippingThreshold).HasColumnType("decimal(18,2)");
        b.Property(e => e.MaxWeightKg).HasColumnType("decimal(10,3)");
        b.Property(e => e.TrackingUrlTemplate).HasMaxLength(500);
        b.Property(e => e.LogoUrl).HasMaxLength(500);
        b.Property(e => e.ApiEndpoint).HasMaxLength(500);
        b.Property(e => e.ApiKey).HasMaxLength(500);
    }
}
