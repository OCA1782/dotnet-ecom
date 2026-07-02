using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class AiTask : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    // Bug | Feature | Task | Analysis | Refactor | Review | Design
    public string Type { get; set; } = "Task";
    // Pending | Running | Completed | Failed | Cancelled
    public string Status { get; set; } = "Pending";
    public string? ResultText { get; set; }
    public string? ErrorMessage { get; set; }
    public int RunCount { get; set; } = 0;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid? RequestedByUserId { get; set; }

    public ICollection<AiTaskImage> Images { get; set; } = [];
}
