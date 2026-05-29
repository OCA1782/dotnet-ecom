using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;

namespace Ecom.Application.Common.Interfaces;

public record InvoiceContext(
    Guid InvoiceId,
    string InvoiceNumber,
    Guid OrderId,
    string OrderNumber,
    EInvoiceDocType DocType,
    decimal TotalAmount,
    string BuyerName,
    string BuyerEmail,
    string? BuyerTaxNumber,
    string? BillingAddressSnapshot
);

public interface IInvoiceService
{
    Task<Result<string>> CreateAsync(InvoiceContext context, CancellationToken ct);
    Task<Result> CancelAsync(string providerInvoiceId, CancellationToken ct);
    Task<Result<string>> GetStatusAsync(string providerInvoiceId, CancellationToken ct);
}
