using System.ComponentModel.DataAnnotations;
using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class ExternalSource : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    [MaxLength(50)]
    public string? Code { get; set; } // Short display ID, e.g. "CIQNP", "EXCEL1"
    public string Type { get; set; } = "Excel"; // Excel | RestApi
    public string? Description { get; set; }
    public string? Config { get; set; } // JSON: { url, headers, fieldMapping }
    public bool IsActive { get; set; } = true;
    public DateTime? LastFetchedAt { get; set; }
    public int? LastFetchedCount { get; set; }

    // Scheduled auto-fetch: None | Hourly | Daily | Weekly
    public string FetchSchedule { get; set; } = "None";
    public string? AutoImportTarget { get; set; }
    public DateTime? NextScheduledFetchAt { get; set; }
    public DateTime? LastAutoImportAt { get; set; }
    // Path to the last uploaded Excel file — used to re-parse preview after page refresh
    public string? LastExcelFilePath { get; set; }

    public ICollection<ExternalSourceImportLog> ImportLogs { get; set; } = new List<ExternalSourceImportLog>();
}

public class ExternalSourceImportLog : BaseEntity
{
    public Guid ExternalSourceId { get; set; }
    public ExternalSource ExternalSource { get; set; } = null!;
    public string TargetEntity { get; set; } = string.Empty; // Product | Category | Brand | Stock
    public int InsertedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int SkippedCount { get; set; }
    public string? ErrorMessage { get; set; }
    public Guid? ImportedByUserId { get; set; }
    public int TotalRows { get; set; }
    public string ConflictStrategy { get; set; } = "skip";
    // JSON: {"Kategori bulunamadı: Elektronik": 5, "Fiyat geçersiz": 2}
    public string? SkipDiagnosticsJson { get; set; }
    // Populated when SyncDelete was active: count of products soft-deleted because they were absent from the source
    public int DeletedCount { get; set; }
}
