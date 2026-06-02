using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Invoices.Queries;

public record InvoiceListDto(
    Guid Id,
    string InvoiceNumber,
    Guid OrderId,
    string OrderNumber,
    string? CustomerEmail,
    EInvoiceDocType DocType,
    InvoiceStatus Status,
    decimal TotalAmount,
    DateTime CreatedDate,
    DateTime? SentDate,
    string? ProviderInvoiceId,
    string? ErrorMessage,
    string? DataSource = null
);

public record GetInvoicesQuery(
    int Page = 1,
    int PageSize = 20,
    InvoiceStatus? Status = null,
    EInvoiceDocType? DocType = null,
    string? Search = null,
    string? SortBy = null
) : IRequest<InvoicesPagedResult>;

public record InvoicesPagedResult(List<InvoiceListDto> Items, int Total, int Page, int PageSize);

public class GetInvoicesHandler(IApplicationDbContext db)
    : IRequestHandler<GetInvoicesQuery, InvoicesPagedResult>
{
    public async Task<InvoicesPagedResult> Handle(GetInvoicesQuery request, CancellationToken ct)
    {
        var q = db.Invoices
            .Include(i => i.Order)
            .Where(i => !i.IsDeleted);

        if (request.Status.HasValue) q = q.Where(i => i.Status == request.Status);
        if (request.DocType.HasValue) q = q.Where(i => i.DocType == request.DocType);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.ToLower();
            q = q.Where(i => i.InvoiceNumber.ToLower().Contains(s)
                || i.Order.OrderNumber.ToLower().Contains(s)
                || (i.GuestEmail != null && i.GuestEmail.ToLower().Contains(s)));
        }

        var total = await q.CountAsync(ct);
        var orderedQ = request.SortBy switch
        {
            "total-asc"        => q.OrderBy(i => i.TotalAmount),
            "total-desc"       => q.OrderByDescending(i => i.TotalAmount),
            "createdDate-asc"  => q.OrderBy(i => i.CreatedDate),
            "createdDate-desc" => q.OrderByDescending(i => i.CreatedDate),
            "dataSource-asc"   => q.OrderBy(i => i.DataSource),
            "dataSource-desc"  => q.OrderByDescending(i => i.DataSource),
            _                  => q.OrderByDescending(i => i.CreatedDate),
        };
        var items = await orderedQ
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(i => new InvoiceListDto(
                i.Id, i.InvoiceNumber, i.OrderId, i.Order.OrderNumber,
                i.GuestEmail, i.DocType, i.Status, i.TotalAmount,
                i.CreatedDate, i.SentDate, i.ProviderInvoiceId, i.ErrorMessage, i.DataSource))
            .ToListAsync(ct);

        return new InvoicesPagedResult(items, total, request.Page, request.PageSize);
    }
}
