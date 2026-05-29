using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Coupons;

public record CouponUsageDto(
    string Id,
    string CouponId,
    string CouponCode,
    string OrderId,
    string OrderNumber,
    decimal GrandTotal,
    string? UserEmail,
    decimal DiscountApplied,
    DateTime CreatedDate
);

public record GetCouponUsagesQuery(
    Guid? CouponId = null,
    int Page = 1,
    int PageSize = 30
) : IRequest<PaginatedList<CouponUsageDto>>;

public class GetCouponUsagesHandler(IApplicationDbContext db)
    : IRequestHandler<GetCouponUsagesQuery, PaginatedList<CouponUsageDto>>
{
    public async Task<PaginatedList<CouponUsageDto>> Handle(GetCouponUsagesQuery request, CancellationToken cancellationToken)
    {
        var query = db.CouponUsages
            .Include(cu => cu.Coupon)
            .Include(cu => cu.Order)
            .Include(cu => cu.User)
            .AsQueryable();

        if (request.CouponId.HasValue)
            query = query.Where(cu => cu.CouponId == request.CouponId.Value);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(cu => cu.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(cu => new CouponUsageDto(
                cu.Id.ToString(),
                cu.CouponId.ToString(),
                cu.Coupon.Code,
                cu.OrderId.ToString(),
                cu.Order.OrderNumber,
                cu.Order.GrandTotal,
                cu.User != null ? cu.User.Email : null,
                cu.DiscountApplied,
                cu.CreatedDate
            ))
            .ToListAsync(cancellationToken);

        return PaginatedList<CouponUsageDto>.Create(items, total, request.Page, request.PageSize);
    }
}
