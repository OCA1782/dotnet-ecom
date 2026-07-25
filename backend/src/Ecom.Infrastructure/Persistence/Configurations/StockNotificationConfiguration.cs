using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecom.Infrastructure.Persistence.Configurations;

public class StockNotificationConfiguration : IEntityTypeConfiguration<StockNotification>
{
    public void Configure(EntityTypeBuilder<StockNotification> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnType("uuid");
        builder.Property(x => x.ProductId).HasColumnType("uuid");
        builder.Property(x => x.VariantId).HasColumnType("uuid");
        builder.Property(x => x.Email).HasMaxLength(256).HasColumnType("character varying(256)").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnType("timestamp with time zone");
        builder.Property(x => x.NotifiedAt).HasColumnType("timestamp with time zone");
        builder.Property(x => x.IsNotified).HasColumnType("boolean");
        builder.HasOne(x => x.Product)
               .WithMany()
               .HasForeignKey(x => x.ProductId)
               .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.ProductId, x.Email });
        builder.HasIndex(x => x.IsNotified);
    }
}
