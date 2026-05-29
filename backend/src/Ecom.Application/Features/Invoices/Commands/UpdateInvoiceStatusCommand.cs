using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Invoices.Commands;

public record UpdateInvoiceStatusCommand(
    Guid Id,
    InvoiceStatus Status,
    string? Notes = null
) : IRequest<Result>;

public class UpdateInvoiceStatusHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateInvoiceStatusCommand, Result>
{
    public async Task<Result> Handle(UpdateInvoiceStatusCommand request, CancellationToken ct)
    {
        var invoice = await db.Invoices
            .FirstOrDefaultAsync(i => i.Id == request.Id && !i.IsDeleted, ct);

        if (invoice is null) return Result.Failure("Fatura bulunamadı.");
        if (invoice.Status == InvoiceStatus.Cancelled)
            return Result.Failure("İptal edilmiş fatura güncellenemez.");

        invoice.Status = request.Status;
        if (request.Notes is not null) invoice.Notes = request.Notes;
        if (request.Status == InvoiceStatus.Sent && invoice.SentDate is null)
            invoice.SentDate = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
