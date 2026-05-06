using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class Cart : BaseEntity
{
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string? SessionId { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? CouponCode { get; set; }

    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}
