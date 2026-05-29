using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class ReviewReport : BaseEntity
{
    public Guid ReviewId { get; set; }
    public ProductReview Review { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Reason { get; set; } = string.Empty;   // spam | inappropriate | offensive | misinformation | other
    public bool IsResolved { get; set; } = false;
}
