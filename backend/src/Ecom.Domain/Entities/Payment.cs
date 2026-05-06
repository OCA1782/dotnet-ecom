using Ecom.Domain.Common;
using Ecom.Domain.Enums;

namespace Ecom.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public string PaymentProvider { get; set; } = string.Empty;
    public PaymentMethod PaymentMethod { get; set; }
    public string? TransactionId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "TRY";
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public DateTime? PaidDate { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ProviderResponseJson { get; set; }
    public string? IdempotencyKey { get; set; }
}
