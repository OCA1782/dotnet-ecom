using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class AlertCondition : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = "⚠️";
    public bool IsActive { get; set; } = true;
    public bool IsBuiltin { get; set; } = true;
    public int? Threshold { get; set; }
    public string? ThresholdUnit { get; set; }
}
