using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record RenewLicenseCommand(Guid Id, int Months) : IRequest<Result<DateTime>>;

public class RenewLicenseHandler(IApplicationDbContext db, ILicenseService licenseService)
    : IRequestHandler<RenewLicenseCommand, Result<DateTime>>
{
    public async Task<Result<DateTime>> Handle(RenewLicenseCommand request, CancellationToken cancellationToken)
    {
        if (request.Months is < 1 or > 36)
            return Result<DateTime>.Failure("Yenileme süresi 1–36 ay arasında olmalıdır.");

        var license = await db.Licenses
            .FirstOrDefaultAsync(l => l.Id == request.Id && !l.IsDeleted, cancellationToken);
        if (license is null)
            return Result<DateTime>.Failure("Lisans bulunamadı.");

        // Extend from today if expired, otherwise extend from current expiry
        var base_ = license.ExpiresAt < DateTime.UtcNow ? DateTime.UtcNow : license.ExpiresAt;
        license.ExpiresAt = base_.AddMonths(request.Months);
        license.IsActive  = true;

        await db.SaveChangesAsync(cancellationToken);
        await licenseService.InvalidateCacheAsync(cancellationToken);
        return Result<DateTime>.Success(license.ExpiresAt);
    }
}
