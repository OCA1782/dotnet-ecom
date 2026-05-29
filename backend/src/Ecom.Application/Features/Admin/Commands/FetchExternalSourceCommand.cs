using Ecom.Application.Common.Interfaces;
using MediatR;

namespace Ecom.Application.Features.Admin.Commands;

public record FetchExternalSourceCommand(Guid SourceId) : IRequest<FetchExternalSourceResult>;

public record FetchExternalSourceResult(
    List<string> Columns,
    List<Dictionary<string, string>> Rows,
    string? Error = null
);

public class FetchExternalSourceCommandHandler(
    IApplicationDbContext db,
    IExternalSourceFetcher fetcher)
    : IRequestHandler<FetchExternalSourceCommand, FetchExternalSourceResult>
{
    public async Task<FetchExternalSourceResult> Handle(FetchExternalSourceCommand request, CancellationToken cancellationToken)
    {
        var source = await db.ExternalSources.FindAsync([request.SourceId], cancellationToken);
        if (source is null)
            return new FetchExternalSourceResult([], [], "Kaynak bulunamadı.");

        try
        {
            var result = await fetcher.FetchAsync(source, cancellationToken);

            source.LastFetchedAt = DateTime.UtcNow;
            source.LastFetchedCount = result.Rows.Count;
            await db.SaveChangesAsync(cancellationToken);

            return result;
        }
        catch (Exception ex)
        {
            return new FetchExternalSourceResult([], [], ex.Message);
        }
    }
}
