using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record ApprovePaymentCommand(Guid PaymentId, Guid? AdminUserId, string? Note) : IRequest<Result>;
public record SuspendPaymentCommand(Guid PaymentId, Guid? AdminUserId, string? Note) : IRequest<Result>;
public record RejectPaymentCommand(Guid PaymentId, Guid? AdminUserId, string? Note) : IRequest<Result>;

public class ApprovePaymentHandler(IApplicationDbContext db) : IRequestHandler<ApprovePaymentCommand, Result>
{
    public async Task<Result> Handle(ApprovePaymentCommand request, CancellationToken ct)
    {
        var payment = await db.Payments
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.Id == request.PaymentId, ct);

        if (payment == null) return Result.Failure("Ödeme bulunamadı.");
        if (payment.Status == PaymentStatus.Paid) return Result.Failure("Bu ödeme zaten onaylanmış.");

        var prevOrderStatus = payment.Order.Status;

        payment.Status = PaymentStatus.Paid;
        payment.PaidDate = DateTime.UtcNow;
        payment.Order.PaymentStatus = PaymentStatus.Paid;
        payment.Order.Status = OrderStatus.PaymentCompleted;

        db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = payment.OrderId,
            FromStatus = prevOrderStatus,
            ToStatus = OrderStatus.PaymentCompleted,
            Note = request.Note ?? "Ödeme admin tarafından manuel olarak onaylandı.",
            ChangedByUserId = request.AdminUserId,
        });

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}

public class SuspendPaymentHandler(IApplicationDbContext db) : IRequestHandler<SuspendPaymentCommand, Result>
{
    public async Task<Result> Handle(SuspendPaymentCommand request, CancellationToken ct)
    {
        var payment = await db.Payments
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.Id == request.PaymentId, ct);

        if (payment == null) return Result.Failure("Ödeme bulunamadı.");
        if (payment.Order.Status == OrderStatus.OnHold) return Result.Failure("Sipariş zaten askıya alınmış.");

        var prevOrderStatus = payment.Order.Status;

        payment.Order.Status = OrderStatus.OnHold;

        db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = payment.OrderId,
            FromStatus = prevOrderStatus,
            ToStatus = OrderStatus.OnHold,
            Note = request.Note ?? "Ödeme admin tarafından askıya alındı.",
            ChangedByUserId = request.AdminUserId,
        });

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}

public class RejectPaymentHandler(IApplicationDbContext db) : IRequestHandler<RejectPaymentCommand, Result>
{
    public async Task<Result> Handle(RejectPaymentCommand request, CancellationToken ct)
    {
        var payment = await db.Payments
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.Id == request.PaymentId, ct);

        if (payment == null) return Result.Failure("Ödeme bulunamadı.");
        if (payment.Status == PaymentStatus.Cancelled) return Result.Failure("Bu ödeme zaten iptal edilmiş.");

        var prevOrderStatus = payment.Order.Status;

        payment.Status = PaymentStatus.Cancelled;
        payment.ErrorMessage = request.Note ?? "Admin tarafından reddedildi.";
        payment.Order.Status = OrderStatus.Cancelled;
        payment.Order.PaymentStatus = PaymentStatus.Cancelled;

        db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            OrderId = payment.OrderId,
            FromStatus = prevOrderStatus,
            ToStatus = OrderStatus.Cancelled,
            Note = request.Note ?? "Ödeme admin tarafından reddedildi.",
            ChangedByUserId = request.AdminUserId,
        });

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
