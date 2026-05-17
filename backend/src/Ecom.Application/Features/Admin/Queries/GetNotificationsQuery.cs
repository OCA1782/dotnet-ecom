using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record NotificationItemDto(
    string Type,
    string Title,
    string Body,
    string Link,
    DateTime CreatedAt
);

public record NotificationsDto(
    int TotalCount,
    IEnumerable<NotificationItemDto> Items
);

public record GetNotificationsQuery : IRequest<NotificationsDto>;

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, NotificationsDto>
{
    private readonly IApplicationDbContext _context;

    public GetNotificationsQueryHandler(IApplicationDbContext context)
        => _context = context;

    public async Task<NotificationsDto> Handle(GetNotificationsQuery request, CancellationToken ct)
    {
        var items = new List<NotificationItemDto>();
        var since = DateTime.UtcNow.AddHours(-24);

        // Yeni siparişler (son 24 saat, ödeme bekleyen veya oluşturuldu)
        var newOrders = await _context.Orders
            .Where(o => !o.IsDeleted
                && o.CreatedDate >= since
                && (o.Status == OrderStatus.Created || o.Status == OrderStatus.PaymentPending))
            .OrderByDescending(o => o.CreatedDate)
            .Take(10)
            .Select(o => new { o.OrderNumber, o.GrandTotal, o.CreatedDate })
            .ToListAsync(ct);

        foreach (var o in newOrders)
            items.Add(new NotificationItemDto(
                "order",
                "Yeni Sipariş",
                $"{o.OrderNumber} — ₺{o.GrandTotal:N2}",
                $"/siparisler/{o.OrderNumber}",
                o.CreatedDate
            ));

        // Kritik stok altı ürünler
        var lowStock = await _context.Stocks
            .Where(s => !s.IsDeleted
                && s.ProductId != null
                && (s.Quantity - s.ReservedQuantity) <= s.CriticalStockLevel)
            .Include(s => s.Product)
            .Where(s => s.Product != null && !s.Product.IsDeleted && s.Product.IsActive)
            .OrderBy(s => s.Quantity - s.ReservedQuantity)
            .Take(10)
            .Select(s => new
            {
                s.Product!.Name,
                Available = s.Quantity - s.ReservedQuantity,
                s.CriticalStockLevel
            })
            .ToListAsync(ct);

        foreach (var s in lowStock)
            items.Add(new NotificationItemDto(
                "stock",
                "Düşük Stok",
                $"{s.Name} — {s.Available} adet kaldı (eşik: {s.CriticalStockLevel})",
                "/stok",
                DateTime.UtcNow
            ));

        // Onay bekleyen yorumlar
        var pendingReviews = await _context.ProductReviews
            .CountAsync(r => !r.IsDeleted && !r.IsApproved, ct);

        if (pendingReviews > 0)
            items.Add(new NotificationItemDto(
                "review",
                "Bekleyen Yorum",
                $"{pendingReviews} yorum onay bekliyor",
                "/yorumlar",
                DateTime.UtcNow
            ));

        var ordered = items.OrderByDescending(n => n.CreatedAt).ToList();
        return new NotificationsDto(ordered.Count, ordered);
    }
}
