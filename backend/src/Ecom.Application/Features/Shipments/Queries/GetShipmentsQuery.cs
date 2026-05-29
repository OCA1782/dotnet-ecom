using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Shipments.Queries;

public record ShipmentListItemDto(
    Guid Id,
    Guid OrderId,
    string OrderNumber,
    string? CustomerName,
    string? CustomerEmail,
    string CargoCompany,
    string? TrackingNumber,
    string? TrackingUrl,
    decimal ShippingCost,
    string Status,
    DateTime? ShippedDate,
    DateTime? DeliveredDate,
    DateTime CreatedDate
);

public record GetShipmentsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Status = null,
    string? Search = null
) : IRequest<PaginatedList<ShipmentListItemDto>>;

public class GetShipmentsHandler(IApplicationDbContext db)
    : IRequestHandler<GetShipmentsQuery, PaginatedList<ShipmentListItemDto>>
{
    public async Task<PaginatedList<ShipmentListItemDto>> Handle(GetShipmentsQuery request, CancellationToken ct)
    {
        var query = db.Shipments
            .Include(s => s.Order).ThenInclude(o => o.User)
            .Where(s => !s.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Status) &&
            Enum.TryParse<ShipmentStatus>(request.Status, out var statusEnum))
            query = query.Where(s => s.Status == statusEnum);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var q = request.Search.ToLower();
            query = query.Where(s =>
                (s.TrackingNumber != null && s.TrackingNumber.ToLower().Contains(q)) ||
                s.Order.OrderNumber.ToLower().Contains(q) ||
                s.CargoCompany.ToLower().Contains(q) ||
                (s.Order.GuestEmail != null && s.Order.GuestEmail.ToLower().Contains(q)) ||
                (s.Order.User != null && (s.Order.User.Name + " " + s.Order.User.Surname).ToLower().Contains(q)));
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(s => s.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(s => new ShipmentListItemDto(
                s.Id,
                s.OrderId,
                s.Order.OrderNumber,
                s.Order.User != null ? s.Order.User.Name + " " + s.Order.User.Surname : s.Order.GuestEmail,
                s.Order.User != null ? s.Order.User.Email : s.Order.GuestEmail,
                s.CargoCompany,
                s.TrackingNumber,
                s.TrackingUrl,
                s.ShippingCost,
                s.Status.ToString(),
                s.ShippedDate,
                s.DeliveredDate,
                s.CreatedDate
            ))
            .ToListAsync(ct);

        return PaginatedList<ShipmentListItemDto>.Create(items, total, request.Page, request.PageSize);
    }
}
