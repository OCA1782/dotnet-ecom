using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class ProductReview : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public int Rating { get; set; } // 1–5
    public string? Title { get; set; }
    public string Body { get; set; } = string.Empty;

    public bool IsVerifiedPurchase { get; set; } = false;
    public bool IsApproved { get; set; } = false;
}
