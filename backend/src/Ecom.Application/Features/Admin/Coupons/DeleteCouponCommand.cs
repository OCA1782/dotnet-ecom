using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;

namespace Ecom.Application.Features.Admin.Coupons;

public record DeleteCouponCommand(Guid Id) : IRequest<Result>;

public class DeleteCouponHandler(IApplicationDbContext db) : IRequestHandler<DeleteCouponCommand, Result>
{
    public async Task<Result> Handle(DeleteCouponCommand request, CancellationToken cancellationToken)
    {
        var coupon = await db.Coupons.FindAsync([request.Id], cancellationToken);
        if (coupon is null) return Result.Failure("Kupon bulunamadı.");

        coupon.IsDeleted = true;
        coupon.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
