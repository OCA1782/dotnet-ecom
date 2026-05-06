using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class CouponUsage : BaseEntity
{
    public Guid CouponId { get; set; }
    public Coupon Coupon { get; set; } = null!;
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public decimal DiscountApplied { get; set; }
}
