using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record GetImportJobStatusQuery(Guid JobId) : IRequest<ImportJobStatusDto?>;

public record ImportJobStatusDto(
    Guid Id,
    string Status,
    string TargetEntity,
    int TotalRows,
    int ProcessedRows,
    int InsertedCount,
    int UpdatedCount,
    int SkippedCount,
    string? ErrorMessage,
    DateTime? StartedAt,
    DateTime? CompletedAt
);

public class GetImportJobStatusQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetImportJobStatusQuery, ImportJobStatusDto?>
{
    public async Task<ImportJobStatusDto?> Handle(GetImportJobStatusQuery request, CancellationToken ct)
    {
        var job = await db.ImportJobs
            .AsNoTracking()
            .Where(j => j.Id == request.JobId)
            .Select(j => new ImportJobStatusDto(
                j.Id, j.Status, j.TargetEntity,
                j.TotalRows, j.ProcessedRows,
                j.InsertedCount, j.UpdatedCount, j.SkippedCount,
                j.ErrorMessage, j.StartedAt, j.CompletedAt))
            .FirstOrDefaultAsync(ct);
        return job;
    }
}
