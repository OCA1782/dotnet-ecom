namespace Ecom.Domain.Entities;

public class JobLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string JobName { get; set; } = "";
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public string Status { get; set; } = "running"; // running / success / failed
    public string Output { get; set; } = "";
    public string? ErrorMessage { get; set; }
    public int? DurationMs { get; set; }
    public bool IsManualTrigger { get; set; }
}
