using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class UploadedFile : BaseEntity
{
    public string FileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? UploadedByEmail { get; set; }
    public string? EntityType { get; set; }   // product | category | brand | announcement | other
    public Guid? EntityId { get; set; }
    public string? EntityName { get; set; }
    public string? Notes { get; set; }
    public bool IsOrphaned { get; set; } = false;
}
