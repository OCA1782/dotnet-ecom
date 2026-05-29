using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Queries;

public record ProductHistoryEntryDto(
    string EventType,     // "audit" | "stock"
    string Action,
    string? Detail,
    string? OldValue,
    string? NewValue,
    string? UserEmail,
    DateTime OccurredAt
);

public record GetProductHistoryQuery(Guid ProductId) : IRequest<List<ProductHistoryEntryDto>>;

public class GetProductHistoryHandler(IApplicationDbContext db)
    : IRequestHandler<GetProductHistoryQuery, List<ProductHistoryEntryDto>>
{
    public async Task<List<ProductHistoryEntryDto>> Handle(GetProductHistoryQuery request, CancellationToken cancellationToken)
    {
        var productIdStr = request.ProductId.ToString();

        // Audit log entries for this product
        var auditLogs = await db.AuditLogs
            .Where(l => l.EntityName == "Product" && l.EntityId == productIdStr)
            .OrderByDescending(l => l.CreatedDate)
            .Take(100)
            .ToListAsync(cancellationToken);

        // Stock movements for this product (via Stock entity)
        var stockMovements = await db.StockMovements
            .Include(m => m.Stock)
            .Where(m => m.Stock.ProductId == request.ProductId)
            .OrderByDescending(m => m.CreatedDate)
            .Take(50)
            .ToListAsync(cancellationToken);

        // Resolve user emails for audit logs
        var auditUserIds = auditLogs
            .Where(l => l.UserId.HasValue).Select(l => l.UserId!.Value).Distinct().ToList();

        // Resolve user emails for stock movements
        var stockUserIds = stockMovements
            .Where(m => m.CreatedByUserId.HasValue).Select(m => m.CreatedByUserId!.Value).Distinct().ToList();

        var allUserIds = auditUserIds.Union(stockUserIds).Distinct().ToList();
        var userEmails = allUserIds.Count > 0
            ? await db.Users
                .IgnoreQueryFilters()
                .Where(u => allUserIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.Email, cancellationToken)
            : new Dictionary<Guid, string>();

        string EmailOf(Guid? id) =>
            id.HasValue && userEmails.TryGetValue(id.Value, out var email) ? email : "Sistem";

        var auditEntries = auditLogs.Select(l => new ProductHistoryEntryDto(
            "audit",
            l.Action,
            null,
            l.OldValue,
            l.NewValue,
            EmailOf(l.UserId),
            l.CreatedDate
        ));

        var stockEntries = stockMovements.Select(m => new ProductHistoryEntryDto(
            "stock",
            m.MovementType.ToString(),
            $"{(m.Quantity > 0 ? "+" : "")}{m.Quantity} adet — {m.QuantityBefore} → {m.QuantityAfter}",
            null,
            m.Note,
            EmailOf(m.CreatedByUserId),
            m.CreatedDate
        ));

        return auditEntries
            .Concat(stockEntries)
            .OrderByDescending(e => e.OccurredAt)
            .ToList();
    }
}
