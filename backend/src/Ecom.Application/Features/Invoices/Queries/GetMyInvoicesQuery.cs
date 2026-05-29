using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Invoices.Queries;

public record MyInvoiceDto(
    Guid Id,
    string InvoiceNumber,
    Guid OrderId,
    string OrderNumber,
    InvoiceStatus Status,
    EInvoiceDocType DocType,
    decimal TotalAmount,
    DateTime CreatedDate
);

public record GetMyInvoicesQuery(Guid UserId, int Page = 1, int PageSize = 10)
    : IRequest<PaginatedList<MyInvoiceDto>>;

public class GetMyInvoicesHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyInvoicesQuery, PaginatedList<MyInvoiceDto>>
{
    public async Task<PaginatedList<MyInvoiceDto>> Handle(GetMyInvoicesQuery request, CancellationToken cancellationToken)
    {
        var query = db.Invoices
            .Include(i => i.Order)
            .Where(i => i.UserId == request.UserId)
            .OrderByDescending(i => i.CreatedDate);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(i => new MyInvoiceDto(
                i.Id,
                i.InvoiceNumber,
                i.OrderId,
                i.Order.OrderNumber,
                i.Status,
                i.DocType,
                i.TotalAmount,
                i.CreatedDate))
            .ToListAsync(cancellationToken);

        return PaginatedList<MyInvoiceDto>.Create(items, totalCount, request.Page, request.PageSize);
    }
}
