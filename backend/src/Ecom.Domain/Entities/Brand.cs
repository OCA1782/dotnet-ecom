using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class Brand : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? Icon { get; set; }
    public string? StylesJson { get; set; }

    public Guid? ImportedFromSourceId { get; set; }
    public Guid? CreatedByAdminId { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
