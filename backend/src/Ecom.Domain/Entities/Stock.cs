using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class Stock : BaseEntity
{
    public Guid? ProductId { get; set; }
    public Product? Product { get; set; }
    public Guid? ProductVariantId { get; set; }
    public ProductVariant? ProductVariant { get; set; }
    public string WarehouseCode { get; set; } = "DEFAULT";
    public int Quantity { get; set; } = 0;
    public int ReservedQuantity { get; set; } = 0;
    public int CriticalStockLevel { get; set; } = 5;

    public int AvailableQuantity => Quantity - ReservedQuantity;

    public ICollection<StockMovement> Movements { get; set; } = new List<StockMovement>();
}
