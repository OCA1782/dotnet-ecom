namespace Ecom.Domain.Enums;

public enum OrderStatus
{
    Created = 1,
    PaymentPending = 2,
    PaymentCompleted = 3,
    Preparing = 4,
    Shipped = 5,
    Delivered = 6,
    Completed = 7,
    Cancelled = 8,
    RefundRequested = 9,
    Refunded = 10,
    Failed = 11,
    OnHold = 12
}
