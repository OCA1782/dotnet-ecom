using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record DeleteLicenseCommand(Guid Id) : IRequest<Result>;

public class DeleteLicenseHandler(IApplicationDbContext db, ILicenseService licenseService)
    : IRequestHandler<DeleteLicenseCommand, Result>
{
    public async Task<Result> Handle(DeleteLicenseCommand request, CancellationToken cancellationToken)
    {
        var license = await db.Licenses
            .FirstOrDefaultAsync(l => l.Id == request.Id && !l.IsDeleted, cancellationToken);
        if (license is null)
            return Result.Failure("Lisans bulunamadı.");

        license.IsDeleted = true;
        await db.SaveChangesAsync(cancellationToken);
        await licenseService.InvalidateCacheAsync(cancellationToken);
        return Result.Success();
    }
}
