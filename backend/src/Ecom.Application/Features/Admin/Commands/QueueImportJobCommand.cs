using Ecom.Application.Common.Interfaces;
using Ecom.Application.Events;
using Ecom.Domain.Entities;
using MediatR;
using System.Text.Json;

namespace Ecom.Application.Features.Admin.Commands;

public record QueueImportJobCommand(
    Guid SourceId,
    string TargetEntity,
    List<Dictionary<string, string>> Rows,
    Dictionary<string, string> FieldMapping,
    string ConflictStrategy,
    Guid? RequestedByUserId
) : IRequest<Guid>;

public class QueueImportJobCommandHandler(IApplicationDbContext db, IEventPublisher eventPublisher)
    : IRequestHandler<QueueImportJobCommand, Guid>
{
    public async Task<Guid> Handle(QueueImportJobCommand request, CancellationToken ct)
    {
        var job = new ImportJob
        {
            ExternalSourceId = request.SourceId,
            TargetEntity = request.TargetEntity,
            // Claim Check: full payload stored in DB, only JobId will travel in the message
            PayloadJson = JsonSerializer.Serialize(request.Rows),
            FieldMappingJson = JsonSerializer.Serialize(request.FieldMapping),
            ConflictStrategy = request.ConflictStrategy,
            RequestedByUserId = request.RequestedByUserId,
            TotalRows = request.Rows.Count,
            Status = "Queued",
        };
        db.ImportJobs.Add(job);
        await db.SaveChangesAsync(ct);

        // Publish Claim Check ticket via Outbox → RabbitMQ
        await eventPublisher.PublishAsync(new ImportJobQueuedMessage(job.Id), ct);
        return job.Id;
    }
}
