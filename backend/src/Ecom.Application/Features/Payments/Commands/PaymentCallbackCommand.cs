using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Payments.Commands;

public record PaymentCallbackCommand(
    string TransactionId,
    string ProviderPayload,
    bool IsSuccess
) : IRequest<Result>;

public class PaymentCallbackHandler(
    IApplicationDbContext db,
    IPaymentService paymentService,
    IStockService stockService,
    IEmailService emailService
) : IRequestHandler<PaymentCallbackCommand, Result>
{
    public async Task<Result> Handle(PaymentCallbackCommand request, CancellationToken cancellationToken)
    {
        var payment = await db.Payments
            .Include(p => p.Order)
                .ThenInclude(o => o!.Items)
            .FirstOrDefaultAsync(p => p.TransactionId == request.TransactionId, cancellationToken);

        if (payment is null) return Result.Failure("Ödeme kaydı bulunamadı.");

        // Idempotency: already processed
        if (payment.Status == PaymentStatus.Paid)
            return Result.Success();
        if (payment.Status == PaymentStatus.Failed && !request.IsSuccess)
            return Result.Success();

        payment.ProviderResponseJson = request.ProviderPayload;

        var order = payment.Order!;

        if (request.IsSuccess)
        {
            payment.Status = PaymentStatus.Paid;
            payment.PaidDate = DateTime.UtcNow;

            var previousStatus = order.Status;
            order.Status = OrderStatus.PaymentCompleted;
            order.PaymentStatus = PaymentStatus.Paid;

            db.OrderStatusHistories.Add(new Domain.Entities.OrderStatusHistory
            {
                OrderId = order.Id,
                FromStatus = previousStatus,
                ToStatus = OrderStatus.PaymentCompleted,
                Note = $"Ödeme onaylandı. TransactionId: {request.TransactionId}"
            });

            // Save order + payment changes first
            await db.SaveChangesAsync(cancellationToken);

            // Confirm stock deduction (reservation → actual deduction)
            foreach (var item in order.Items)
            {
                await stockService.ConfirmAsync(
                    item.ProductId, item.ProductVariantId, item.Quantity, order.Id, cancellationToken);
            }

            // Send payment success email
            try
            {
                var (email, name) = await GetCustomerInfoAsync(order, cancellationToken);
                if (!string.IsNullOrEmpty(email))
                    await emailService.SendPaymentSuccessAsync(email, name, order.OrderNumber, order.GrandTotal, cancellationToken);
            }
            catch { }
        }
        else
        {
            payment.Status = PaymentStatus.Failed;

            var previousStatus = order.Status;
            order.Status = OrderStatus.Failed;
            order.PaymentStatus = PaymentStatus.Failed;

            db.OrderStatusHistories.Add(new Domain.Entities.OrderStatusHistory
            {
                OrderId = order.Id,
                FromStatus = previousStatus,
                ToStatus = OrderStatus.Failed,
                Note = "Ödeme başarısız."
            });

            // Save order + payment changes first
            await db.SaveChangesAsync(cancellationToken);

            // Release stock reservations
            foreach (var item in order.Items)
            {
                await stockService.ReleaseReservationAsync(
                    item.ProductId, item.ProductVariantId, item.Quantity, order.Id, cancellationToken);
            }
        }

        return Result.Success();
    }

    private async Task<(string email, string name)> GetCustomerInfoAsync(Domain.Entities.Order order, CancellationToken ct)
    {
        if (order.UserId.HasValue)
        {
            var user = await db.Users.FindAsync([order.UserId.Value], ct);
            if (user is not null)
                return (user.Email, $"{user.Name} {user.Surname}");
        }
        return (order.GuestEmail ?? string.Empty, "Değerli Müşteri");
    }
}
