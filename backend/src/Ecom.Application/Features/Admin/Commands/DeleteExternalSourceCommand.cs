using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record DeleteExternalSourceCommand(Guid Id) : IRequest<bool>;

public class DeleteExternalSourceCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteExternalSourceCommand, bool>
{
    public async Task<bool> Handle(DeleteExternalSourceCommand request, CancellationToken cancellationToken)
    {
        var source = await db.ExternalSources.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        if (source is null) return false;

        // Cancel any active import jobs for this source before deleting
        var activeJobs = await db.ImportJobs
            .Where(j => j.ExternalSourceId == request.Id
                     && (j.Status == "Queued" || j.Status == "Processing"))
            .ToListAsync(cancellationToken);

        foreach (var job in activeJobs)
        {
            job.Status = "Cancelled";
            job.CompletedAt = DateTime.UtcNow;
            job.ErrorMessage = "Kaynak silindi.";
        }

        db.ExternalSources.Remove(source);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
