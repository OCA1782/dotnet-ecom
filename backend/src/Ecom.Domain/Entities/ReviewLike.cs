using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class ReviewLike : BaseEntity
{
    public Guid ReviewId { get; set; }
    public ProductReview Review { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public bool IsLike { get; set; } = true;   // true = beğeni, false = beğenmeme
}
