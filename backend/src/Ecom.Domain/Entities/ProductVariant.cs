using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class ProductVariant : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string VariantName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public decimal Price { get; set; }
    public decimal? DiscountPrice { get; set; }
    public bool IsActive { get; set; } = true;

    // Variant attributes stored as JSON: [{"key":"Renk","value":"Siyah"},{"key":"Beden","value":"M"}]
    public string AttributesJson { get; set; } = "[]";

    public Stock? Stock { get; set; }
}
