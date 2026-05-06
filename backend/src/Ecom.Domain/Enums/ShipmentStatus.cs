namespace Ecom.Domain.Enums;

public enum ShipmentStatus
{
    NotShipped = 1,
    Preparing = 2,
    Shipped = 3,
    InTransit = 4,
    Delivered = 5,
    FailedDelivery = 6,
    Returned = 7
}
