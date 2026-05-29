namespace Ecom.Application.Events;

public record OrderCreatedEvent(
    Guid OrderId,
    string OrderNumber,
    Guid? UserId,
    string? CustomerEmail,
    decimal TotalAmount,
    List<OrderItemSnapshot> Items,
    DateTime CreatedAt
);

public record OrderStatusChangedEvent(
    Guid OrderId,
    string OrderNumber,
    string? CustomerEmail,
    int OldStatus,
    int NewStatus,
    string? Note,
    DateTime ChangedAt
);

public record OrderCancelledEvent(
    Guid OrderId,
    string OrderNumber,
    string? CustomerEmail,
    string? Reason,
    DateTime CancelledAt
);

public record PaymentCompletedEvent(
    Guid OrderId,
    string OrderNumber,
    string? CustomerEmail,
    decimal Amount,
    string PaymentMethod,
    DateTime CompletedAt
);

public record PaymentFailedEvent(
    Guid OrderId,
    string OrderNumber,
    string? CustomerEmail,
    string? Reason,
    DateTime FailedAt
);

public record OrderItemSnapshot(
    Guid ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice
);
