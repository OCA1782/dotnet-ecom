using Ecom.Domain.Common;
using Ecom.Domain.Enums;

namespace Ecom.Domain.Entities;

public class StockMovement : BaseEntity
{
    public Guid StockId { get; set; }
    public Stock Stock { get; set; } = null!;
    public StockMovementType MovementType { get; set; }
    public int Quantity { get; set; }
    public int QuantityBefore { get; set; }
    public int QuantityAfter { get; set; }
    public Guid? OrderId { get; set; }
    public string? Note { get; set; }
    public Guid? CreatedByUserId { get; set; }
}
