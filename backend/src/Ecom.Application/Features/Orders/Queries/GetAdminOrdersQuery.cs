using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Orders.Queries;

public record GetAdminOrdersQuery(
    int Page = 1,
    int PageSize = 20,
    OrderStatus? Status = null,
    string? Search = null
) : IRequest<PaginatedList<OrderSummaryDto>>;

public class GetAdminOrdersHandler(IApplicationDbContext db) : IRequestHandler<GetAdminOrdersQuery, PaginatedList<OrderSummaryDto>>
{
    public async Task<PaginatedList<OrderSummaryDto>> Handle(GetAdminOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = db.Orders
            .Include(o => o.Items)
            .AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(o => o.Status == request.Status);

        if (!string.IsNullOrEmpty(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(o =>
                o.OrderNumber.Contains(search) ||
                (o.GuestEmail != null && o.GuestEmail.Contains(search)));
        }

        query = query.OrderByDescending(o => o.CreatedDate);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new OrderSummaryDto(
                o.Id, o.OrderNumber, o.Status, o.PaymentStatus, o.ShipmentStatus,
                o.GrandTotal, o.Items.Count, o.CreatedDate))
            .ToListAsync(cancellationToken);

        return PaginatedList<OrderSummaryDto>.Create(items, totalCount, request.Page, request.PageSize);
    }
}
