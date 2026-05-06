using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecom.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Amount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Currency).HasMaxLength(3);
        builder.Property(x => x.PaymentProvider).HasMaxLength(50);
        builder.Property(x => x.TransactionId).HasMaxLength(200);
        builder.Property(x => x.IdempotencyKey).HasMaxLength(100);
        builder.Property(x => x.ProviderResponseJson).HasColumnType("nvarchar(max)");
    }
}
