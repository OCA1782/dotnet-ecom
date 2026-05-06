using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Ecom.Application.Features.Payments.Commands;

public record InitiatePaymentCommand(
    Guid OrderId,
    Guid? UserId,
    PaymentMethod Method,
    string? CallbackUrl = null
) : IRequest<Result<PaymentInitiateResult>>;

public class InitiatePaymentHandler(
    IApplicationDbContext db,
    IPaymentService paymentService,
    IHttpContextAccessor httpContextAccessor
) : IRequestHandler<InitiatePaymentCommand, Result<PaymentInitiateResult>>
{
    public async Task<Result<PaymentInitiateResult>> Handle(InitiatePaymentCommand request, CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null) return Result<PaymentInitiateResult>.Failure("Sipariş bulunamadı.");

        if (request.UserId.HasValue && order.UserId != request.UserId)
            return Result<PaymentInitiateResult>.Failure("Yetkisiz işlem.");

        if (order.PaymentStatus == PaymentStatus.Paid)
            return Result<PaymentInitiateResult>.Failure("Bu sipariş zaten ödenmiş.");

        if (order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Failed)
            return Result<PaymentInitiateResult>.Failure("İptal edilmiş sipariş için ödeme başlatılamaz.");

        // Load buyer info
        string buyerName = "Misafir", buyerSurname = "Müşteri", buyerEmail = order.GuestEmail ?? "";
        string? buyerPhone = null;
        if (request.UserId.HasValue)
        {
            var user = await db.Users.FindAsync([request.UserId.Value], cancellationToken);
            if (user is not null)
            {
                buyerName = user.Name;
                buyerSurname = user.Surname;
                buyerEmail = user.Email;
                buyerPhone = user.PhoneNumber;
            }
        }

        // Parse shipping address for phone
        if (buyerPhone is null && !string.IsNullOrEmpty(order.ShippingAddressSnapshot))
        {
            try
            {
                var addr = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(order.ShippingAddressSnapshot);
                buyerPhone = addr?.GetValueOrDefault("phoneNumber").GetString();
            }
            catch { /* ignore */ }
        }

        var basketItems = order.Items.Select(i => new PaymentBasketItem(
            i.Id.ToString(),
            i.ProductName,
            i.UnitPrice,
            i.Quantity
        )).ToList();

        var idempotencyKey = $"{order.Id}-{DateTime.UtcNow:yyyyMMddHH}";
        var buyerIp = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

        var context = new PaymentContext(
            order.Id,
            order.OrderNumber,
            order.GrandTotal,
            "TRY",
            idempotencyKey,
            buyerName,
            buyerSurname,
            buyerEmail,
            buyerPhone,
            buyerIp,
            basketItems,
            request.CallbackUrl
        );

        var payResult = await paymentService.InitiateAsync(context, cancellationToken);
        if (!payResult.Succeeded) return Result<PaymentInitiateResult>.Failure(payResult.Error!);

        var paymentProvider = paymentService.GetType().Name.Replace("PaymentService", "");

        if (order.Payment is null)
        {
            db.Payments.Add(new Domain.Entities.Payment
            {
                OrderId = order.Id,
                Amount = order.GrandTotal,
                Currency = "TRY",
                PaymentMethod = request.Method,
                Status = PaymentStatus.Pending,
                TransactionId = payResult.Data!.TransactionId,
                IdempotencyKey = idempotencyKey,
                PaymentProvider = paymentProvider
            });
        }
        else
        {
            order.Payment.TransactionId = payResult.Data!.TransactionId;
            order.Payment.Status = PaymentStatus.Pending;
            order.Payment.IdempotencyKey = idempotencyKey;
            order.Payment.PaymentProvider = paymentProvider;
        }

        if (order.Status == OrderStatus.Created)
        {
            order.Status = OrderStatus.PaymentPending;
            db.OrderStatusHistories.Add(new Domain.Entities.OrderStatusHistory
            {
                OrderId = order.Id,
                FromStatus = OrderStatus.Created,
                ToStatus = OrderStatus.PaymentPending,
                Note = "Ödeme başlatıldı"
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        return Result<PaymentInitiateResult>.Success(payResult.Data!);
    }
}
