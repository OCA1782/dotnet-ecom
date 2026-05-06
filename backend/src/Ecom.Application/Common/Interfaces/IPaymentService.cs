using Ecom.Application.Common.Models;

namespace Ecom.Application.Common.Interfaces;

public record PaymentInitiateResult(
    string TransactionId,
    string? RedirectUrl,
    bool RequiresRedirect
);

public record PaymentContext(
    Guid OrderId,
    string OrderNumber,
    decimal Amount,
    string Currency,
    string IdempotencyKey,
    string BuyerName,
    string BuyerSurname,
    string BuyerEmail,
    string? BuyerPhone,
    string? BuyerIp,
    List<PaymentBasketItem> BasketItems,
    string? CallbackUrl = null
);

public record PaymentBasketItem(
    string Id,
    string Name,
    decimal Price,
    int Quantity
);

public interface IPaymentService
{
    Task<Result<PaymentInitiateResult>> InitiateAsync(
        PaymentContext context,
        CancellationToken ct = default);

    Task<Result<bool>> VerifyCallbackAsync(
        string transactionId,
        string providerPayload,
        CancellationToken ct = default);
}
