using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Ecom.Application.Features.Admin.Commands;

public record ImportExternalSourceCommand(
    Guid SourceId,
    string TargetEntity,
    List<Dictionary<string, string>> Rows,
    Dictionary<string, string> FieldMapping,
    string ConflictStrategy,
    Guid? ImportedByUserId
) : IRequest<ImportExternalSourceResult>;

public record ImportExternalSourceResult(
    int InsertedCount,
    int UpdatedCount,
    int SkippedCount,
    string? Error = null,
    Dictionary<string, int>? SkipReasons = null
);

public class ImportExternalSourceCommandHandler(IApplicationDbContext db, ImportBatchProcessor processor)
    : IRequestHandler<ImportExternalSourceCommand, ImportExternalSourceResult>
{
    public async Task<ImportExternalSourceResult> Handle(ImportExternalSourceCommand request, CancellationToken cancellationToken)
    {
        var source = await db.ExternalSources.FindAsync([request.SourceId], cancellationToken);
        if (source is null)
            return new ImportExternalSourceResult(0, 0, 0, "Kaynak bulunamadı.");

        int inserted = 0, updated = 0, skipped = 0;
        string? error = null;
        Dictionary<string, int>? skipReasons = null;

        try
        {
            (inserted, updated, skipped, skipReasons) = await processor.ProcessAsync(
                request.TargetEntity, request.Rows, request.FieldMapping, request.ConflictStrategy, cancellationToken, request.SourceId);
        }
        catch (Exception ex)
        {
            error = ex.Message;
        }

        db.ExternalSourceImportLogs.Add(new ExternalSourceImportLog
        {
            ExternalSourceId = request.SourceId,
            TargetEntity = request.TargetEntity,
            InsertedCount = inserted,
            UpdatedCount = updated,
            SkippedCount = skipped,
            ErrorMessage = error,
            ImportedByUserId = request.ImportedByUserId,
            TotalRows = request.Rows.Count,
            ConflictStrategy = request.ConflictStrategy,
            SkipDiagnosticsJson = skipReasons is { Count: > 0 }
                ? JsonSerializer.Serialize(skipReasons) : null,
        });
        await db.SaveChangesAsync(cancellationToken);

        return new ImportExternalSourceResult(inserted, updated, skipped, error, skipReasons);
    }
}
