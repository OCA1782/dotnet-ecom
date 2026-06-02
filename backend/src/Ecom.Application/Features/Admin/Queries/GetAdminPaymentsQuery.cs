using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record AdminPaymentDto(
    Guid Id,
    string OrderNumber,
    string CustomerName,
    string? CustomerEmail,
    string PaymentProvider,
    string PaymentMethod,
    decimal Amount,
    string Currency,
    string Status,
    string? TransactionId,
    DateTime? PaidDate,
    string? ErrorMessage,
    DateTime CreatedDate,
    string? DataSource = null
);

public record AdminPaymentLogDto(
    Guid Id,
    string FromStatus,
    string ToStatus,
    string? Note,
    DateTime CreatedDate
);

public record GetAdminPaymentsQuery(string? Status, int Page, int PageSize) : IRequest<(IEnumerable<AdminPaymentDto> Items, int Total)>;
public record GetAdminPaymentLogsQuery(Guid PaymentId) : IRequest<(string OrderNumber, IEnumerable<AdminPaymentLogDto> Logs)>;

public class GetAdminPaymentsHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminPaymentsQuery, (IEnumerable<AdminPaymentDto> Items, int Total)>
{
    private static readonly Dictionary<OrderStatus, string> STATUS_LABELS = new()
    {
        [OrderStatus.Created] = "Oluşturuldu",
        [OrderStatus.PaymentPending] = "Ödeme Bekliyor",
        [OrderStatus.PaymentCompleted] = "Ödendi",
        [OrderStatus.Preparing] = "Hazırlanıyor",
        [OrderStatus.Shipped] = "Kargoya Verildi",
        [OrderStatus.Delivered] = "Teslim Edildi",
        [OrderStatus.Completed] = "Tamamlandı",
        [OrderStatus.Cancelled] = "İptal Edildi",
        [OrderStatus.RefundRequested] = "İade Talep Edildi",
        [OrderStatus.Refunded] = "İade Edildi",
        [OrderStatus.Failed] = "Başarısız",
        [OrderStatus.OnHold] = "Askıya Alındı",
    };

    public async Task<(IEnumerable<AdminPaymentDto> Items, int Total)> Handle(
        GetAdminPaymentsQuery request, CancellationToken ct)
    {
        var query = db.Payments
            .Include(p => p.Order).ThenInclude(o => o.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<PaymentStatus>(request.Status, true, out var statusEnum))
            query = query.Where(p => p.Status == statusEnum);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(p => p.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new AdminPaymentDto(
                p.Id,
                p.Order.OrderNumber,
                p.Order.User != null
                    ? $"{p.Order.User.Name} {p.Order.User.Surname}"
                    : (p.Order.GuestEmail ?? "Misafir"),
                p.Order.User != null ? p.Order.User.Email : p.Order.GuestEmail,
                p.PaymentProvider,
                p.PaymentMethod.ToString(),
                p.Amount,
                p.Currency,
                p.Status.ToString(),
                p.TransactionId,
                p.PaidDate,
                p.ErrorMessage,
                p.CreatedDate,
                p.DataSource
            ))
            .ToListAsync(ct);

        return (items, total);
    }
}

public class GetAdminPaymentLogsHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminPaymentLogsQuery, (string OrderNumber, IEnumerable<AdminPaymentLogDto> Logs)>
{
    private static readonly Dictionary<OrderStatus, string> STATUS_LABELS = new()
    {
        [OrderStatus.Created] = "Oluşturuldu",
        [OrderStatus.PaymentPending] = "Ödeme Bekliyor",
        [OrderStatus.PaymentCompleted] = "Ödendi",
        [OrderStatus.Preparing] = "Hazırlanıyor",
        [OrderStatus.Shipped] = "Kargoya Verildi",
        [OrderStatus.Delivered] = "Teslim Edildi",
        [OrderStatus.Completed] = "Tamamlandı",
        [OrderStatus.Cancelled] = "İptal Edildi",
        [OrderStatus.RefundRequested] = "İade Talep Edildi",
        [OrderStatus.Refunded] = "İade Edildi",
        [OrderStatus.Failed] = "Başarısız",
        [OrderStatus.OnHold] = "Askıya Alındı",
    };

    public async Task<(string OrderNumber, IEnumerable<AdminPaymentLogDto> Logs)> Handle(
        GetAdminPaymentLogsQuery request, CancellationToken ct)
    {
        var payment = await db.Payments
            .Include(p => p.Order).ThenInclude(o => o.StatusHistory)
            .FirstOrDefaultAsync(p => p.Id == request.PaymentId, ct);

        if (payment == null) return ("?", []);

        var logs = payment.Order.StatusHistory
            .OrderBy(h => h.CreatedDate)
            .Select(h => new AdminPaymentLogDto(
                h.Id,
                STATUS_LABELS.GetValueOrDefault(h.FromStatus, h.FromStatus.ToString()),
                STATUS_LABELS.GetValueOrDefault(h.ToStatus, h.ToStatus.ToString()),
                h.Note,
                h.CreatedDate
            ));

        return (payment.Order.OrderNumber, logs);
    }
}
