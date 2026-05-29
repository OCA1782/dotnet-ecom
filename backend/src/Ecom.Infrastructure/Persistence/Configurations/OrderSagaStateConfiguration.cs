using Ecom.Infrastructure.Messaging.Sagas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecom.Infrastructure.Persistence.Configurations;

public class OrderSagaStateConfiguration : IEntityTypeConfiguration<OrderSagaState>
{
    public void Configure(EntityTypeBuilder<OrderSagaState> builder)
    {
        builder.HasKey(x => x.CorrelationId);
        builder.Property(x => x.CurrentState).HasMaxLength(64);
        builder.Property(x => x.OrderNumber).HasMaxLength(50);
        builder.Property(x => x.CustomerEmail).HasMaxLength(256);
        builder.ToTable("OrderSagaStates");
    }
}
