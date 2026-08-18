using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Application.Events;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecom.Application.Features.Payments.Commands;

public record PaymentCallbackCommand(
    string TransactionId,
    string ProviderPayload,
    bool IsSuccess
) : IRequest<Result>;

public class PaymentCallbackHandler(
    IApplicationDbContext db,
#pragma warning disable CS9113
    IPaymentService paymentService,  // reserved for Iyzico callback verification
#pragma warning restore CS9113
    IStockService stockService,
    IEventPublisher eventPublisher,
    ILogger<PaymentCallbackHandler> logger
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

            // Publish PaymentCompletedEvent via outbox
            try
            {
                var (email, _) = await GetCustomerInfoAsync(order, cancellationToken);
                await eventPublisher.PublishAsync(new PaymentCompletedEvent(
                    order.Id, order.OrderNumber,
                    string.IsNullOrEmpty(email) ? null : email,
                    order.GrandTotal, payment.PaymentProvider,
                    DateTime.UtcNow), cancellationToken);
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

            // Restore cart items so the customer can retry without re-adding products
            if (order.UserId.HasValue)
            {
                try
                {
                    var cart = await db.Carts
                        .Include(c => c.Items)
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.UserId == order.UserId, cancellationToken);

                    if (cart is null)
                    {
                        var newCart = new Domain.Entities.Cart { UserId = order.UserId };
                        foreach (var item in order.Items)
                            newCart.Items.Add(new Domain.Entities.CartItem
                            {
                                ProductId = item.ProductId,
                                ProductVariantId = item.ProductVariantId,
                                Quantity = item.Quantity,
                                UnitPrice = item.UnitPrice,
                                IsSelected = true
                            });
                        db.Carts.Add(newCart);
                        await db.SaveChangesAsync(cancellationToken);
                    }
                    else
                    {
                        foreach (var item in order.Items)
                        {
                            var existing = cart.Items.FirstOrDefault(ci =>
                                ci.ProductId == item.ProductId && ci.ProductVariantId == item.ProductVariantId);

                            if (existing is not null)
                            {
                                await db.CartItems
                                    .Where(ci => ci.Id == existing.Id)
                                    .ExecuteUpdateAsync(s => s.SetProperty(
                                        ci => ci.Quantity, ci => ci.Quantity + item.Quantity), cancellationToken);
                            }
                            else
                            {
                                db.CartItems.Add(new Domain.Entities.CartItem
                                {
                                    CartId = cart.Id,
                                    ProductId = item.ProductId,
                                    ProductVariantId = item.ProductVariantId,
                                    Quantity = item.Quantity,
                                    UnitPrice = item.UnitPrice,
                                    IsSelected = true
                                });
                                await db.SaveChangesAsync(cancellationToken);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Sepet restore başarısız (ödeme zaten başarısız olarak işaretlendi). OrderId={OrderId}", order.Id);
                }
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
