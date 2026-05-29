using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;

namespace Ecom.Infrastructure.Services;

/// <summary>
/// Test ortamı için sahte fatura servisi.
/// Gerçek e-Arşiv/e-Fatura/e-İrsaliye entegrasyonu için IInvoiceService implement eden
/// bir sınıf (örn. LucaInvoiceService, EFinansInvoiceService) bu sınıfın yerini alır.
/// </summary>
public class MockInvoiceService : IInvoiceService
{
    public Task<Result<string>> CreateAsync(InvoiceContext context, CancellationToken ct)
    {
        var mockId = $"MOCK-INV-{context.InvoiceNumber}-{DateTime.UtcNow:HHmmss}";
        return Task.FromResult(Result<string>.Success(mockId));
    }

    public Task<Result> CancelAsync(string providerInvoiceId, CancellationToken ct)
        => Task.FromResult(Result.Success());

    public Task<Result<string>> GetStatusAsync(string providerInvoiceId, CancellationToken ct)
        => Task.FromResult(Result<string>.Success("sent"));
}
