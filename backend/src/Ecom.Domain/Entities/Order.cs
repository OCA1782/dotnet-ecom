using Ecom.Domain.Common;
using Ecom.Domain.Enums;

namespace Ecom.Domain.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Created;
    public decimal TotalProductAmount { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public decimal ShippingAmount { get; set; } = 0;
    public decimal TaxAmount { get; set; }
    public decimal GrandTotal { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public ShipmentStatus ShipmentStatus { get; set; } = ShipmentStatus.NotShipped;
    public string? GuestEmail { get; set; }

    // Snapshot of shipping address at order time
    public string ShippingAddressSnapshot { get; set; } = string.Empty;
    // Snapshot of billing address at order time
    public string BillingAddressSnapshot { get; set; } = string.Empty;

    public string? Note { get; set; }
    public string? CouponCode { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
    public Payment? Payment { get; set; }
    public Shipment? Shipment { get; set; }
}
