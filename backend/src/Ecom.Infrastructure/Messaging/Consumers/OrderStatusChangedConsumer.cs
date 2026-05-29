using Ecom.Application.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecom.Infrastructure.Messaging.Consumers;

public class OrderStatusChangedConsumer(ILogger<OrderStatusChangedConsumer> logger)
    : IConsumer<OrderStatusChangedEvent>
{
    public Task Consume(ConsumeContext<OrderStatusChangedEvent> context)
    {
        var ev = context.Message;
        logger.LogInformation(
            "OrderStatusChanged: {OrderNumber} {Old} → {New}",
            ev.OrderNumber, ev.OldStatus, ev.NewStatus);
        return Task.CompletedTask;
    }
}
