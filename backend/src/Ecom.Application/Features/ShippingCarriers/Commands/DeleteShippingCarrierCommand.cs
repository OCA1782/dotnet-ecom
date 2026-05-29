using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.ShippingCarriers.Commands;

public record DeleteShippingCarrierCommand(Guid Id) : IRequest<Result>;

public class DeleteShippingCarrierHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteShippingCarrierCommand, Result>
{
    public async Task<Result> Handle(DeleteShippingCarrierCommand request, CancellationToken ct)
    {
        var carrier = await db.ShippingCarriers
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, ct);

        if (carrier is null) return Result.Failure("Kargo firması bulunamadı.");

        carrier.IsDeleted = true;
        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
