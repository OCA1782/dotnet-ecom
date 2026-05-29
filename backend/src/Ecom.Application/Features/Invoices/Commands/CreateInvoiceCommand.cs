using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Invoices.Commands;

public record CreateInvoiceCommand(
    Guid OrderId,
    EInvoiceDocType DocType = EInvoiceDocType.eArchive,
    string? Notes = null
) : IRequest<Result<Guid>>;

public class CreateInvoiceHandler(IApplicationDbContext db, IInvoiceService invoiceService)
    : IRequestHandler<CreateInvoiceCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateInvoiceCommand request, CancellationToken ct)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && !o.IsDeleted, ct);

        if (order is null) return Result<Guid>.Failure("Sipariş bulunamadı.");

        // Prevent duplicate non-cancelled invoices for same order + type
        var existing = await db.Invoices.AnyAsync(i =>
            i.OrderId == request.OrderId &&
            i.DocType == request.DocType &&
            i.Status != InvoiceStatus.Cancelled &&
            !i.IsDeleted, ct);

        if (existing)
            return Result<Guid>.Failure("Bu sipariş için aynı türde aktif fatura zaten mevcut.");

        // Generate invoice number: FAT-{YYYYMMDD}-{seq:D6}
        var today = DateTime.UtcNow;
        var prefix = $"FAT-{today:yyyyMMdd}-";
        var last = await db.Invoices
            .Where(i => i.InvoiceNumber.StartsWith(prefix))
            .OrderByDescending(i => i.InvoiceNumber)
            .Select(i => i.InvoiceNumber)
            .FirstOrDefaultAsync(ct);

        int seq = 1;
        if (last is not null && int.TryParse(last[prefix.Length..], out var p)) seq = p + 1;
        var invoiceNumber = $"{prefix}{seq:D6}";

        // Build items from order
        var invoiceItems = order.Items.Select(i => new InvoiceItem
        {
            ProductName = i.ProductName,
            SKU = i.SKU,
            VariantName = i.VariantName,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            TaxRate = i.TaxRate,
            TaxAmount = i.TaxAmount,
            LineTotal = i.LineTotal,
        }).ToList();

        string? customerEmail = order.GuestEmail;
        if (order.UserId.HasValue && string.IsNullOrEmpty(customerEmail))
        {
            var user = await db.Users.FindAsync([order.UserId.Value], ct);
            customerEmail = user?.Email;
        }

        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            OrderId = order.Id,
            UserId = order.UserId,
            GuestEmail = customerEmail,
            DocType = request.DocType,
            Status = InvoiceStatus.Draft,
            SubTotal = order.TotalProductAmount,
            TaxAmount = order.TaxAmount,
            TotalAmount = order.GrandTotal,
            BillingAddressSnapshot = order.BillingAddressSnapshot,
            Notes = request.Notes,
            Items = invoiceItems,
        };

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync(ct);

        // Attempt to send via provider (test env: mock always succeeds)
        var context = new InvoiceContext(
            invoice.Id, invoice.InvoiceNumber, order.Id, order.OrderNumber,
            request.DocType, invoice.TotalAmount,
            customerEmail?.Split('@')[0] ?? "Müşteri",
            customerEmail ?? "",
            null, invoice.BillingAddressSnapshot);

        var sendResult = await invoiceService.CreateAsync(context, ct);
        if (sendResult.Succeeded)
        {
            invoice.ProviderInvoiceId = sendResult.Data;
            invoice.Status = InvoiceStatus.Sent;
            invoice.SentDate = DateTime.UtcNow;
        }
        else
        {
            invoice.Status = InvoiceStatus.Error;
            invoice.ErrorMessage = sendResult.Error;
        }

        await db.SaveChangesAsync(ct);
        return Result<Guid>.Success(invoice.Id);
    }
}
