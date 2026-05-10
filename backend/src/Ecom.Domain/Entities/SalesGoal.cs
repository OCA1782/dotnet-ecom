using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class SalesGoal : BaseEntity
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal TargetRevenue { get; set; }
    public int TargetOrderCount { get; set; }
}
