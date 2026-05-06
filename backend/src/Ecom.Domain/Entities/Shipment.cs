using Ecom.Domain.Common;
using Ecom.Domain.Enums;

namespace Ecom.Domain.Entities;

public class Shipment : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public string CargoCompany { get; set; } = string.Empty;
    public string? TrackingNumber { get; set; }
    public string? TrackingUrl { get; set; }
    public decimal ShippingCost { get; set; }
    public ShipmentStatus Status { get; set; } = ShipmentStatus.NotShipped;
    public DateTime? ShippedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
}
