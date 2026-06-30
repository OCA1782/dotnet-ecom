using Ecom.Application.Common.Interfaces;
using Ecom.Application.Events;
using Ecom.Domain.Entities;
using MediatR;
using System.Text.Json;

namespace Ecom.Application.Features.Admin.Commands;

public record QueueFetchAndImportJobCommand(
    Guid SourceId,
    string TargetEntity,
    Dictionary<string, string> FieldMapping,
    string ConflictStrategy,
    Guid? RequestedByUserId,
    bool SyncDelete = false
) : IRequest<Guid>;

public class QueueFetchAndImportJobHandler(IApplicationDbContext db, IEventPublisher eventPublisher)
    : IRequestHandler<QueueFetchAndImportJobCommand, Guid>
{
    public async Task<Guid> Handle(QueueFetchAndImportJobCommand request, CancellationToken ct)
    {
        var job = new ImportJob
        {
            ExternalSourceId = request.SourceId,
            TargetEntity = request.TargetEntity,
            // Sentinel: consumer fetches rows directly from the source — no payload stored in DB
            PayloadJson = "FETCH_FROM_SOURCE",
            FieldMappingJson = JsonSerializer.Serialize(request.FieldMapping),
            ConflictStrategy = request.ConflictStrategy,
            RequestedByUserId = request.RequestedByUserId,
            TotalRows = 0, // updated by consumer once totalCount is read from source page 1
            Status = "Queued",
            SyncDelete = request.SyncDelete,
        };
        db.ImportJobs.Add(job);
        await db.SaveChangesAsync(ct);
        await eventPublisher.PublishAsync(new ImportJobQueuedMessage(job.Id), ct);
        return job.Id;
    }
}
