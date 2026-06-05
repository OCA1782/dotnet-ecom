using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class LicenseAssignment : BaseEntity
{
    public Guid AdminUserId { get; set; }
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string LicenseToken { get; set; } = string.Empty;
    public string ViewPasswordHash { get; set; } = string.Empty;
    public bool IsRevoked { get; set; } = false;
    public string? Notes { get; set; }
}
