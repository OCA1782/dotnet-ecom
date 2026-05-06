using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class Category : BaseEntity
{
    public Guid? ParentCategoryId { get; set; }
    public Category? ParentCategory { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public bool ShowInMenu { get; set; } = true;
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }

    public ICollection<Category> SubCategories { get; set; } = new List<Category>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
