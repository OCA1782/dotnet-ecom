using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Invoices.Queries;

public record InvoiceItemDto(
    Guid Id, string ProductName, string? SKU, string? VariantName,
    int Quantity, decimal UnitPrice, decimal TaxRate, decimal TaxAmount, decimal LineTotal
);

public record InvoiceDetailDto(
    Guid Id, string InvoiceNumber, Guid OrderId, string OrderNumber,
    string? CustomerEmail, EInvoiceDocType DocType, InvoiceStatus Status,
    decimal SubTotal, decimal TaxAmount, decimal TotalAmount,
    string? BillingAddressSnapshot, string? ProviderInvoiceId,
    string? ProviderResponse, DateTime? SentDate, string? Notes, string? ErrorMessage,
    DateTime CreatedDate, List<InvoiceItemDto> Items
);

public record GetInvoiceDetailQuery(Guid Id) : IRequest<Result<InvoiceDetailDto>>;

public class GetInvoiceDetailHandler(IApplicationDbContext db)
    : IRequestHandler<GetInvoiceDetailQuery, Result<InvoiceDetailDto>>
{
    public async Task<Result<InvoiceDetailDto>> Handle(GetInvoiceDetailQuery request, CancellationToken ct)
    {
        var inv = await db.Invoices
            .Include(i => i.Order)
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == request.Id && !i.IsDeleted, ct);

        if (inv is null) return Result<InvoiceDetailDto>.Failure("Fatura bulunamadı.");

        var dto = new InvoiceDetailDto(
            inv.Id, inv.InvoiceNumber, inv.OrderId, inv.Order.OrderNumber,
            inv.GuestEmail, inv.DocType, inv.Status,
            inv.SubTotal, inv.TaxAmount, inv.TotalAmount,
            inv.BillingAddressSnapshot, inv.ProviderInvoiceId,
            inv.ProviderResponse, inv.SentDate, inv.Notes, inv.ErrorMessage,
            inv.CreatedDate,
            inv.Items.Select(it => new InvoiceItemDto(
                it.Id, it.ProductName, it.SKU, it.VariantName,
                it.Quantity, it.UnitPrice, it.TaxRate, it.TaxAmount, it.LineTotal
            )).ToList()
        );

        return Result<InvoiceDetailDto>.Success(dto);
    }
}
