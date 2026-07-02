using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record GetExternalSourceImportLogsQuery(Guid SourceId) : IRequest<List<ImportLogDto>>;

public record ImportLogDto(
    Guid Id,
    string TargetEntity,
    int InsertedCount,
    int UpdatedCount,
    int SkippedCount,
    int DeletedCount,
    int RestoredCount,
    string? ErrorMessage,
    string? ImportedByUserEmail,
    DateTime CreatedDate,
    int TotalRows,
    string ConflictStrategy,
    // Live job tracking (IsJob=true → from ImportJob table, still in-progress)
    bool IsJob,
    string? JobStatus,   // Queued | Processing
    int? ProcessedRows,
    string? SkipDiagnosticsJson
);

public class GetExternalSourceImportLogsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetExternalSourceImportLogsQuery, List<ImportLogDto>>
{
    public async Task<List<ImportLogDto>> Handle(GetExternalSourceImportLogsQuery request, CancellationToken cancellationToken)
    {
        // Active/queued jobs — show as live entries at the top (not yet written to ExternalSourceImportLog)
        var activeJobs = await db.ImportJobs
            .Where(j => j.ExternalSourceId == request.SourceId
                     && (j.Status == "Queued" || j.Status == "Processing"))
            .OrderByDescending(j => j.CreatedDate)
            .Take(10)
            .Select(j => new ImportLogDto(
                j.Id, j.TargetEntity,
                j.InsertedCount, j.UpdatedCount, j.SkippedCount, 0, 0,
                j.ErrorMessage, null,
                j.CreatedDate, j.TotalRows, j.ConflictStrategy,
                true, j.Status, j.ProcessedRows, null))
            .ToListAsync(cancellationToken);

        // Completed import logs (written when job finishes or via direct import)
        var completedLogs = await db.ExternalSourceImportLogs
            .Where(l => l.ExternalSourceId == request.SourceId)
            .OrderByDescending(l => l.CreatedDate)
            .Take(50)
            .Select(l => new ImportLogDto(
                l.Id, l.TargetEntity,
                l.InsertedCount, l.UpdatedCount, l.SkippedCount, l.DeletedCount, l.RestoredCount,
                l.ErrorMessage,
                l.ImportedByUserId != null
                    ? db.Users.Where(u => u.Id == l.ImportedByUserId).Select(u => u.Email).FirstOrDefault()
                    : null,
                l.CreatedDate, l.TotalRows, l.ConflictStrategy,
                false, null, null, l.SkipDiagnosticsJson))
            .ToListAsync(cancellationToken);

        // Active jobs first, then completed logs
        return activeJobs.Concat(completedLogs).ToList();
    }
}
