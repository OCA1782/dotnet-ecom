using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class WishlistItem : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
}
