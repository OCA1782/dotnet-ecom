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

public class GetDocsActivityHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetDocsActivityQuery, List<ActivityItem>>
{
    public async Task<List<ActivityItem>> Handle(GetDocsActivityQuery request, CancellationToken ct)
    {
        var take = Math.Min(request.Limit, 200);
        var items = new List<ActivityItem>();
        var isSuperAdmin = currentUser.IsSuperAdmin;
        var adminId = currentUser.UserId;

        List<string> managedEmails = [];
        List<Guid> managedUserIds = [];
        if (!isSuperAdmin && adminId.HasValue)
        {
            var users = await db.Users
                .Where(u => u.CreatedByAdminId == adminId.Value || u.Id == adminId.Value)
                .Select(u => new { u.Id, u.Email })
                .ToListAsync(ct);
            managedEmails = users.Select(u => u.Email).ToList();
            managedUserIds = users.Select(u => u.Id).ToList();
        }

        // Recent audit logs
        var auditQ = db.AuditLogs.Where(a => !a.IsDeleted);
        if (!isSuperAdmin && managedUserIds.Count > 0)
            auditQ = auditQ.Where(a => a.UserId.HasValue && managedUserIds.Contains(a.UserId!.Value));
        else if (!isSuperAdmin)
            auditQ = auditQ.Where(_ => false);

        var audits = await auditQ
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
        var errorQ = db.ErrorLogs.Where(e => !e.IsDeleted);
        if (!isSuperAdmin && managedEmails.Count > 0)
            errorQ = errorQ.Where(e => e.UserEmail == null || managedEmails.Contains(e.UserEmail));
        else if (!isSuperAdmin)
            errorQ = errorQ.Where(_ => false);

        var errors = await errorQ
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
        var orderHistQ = db.OrderStatusHistories.Include(h => h.Order).AsQueryable();
        if (!isSuperAdmin && managedUserIds.Count > 0)
            orderHistQ = orderHistQ.Where(h => h.Order.UserId != null && managedUserIds.Contains(h.Order.UserId.Value));
        else if (!isSuperAdmin)
            orderHistQ = orderHistQ.Where(_ => false);

        var orderHistory = await orderHistQ
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
        var invoiceQ = db.Invoices.Where(i => !i.IsDeleted);
        if (!isSuperAdmin && managedUserIds.Count > 0)
            invoiceQ = invoiceQ.Where(i => i.Order.UserId != null && managedUserIds.Contains(i.Order.UserId.Value));
        else if (!isSuperAdmin)
            invoiceQ = invoiceQ.Where(_ => false);

        var invoices = await invoiceQ
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
