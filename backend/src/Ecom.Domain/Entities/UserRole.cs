using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class UserRole : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Enums.UserRole Role { get; set; }
}
