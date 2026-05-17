using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record GetSettingsQuery : IRequest<Dictionary<string, string>>;

public class GetSettingsHandler(IApplicationDbContext db)
    : IRequestHandler<GetSettingsQuery, Dictionary<string, string>>
{
    public async Task<Dictionary<string, string>> Handle(GetSettingsQuery request, CancellationToken cancellationToken)
    {
        return await db.SiteSettings
            .ToDictionaryAsync(s => s.Key, s => s.Value, cancellationToken);
    }
}
