using Ecom.Application.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecom.Infrastructure.Messaging.Sagas;

public class OrderProcessingStateMachine : MassTransitStateMachine<OrderSagaState>
{
    public State WaitingForPayment { get; private set; } = null!;
    public State Processing { get; private set; } = null!;
    public State Shipped { get; private set; } = null!;
    public State Completed { get; private set; } = null!;
    public State Cancelled { get; private set; } = null!;

    public Event<OrderCreatedEvent> OrderCreated { get; private set; } = null!;
    public Event<PaymentCompletedEvent> PaymentCompleted { get; private set; } = null!;
    public Event<OrderStatusChangedEvent> OrderStatusChanged { get; private set; } = null!;
    public Event<OrderCancelledEvent> OrderCancelled { get; private set; } = null!;

    public OrderProcessingStateMachine(ILogger<OrderProcessingStateMachine> logger)
    {
        InstanceState(x => x.CurrentState);

        Event(() => OrderCreated, x => x.CorrelateById(ctx => ctx.Message.OrderId));
        Event(() => PaymentCompleted, x => x.CorrelateById(ctx => ctx.Message.OrderId));
        Event(() => OrderStatusChanged, x => x.CorrelateById(ctx => ctx.Message.OrderId));
        Event(() => OrderCancelled, x => x.CorrelateById(ctx => ctx.Message.OrderId));

        Initially(
            When(OrderCreated)
                .Then(ctx =>
                {
                    ctx.Saga.OrderNumber = ctx.Message.OrderNumber;
                    ctx.Saga.CustomerEmail = ctx.Message.CustomerEmail;
                    ctx.Saga.CreatedAt = ctx.Message.CreatedAt;
                    logger.LogInformation("[Saga] Order {OrderNumber} created — waiting for payment", ctx.Message.OrderNumber);
                })
                .TransitionTo(WaitingForPayment)
        );

        During(WaitingForPayment,
            When(PaymentCompleted)
                .Then(ctx =>
                {
                    ctx.Saga.PaymentCompletedAt = ctx.Message.CompletedAt;
                    logger.LogInformation("[Saga] Order {OrderNumber} payment completed", ctx.Saga.OrderNumber);
                })
                .TransitionTo(Processing),

            When(OrderCancelled)
                .Then(ctx => logger.LogInformation("[Saga] Order {OrderNumber} cancelled", ctx.Saga.OrderNumber))
                .TransitionTo(Cancelled)
                .Finalize()
        );

        During(Processing,
            When(OrderStatusChanged, ctx => ctx.Message.NewStatus == 5) // Shipped
                .Then(ctx =>
                {
                    ctx.Saga.ShippedAt = ctx.Message.ChangedAt;
                    logger.LogInformation("[Saga] Order {OrderNumber} shipped", ctx.Saga.OrderNumber);
                })
                .TransitionTo(Shipped),

            When(OrderCancelled)
                .Then(ctx => logger.LogInformation("[Saga] Order {OrderNumber} cancelled during processing", ctx.Saga.OrderNumber))
                .TransitionTo(Cancelled)
                .Finalize()
        );

        During(Shipped,
            When(OrderStatusChanged, ctx => ctx.Message.NewStatus == 7) // Completed
                .Then(ctx =>
                {
                    ctx.Saga.CompletedAt = ctx.Message.ChangedAt;
                    logger.LogInformation("[Saga] Order {OrderNumber} completed", ctx.Saga.OrderNumber);
                })
                .TransitionTo(Completed)
                .Finalize()
        );

        SetCompletedWhenFinalized();
    }
}
