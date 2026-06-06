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

public class GetNotificationsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetNotificationsQuery, NotificationsDto>
{
    public async Task<NotificationsDto> Handle(GetNotificationsQuery request, CancellationToken ct)
    {
        var items = new List<NotificationItemDto>();
        var since = DateTime.UtcNow.AddHours(-24);
        var isSuperAdmin = currentUser.IsSuperAdmin;
        var adminId = currentUser.UserId;

        List<Guid> managedUserIds = [];
        if (!isSuperAdmin && adminId.HasValue)
            managedUserIds = await db.Users
                .Where(u => u.CreatedByAdminId == adminId.Value || u.Id == adminId.Value)
                .Select(u => u.Id)
                .ToListAsync(ct);

        // Yeni siparişler (son 24 saat, ödeme bekleyen veya oluşturuldu)
        var ordersQ = db.Orders
            .Where(o => !o.IsDeleted
                && o.CreatedDate >= since
                && (o.Status == OrderStatus.Created || o.Status == OrderStatus.PaymentPending));

        if (!isSuperAdmin && managedUserIds.Count > 0)
            ordersQ = ordersQ.Where(o => o.UserId != null && managedUserIds.Contains(o.UserId.Value));
        else if (!isSuperAdmin)
            ordersQ = ordersQ.Where(_ => false);

        var newOrders = await ordersQ
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
        var stockQ = db.Stocks
            .Where(s => !s.IsDeleted
                && s.ProductId != null
                && (s.Quantity - s.ReservedQuantity) <= s.CriticalStockLevel)
            .Include(s => s.Product)
            .Where(s => s.Product != null && !s.Product.IsDeleted && s.Product.IsActive);

        if (!isSuperAdmin && adminId.HasValue)
            stockQ = stockQ.Where(s => s.Product!.CreatedByAdminId == adminId.Value);

        var lowStock = await stockQ
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
        var reviewQ = db.ProductReviews.Where(r => !r.IsDeleted && !r.IsApproved);
        if (!isSuperAdmin && adminId.HasValue)
            reviewQ = reviewQ.Where(r => r.Product!.CreatedByAdminId == adminId.Value);

        var pendingReviews = await reviewQ.CountAsync(ct);

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
