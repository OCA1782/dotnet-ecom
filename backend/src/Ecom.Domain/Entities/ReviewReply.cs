using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class ReviewReply : BaseEntity
{
    public Guid ReviewId { get; set; }
    public ProductReview Review { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Body { get; set; } = string.Empty;
}
