using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class DeployLog : BaseEntity
{
    public Guid ServerId { get; set; }
    public DeployServer Server { get; set; } = null!;
    public string? TriggeredBy { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }
    public string Status { get; set; } = "running"; // running/success/failed
    public string? FullLog { get; set; }
    public int? DurationSeconds { get; set; }
    public string? ErrorMessage { get; set; }
    public string? CommitHash { get; set; }
    public string Branch { get; set; } = "main";
}
