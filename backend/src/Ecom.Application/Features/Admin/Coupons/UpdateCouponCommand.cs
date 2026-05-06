using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Coupons;

public class UpdateCouponCommand : IRequest<Result>
{
    public Guid Id { get; set; }
    public string? Description { get; set; }
    public decimal Value { get; set; }
    public decimal MinOrderAmount { get; set; }
    public int? MaxUsageCount { get; set; }
    public int? MaxUsagePerUser { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateCouponHandler(IApplicationDbContext db) : IRequestHandler<UpdateCouponCommand, Result>
{
    public async Task<Result> Handle(UpdateCouponCommand request, CancellationToken cancellationToken)
    {
        var coupon = await db.Coupons.FindAsync([request.Id], cancellationToken);
        if (coupon is null) return Result.Failure("Kupon bulunamadı.");

        coupon.Description = request.Description;
        coupon.Value = request.Value;
        coupon.MinOrderAmount = request.MinOrderAmount;
        coupon.MaxUsageCount = request.MaxUsageCount;
        coupon.MaxUsagePerUser = request.MaxUsagePerUser;
        coupon.StartDate = request.StartDate;
        coupon.EndDate = request.EndDate;
        coupon.IsActive = request.IsActive;

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
