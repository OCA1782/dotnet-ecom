using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Queries;

public record ActivityItem(
    string Type,       // "audit" | "error" | "order" | "invoice"
    string Action,
    string? Detail,
    DateTime Timestamp
);

public record GetDocsActivityQuery(int Limit = 60) : IRequest<List<ActivityItem>>;

public class GetDocsActivityHandler(IApplicationDbContext db)
    : IRequestHandler<GetDocsActivityQuery, List<ActivityItem>>
{
    public async Task<List<ActivityItem>> Handle(GetDocsActivityQuery request, CancellationToken ct)
    {
        var take = Math.Min(request.Limit, 200);
        var items = new List<ActivityItem>();

        // Recent audit logs (actions: Create, Update, Delete, Login, etc.)
        var audits = await db.AuditLogs
            .Where(a => !a.IsDeleted)
            .OrderByDescending(a => a.CreatedDate)
            .Take(take)
            .Select(a => new { a.Action, a.EntityName, a.EntityId, a.IpAddress, a.CreatedDate })
            .ToListAsync(ct);

        items.AddRange(audits.Select(a => new ActivityItem(
            "audit",
            a.Action,
            $"{a.EntityName}{(a.EntityId != null ? $" [{a.EntityId[..Math.Min(8, a.EntityId.Length)]}]" : "")}{(a.IpAddress != null ? $" — {a.IpAddress}" : "")}",
            a.CreatedDate)));

        // Recent error logs
        var errors = await db.ErrorLogs
            .Where(e => !e.IsDeleted)
            .OrderByDescending(e => e.CreatedDate)
            .Take(20)
            .Select(e => new { e.Message, e.Path, e.CreatedDate })
            .ToListAsync(ct);

        items.AddRange(errors.Select(e => new ActivityItem(
            "error",
            "Sistem Hatası",
            $"{(e.Message != null && e.Message.Length > 100 ? e.Message[..100] + "…" : e.Message)} [{e.Path}]",
            e.CreatedDate)));

        // Recent order status changes
        var orderHistory = await db.OrderStatusHistories
            .Include(h => h.Order)
            .OrderByDescending(h => h.CreatedDate)
            .Take(30)
            .Select(h => new {
                OrderNumber = h.Order.OrderNumber,
                From = (int)h.FromStatus,
                To = (int)h.ToStatus,
                h.Note,
                h.CreatedDate
            })
            .ToListAsync(ct);

        items.AddRange(orderHistory.Select(h => new ActivityItem(
            "order",
            "Sipariş Durumu Değişti",
            $"{h.OrderNumber}: Durum {h.From} → {h.To}{(h.Note != null ? " — " + h.Note : "")}",
            h.CreatedDate)));

        // Recent invoices
        var invoices = await db.Invoices
            .Where(i => !i.IsDeleted)
            .OrderByDescending(i => i.CreatedDate)
            .Take(20)
            .Select(i => new { i.InvoiceNumber, i.Status, i.DocType, i.CreatedDate })
            .ToListAsync(ct);

        items.AddRange(invoices.Select(i => new ActivityItem(
            "invoice",
            "Fatura",
            $"{i.InvoiceNumber} ({i.DocType}) — {i.Status}",
            i.CreatedDate)));

        return [.. items.OrderByDescending(x => x.Timestamp).Take(take)];
    }
}
