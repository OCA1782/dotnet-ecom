using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Orders.Queries;

public record OrderSummaryDto(
    Guid Id,
    string OrderNumber,
    OrderStatus Status,
    PaymentStatus PaymentStatus,
    ShipmentStatus ShipmentStatus,
    decimal GrandTotal,
    int ItemCount,
    DateTime CreatedDate
);

public record GetMyOrdersQuery(Guid UserId, int Page = 1, int PageSize = 10) : IRequest<PaginatedList<OrderSummaryDto>>;

public class GetMyOrdersHandler(IApplicationDbContext db) : IRequestHandler<GetMyOrdersQuery, PaginatedList<OrderSummaryDto>>
{
    public async Task<PaginatedList<OrderSummaryDto>> Handle(GetMyOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = db.Orders
            .Include(o => o.Items)
            .Where(o => o.UserId == request.UserId)
            .OrderByDescending(o => o.CreatedDate);

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
