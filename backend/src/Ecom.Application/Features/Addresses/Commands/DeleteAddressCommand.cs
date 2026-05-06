using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Addresses.Commands;

public record DeleteAddressCommand(Guid AddressId, Guid UserId) : IRequest<Result>;

public class DeleteAddressHandler(IApplicationDbContext db) : IRequestHandler<DeleteAddressCommand, Result>
{
    public async Task<Result> Handle(DeleteAddressCommand request, CancellationToken cancellationToken)
    {
        var address = await db.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == request.AddressId && a.UserId == request.UserId, cancellationToken);

        if (address is null) return Result.Failure("Adres bulunamadı.");

        address.IsDeleted = true;
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
