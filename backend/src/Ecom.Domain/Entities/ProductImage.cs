using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class ProductImage : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string ImageUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;
    public bool IsMain { get; set; } = false;
    public string? AltText { get; set; }
}
