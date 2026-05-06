using Ecom.Domain.Common;
using Ecom.Domain.Enums;

namespace Ecom.Domain.Entities;

public class Coupon : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public CouponType Type { get; set; }
    public decimal Value { get; set; }
    public decimal MinOrderAmount { get; set; } = 0;
    public int? MaxUsageCount { get; set; }
    public int? MaxUsagePerUser { get; set; }
    public int UsageCount { get; set; } = 0;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<CouponUsage> Usages { get; set; } = new List<CouponUsage>();
}
