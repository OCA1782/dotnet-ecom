using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class ImportJob : BaseEntity
{
    public Guid ExternalSourceId { get; set; }
    public ExternalSource ExternalSource { get; set; } = null!;
    public string TargetEntity { get; set; } = string.Empty;
    // Claim Check store: serialized rows + field mapping kept here, NOT in the RabbitMQ message
    public string PayloadJson { get; set; } = string.Empty;
    public string FieldMappingJson { get; set; } = string.Empty;
    public string ConflictStrategy { get; set; } = "skip";
    public Guid? RequestedByUserId { get; set; }
    // Queued | Processing | Completed | Failed
    public string Status { get; set; } = "Queued";
    public int TotalRows { get; set; }
    public int ProcessedRows { get; set; }
    public int InsertedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int SkippedCount { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    // When true: products previously imported from this source but absent in this run are soft-deleted
    public bool SyncDelete { get; set; } = false;
}
