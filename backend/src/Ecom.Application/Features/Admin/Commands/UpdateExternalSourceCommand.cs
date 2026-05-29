using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using static Ecom.Application.Features.Admin.Commands.CreateExternalSourceCommandHandler;

namespace Ecom.Application.Features.Admin.Commands;

public record UpdateExternalSourceCommand(
    Guid Id,
    string Name,
    string Type,
    string? Description,
    string? Config,
    bool IsActive,
    string FetchSchedule = "None",
    string? AutoImportTarget = null
) : IRequest<bool>;

public class UpdateExternalSourceCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateExternalSourceCommand, bool>
{
    public async Task<bool> Handle(UpdateExternalSourceCommand request, CancellationToken cancellationToken)
    {
        var source = await db.ExternalSources.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        if (source is null) return false;

        source.Name = request.Name;
        source.Type = request.Type;
        source.Description = request.Description;
        source.Config = request.Config;
        source.IsActive = request.IsActive;

        // Reschedule if schedule changed
        if (source.FetchSchedule != request.FetchSchedule)
        {
            source.FetchSchedule = request.FetchSchedule;
            source.NextScheduledFetchAt = ComputeNext(request.FetchSchedule);
        }

        source.AutoImportTarget = request.AutoImportTarget;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
