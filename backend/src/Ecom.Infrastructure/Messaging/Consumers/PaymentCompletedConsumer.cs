using Ecom.Application.Common.Interfaces;
using Ecom.Application.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecom.Infrastructure.Messaging.Consumers;

public class PaymentCompletedConsumer(IEmailService emailService, ILogger<PaymentCompletedConsumer> logger)
    : IConsumer<PaymentCompletedEvent>
{
    public async Task Consume(ConsumeContext<PaymentCompletedEvent> context)
    {
        var ev = context.Message;
        logger.LogInformation("PaymentCompleted event received: {OrderNumber}", ev.OrderNumber);

        if (string.IsNullOrWhiteSpace(ev.CustomerEmail)) return;

        try
        {
            await emailService.SendPaymentSuccessAsync(ev.CustomerEmail, ev.CustomerEmail, ev.OrderNumber, ev.Amount, context.CancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send payment success email for {OrderNumber}", ev.OrderNumber);
            throw;
        }
    }
}
