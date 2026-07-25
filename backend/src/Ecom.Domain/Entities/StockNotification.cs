namespace Ecom.Domain.Entities;

public class StockNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsNotified { get; set; }
    public DateTime? NotifiedAt { get; set; }

    public Product? Product { get; set; }
}
