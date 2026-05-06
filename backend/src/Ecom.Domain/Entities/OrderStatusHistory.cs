using Ecom.Domain.Common;
using Ecom.Domain.Enums;

namespace Ecom.Domain.Entities;

public class OrderStatusHistory : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public OrderStatus FromStatus { get; set; }
    public OrderStatus ToStatus { get; set; }
    public string? Note { get; set; }
    public Guid? ChangedByUserId { get; set; }
}
