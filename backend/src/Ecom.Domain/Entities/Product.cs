using Ecom.Domain.Common;
using Ecom.Domain.Enums;

namespace Ecom.Domain.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public ProductType ProductType { get; set; } = ProductType.Simple;
    public Guid? BrandId { get; set; }
    public Brand? Brand { get; set; }
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public decimal Price { get; set; }
    public decimal? DiscountPrice { get; set; }
    public string Currency { get; set; } = "TRY";
    public decimal TaxRate { get; set; } = 20;
    public bool IsActive { get; set; } = true;
    public bool IsPublished { get; set; } = false;
    public bool IsFeatured { get; set; } = false;
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }

    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public Stock? Stock { get; set; }
}
