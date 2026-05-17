using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Orders.Queries;

public record ExportOrderRowDto(
    string OrderNumber,
    string CreatedDate,
    string Status,
    string PaymentStatus,
    string ShipmentStatus,
    int ItemCount,
    decimal GrandTotal,
    string CustomerEmail
);

public record ExportAdminOrdersQuery(
    OrderStatus? Status = null,
    DateTime? From = null,
    DateTime? To = null,
    string? Search = null
) : IRequest<IEnumerable<ExportOrderRowDto>>;

public class ExportAdminOrdersHandler(IApplicationDbContext db)
    : IRequestHandler<ExportAdminOrdersQuery, IEnumerable<ExportOrderRowDto>>
{
    private static readonly Dictionary<OrderStatus, string> StatusLabels = new()
    {
        [OrderStatus.Created]          = "Oluşturuldu",
        [OrderStatus.PaymentPending]   = "Ödeme Bekleniyor",
        [OrderStatus.PaymentCompleted] = "Ödeme Tamamlandı",
        [OrderStatus.Preparing]        = "Hazırlanıyor",
        [OrderStatus.Shipped]          = "Kargoya Verildi",
        [OrderStatus.Delivered]        = "Teslim Edildi",
        [OrderStatus.Completed]        = "Tamamlandı",
        [OrderStatus.Cancelled]        = "İptal Edildi",
        [OrderStatus.RefundRequested]  = "İade Talep Edildi",
        [OrderStatus.Refunded]         = "İade Edildi",
        [OrderStatus.Failed]           = "Başarısız",
        [OrderStatus.OnHold]           = "Askıya Alındı",
    };

    private static readonly Dictionary<PaymentStatus, string> PaymentLabels = new()
    {
        [PaymentStatus.Pending]           = "Bekliyor",
        [PaymentStatus.Paid]              = "Ödendi",
        [PaymentStatus.Failed]            = "Başarısız",
        [PaymentStatus.Refunded]          = "İade",
        [PaymentStatus.Cancelled]         = "İptal",
        [PaymentStatus.PartiallyRefunded] = "Kısmi İade",
    };

    private static readonly Dictionary<ShipmentStatus, string> ShipmentLabels = new()
    {
        [ShipmentStatus.NotShipped]     = "Kargo Yok",
        [ShipmentStatus.Preparing]      = "Hazırlanıyor",
        [ShipmentStatus.Shipped]        = "Kargoda",
        [ShipmentStatus.InTransit]      = "Yolda",
        [ShipmentStatus.Delivered]      = "Teslim Edildi",
        [ShipmentStatus.FailedDelivery] = "Teslim Edilemedi",
        [ShipmentStatus.Returned]       = "İade",
    };

    public async Task<IEnumerable<ExportOrderRowDto>> Handle(ExportAdminOrdersQuery request, CancellationToken ct)
    {
        var query = db.Orders.Include(o => o.Items).AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(o => o.Status == request.Status);

        if (request.From.HasValue)
            query = query.Where(o => o.CreatedDate >= request.From.Value);

        if (request.To.HasValue)
            query = query.Where(o => o.CreatedDate <= request.To.Value.AddDays(1));

        if (!string.IsNullOrEmpty(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(o => o.OrderNumber.Contains(s) || (o.GuestEmail != null && o.GuestEmail.Contains(s)));
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedDate)
            .Take(5000)
            .Select(o => new
            {
                o.OrderNumber, o.CreatedDate, o.Status, o.PaymentStatus,
                o.ShipmentStatus, o.GrandTotal, o.Items.Count, o.GuestEmail, o.UserId
            })
            .ToListAsync(ct);

        var userIds = orders.Where(o => o.UserId.HasValue).Select(o => o.UserId!.Value).Distinct().ToList();
        var userEmails = await db.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Email, ct);

        return orders.Select(o => new ExportOrderRowDto(
            o.OrderNumber,
            o.CreatedDate.ToString("yyyy-MM-dd HH:mm"),
            StatusLabels.GetValueOrDefault(o.Status, o.Status.ToString()),
            PaymentLabels.GetValueOrDefault(o.PaymentStatus, o.PaymentStatus.ToString()),
            ShipmentLabels.GetValueOrDefault(o.ShipmentStatus, o.ShipmentStatus.ToString()),
            o.Count,
            o.GrandTotal,
            o.UserId.HasValue ? userEmails.GetValueOrDefault(o.UserId.Value, "") : (o.GuestEmail ?? "")
        ));
    }
}
