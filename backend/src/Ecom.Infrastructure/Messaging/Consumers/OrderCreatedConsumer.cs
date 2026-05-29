using Ecom.Application.Common.Interfaces;
using Ecom.Application.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecom.Infrastructure.Messaging.Consumers;

public class OrderCreatedConsumer(IEmailService emailService, ILogger<OrderCreatedConsumer> logger)
    : IConsumer<OrderCreatedEvent>
{
    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var ev = context.Message;
        logger.LogInformation("OrderCreated event received: {OrderNumber}", ev.OrderNumber);

        var email = ev.CustomerEmail;
        if (string.IsNullOrWhiteSpace(email)) return;

        try
        {
            await emailService.SendOrderConfirmationAsync(email, email, ev.OrderNumber, ev.TotalAmount, context.CancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send order confirmation email for {OrderNumber}", ev.OrderNumber);
            throw;
        }
    }
}
