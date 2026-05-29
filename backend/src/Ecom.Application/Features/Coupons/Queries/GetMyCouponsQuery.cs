using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Coupons.Queries;

public record MyCouponUsageDto(
    Guid UsageId,
    string CouponCode,
    string? Description,
    CouponType Type,
    decimal Value,
    decimal DiscountApplied,
    string OrderNumber,
    DateTime UsedDate
);

public record GetMyCouponsQuery(Guid UserId, int Page = 1, int PageSize = 10)
    : IRequest<PaginatedList<MyCouponUsageDto>>;

public class GetMyCouponsHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyCouponsQuery, PaginatedList<MyCouponUsageDto>>
{
    public async Task<PaginatedList<MyCouponUsageDto>> Handle(GetMyCouponsQuery request, CancellationToken cancellationToken)
    {
        var query = db.CouponUsages
            .Include(cu => cu.Coupon)
            .Include(cu => cu.Order)
            .Where(cu => cu.UserId == request.UserId)
            .OrderByDescending(cu => cu.CreatedDate);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(cu => new MyCouponUsageDto(
                cu.Id,
                cu.Coupon.Code,
                cu.Coupon.Description,
                cu.Coupon.Type,
                cu.Coupon.Value,
                cu.DiscountApplied,
                cu.Order.OrderNumber,
                cu.CreatedDate))
            .ToListAsync(cancellationToken);

        return PaginatedList<MyCouponUsageDto>.Create(items, totalCount, request.Page, request.PageSize);
    }
}
