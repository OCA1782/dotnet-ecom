using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record GetLicensesQuery : IRequest<List<LicenseDto>>;

public record LicenseDto(
    Guid Id,
    string Module,
    string LicenseKey,
    string? Description,
    DateTime ExpiresAt,
    bool IsActive,
    string? Notes,
    bool IsExpired,
    int DaysRemaining
);

public class GetLicensesHandler(IApplicationDbContext db)
    : IRequestHandler<GetLicensesQuery, List<LicenseDto>>
{
    public async Task<List<LicenseDto>> Handle(GetLicensesQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        return await db.Licenses
            .Where(l => !l.IsDeleted)
            .OrderBy(l => l.Module)
            .Select(l => new LicenseDto(
                l.Id,
                l.Module,
                l.LicenseKey,
                l.Description,
                l.ExpiresAt,
                l.IsActive,
                l.Notes,
                l.ExpiresAt < now,
                (int)(l.ExpiresAt - now).TotalDays))
            .ToListAsync(cancellationToken);
    }
}
