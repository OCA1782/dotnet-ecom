using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record GetExternalSourcesQuery : IRequest<List<ExternalSourceDto>>;

public record ExternalSourceDto(
    Guid Id,
    string Name,
    string? Code,
    string Type,
    string? Description,
    string? Config,
    bool IsActive,
    DateTime? LastFetchedAt,
    int? LastFetchedCount,
    string FetchSchedule,
    string? AutoImportTarget,
    DateTime? NextScheduledFetchAt,
    DateTime? LastAutoImportAt,
    DateTime CreatedDate,
    bool HasActiveJob,
    bool HasExcelFile
);

public class GetExternalSourcesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetExternalSourcesQuery, List<ExternalSourceDto>>
{
    public async Task<List<ExternalSourceDto>> Handle(GetExternalSourcesQuery request, CancellationToken cancellationToken)
    {
        return await db.ExternalSources
            .OrderByDescending(x => x.CreatedDate)
            .Select(x => new ExternalSourceDto(
                x.Id, x.Name, x.Code, x.Type, x.Description, x.Config,
                x.IsActive, x.LastFetchedAt, x.LastFetchedCount,
                x.FetchSchedule, x.AutoImportTarget,
                x.NextScheduledFetchAt, x.LastAutoImportAt,
                x.CreatedDate,
                db.ImportJobs.Any(j => j.ExternalSourceId == x.Id
                    && (j.Status == "Queued" || j.Status == "Processing")),
                x.LastExcelFilePath != null))
            .ToListAsync(cancellationToken);
    }
}
