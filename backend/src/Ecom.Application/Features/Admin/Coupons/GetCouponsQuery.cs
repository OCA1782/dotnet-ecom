using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Coupons;

public record GetCouponsQuery(int Page = 1, int PageSize = 20, bool IncludeInactive = false, string? Search = null, int? Type = null)
    : IRequest<PaginatedList<CouponDto>>;

public record CouponDto(
    Guid Id,
    string Code,
    string? Description,
    CouponType Type,
    decimal Value,
    decimal MinOrderAmount,
    int? MaxUsageCount,
    int? MaxUsagePerUser,
    int UsageCount,
    DateTime? StartDate,
    DateTime? EndDate,
    bool IsActive
);

public class GetCouponsHandler(IApplicationDbContext db) : IRequestHandler<GetCouponsQuery, PaginatedList<CouponDto>>
{
    public async Task<PaginatedList<CouponDto>> Handle(GetCouponsQuery request, CancellationToken cancellationToken)
    {
        var query = db.Coupons.AsQueryable();
        if (!request.IncludeInactive) query = query.Where(c => c.IsActive);
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(c => c.Code.Contains(request.Search) || (c.Description != null && c.Description.Contains(request.Search)));
        if (request.Type.HasValue)
            query = query.Where(c => (int)c.Type == request.Type.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(c => c.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CouponDto(
                c.Id, c.Code, c.Description, c.Type, c.Value,
                c.MinOrderAmount, c.MaxUsageCount, c.MaxUsagePerUser,
                c.UsageCount, c.StartDate, c.EndDate, c.IsActive))
            .ToListAsync(cancellationToken);

        return PaginatedList<CouponDto>.Create(items, total, request.Page, request.PageSize);
    }
}
