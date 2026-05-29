using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record CancelImportJobCommand(Guid JobId) : IRequest<bool>;

public class CancelImportJobCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CancelImportJobCommand, bool>
{
    public async Task<bool> Handle(CancelImportJobCommand request, CancellationToken ct)
    {
        var job = await db.ImportJobs
            .FirstOrDefaultAsync(j => j.Id == request.JobId
                && (j.Status == "Queued" || j.Status == "Processing"), ct);

        if (job is null) return false;

        job.Status = "Cancelled";
        job.CompletedAt = DateTime.UtcNow;
        job.ErrorMessage = "Kullanıcı tarafından iptal edildi.";

        // Write import log so history tab shows the cancellation
        db.ExternalSourceImportLogs.Add(new ExternalSourceImportLog
        {
            ExternalSourceId = job.ExternalSourceId,
            TargetEntity = job.TargetEntity,
            InsertedCount = job.InsertedCount,
            UpdatedCount = job.UpdatedCount,
            SkippedCount = job.SkippedCount,
            ErrorMessage = "İptal edildi.",
            ImportedByUserId = job.RequestedByUserId,
            TotalRows = job.TotalRows,
            ConflictStrategy = job.ConflictStrategy,
        });

        await db.SaveChangesAsync(ct);
        return true;
    }
}
