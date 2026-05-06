using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;

namespace Ecom.Infrastructure.Services;

public class MockPaymentService : IPaymentService
{
    public Task<Result<PaymentInitiateResult>> InitiateAsync(
        PaymentContext context, CancellationToken ct = default)
    {
        var transactionId = $"MOCK-{context.OrderId:N}-{DateTime.UtcNow:HHmmss}";
        return Task.FromResult(Result<PaymentInitiateResult>.Success(
            new PaymentInitiateResult(transactionId, null, false)));
    }

    public Task<Result<bool>> VerifyCallbackAsync(
        string transactionId, string providerPayload, CancellationToken ct = default)
    {
        var isSuccess = providerPayload.Contains("\"success\":true", StringComparison.OrdinalIgnoreCase);
        return Task.FromResult(Result<bool>.Success(isSuccess));
    }
}
