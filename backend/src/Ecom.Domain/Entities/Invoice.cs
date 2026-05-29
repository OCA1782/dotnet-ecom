using Ecom.Domain.Common;
using Ecom.Domain.Enums;

namespace Ecom.Domain.Entities;

public class Invoice : BaseEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid? UserId { get; set; }
    public string? GuestEmail { get; set; }
    public EInvoiceDocType DocType { get; set; } = EInvoiceDocType.eArchive;
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? BillingAddressSnapshot { get; set; }
    // Provider integration (populated when real e-invoice provider is connected)
    public string? ProviderInvoiceId { get; set; }
    public string? ProviderResponse { get; set; }
    public DateTime? SentDate { get; set; }
    public string? Notes { get; set; }
    public string? ErrorMessage { get; set; }
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}
