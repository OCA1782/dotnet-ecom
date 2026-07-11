using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class PreviewJob : BaseEntity
{
    public Guid ExternalSourceId { get; set; }
    public ExternalSource ExternalSource { get; set; } = null!;
    public Guid? RequestedByUserId { get; set; }
    // Queued | Processing | Completed | Failed | Cancelled
    public string Status { get; set; } = "Queued";
    public int TotalPages { get; set; }
    public int ProcessedPages { get; set; }
    public int TotalRows { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
