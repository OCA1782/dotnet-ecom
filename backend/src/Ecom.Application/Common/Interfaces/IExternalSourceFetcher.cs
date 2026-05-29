using Ecom.Application.Features.Admin.Commands;
using Ecom.Domain.Entities;

namespace Ecom.Application.Common.Interfaces;

public interface IExternalSourceFetcher
{
    Task<FetchExternalSourceResult> FetchAsync(ExternalSource source, CancellationToken cancellationToken = default);
}
