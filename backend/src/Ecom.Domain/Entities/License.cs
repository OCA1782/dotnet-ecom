using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class License : BaseEntity
{
    public string Module { get; set; } = string.Empty;
    public string LicenseKey { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}
