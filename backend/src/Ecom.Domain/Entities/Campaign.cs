using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class Campaign : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string Icon { get; set; } = "🏷️";
    public string ColorScheme { get; set; } = "orange"; // orange|teal|navy|amber|purple|green|rose|sky
    public string? ImageUrl { get; set; }
    public string? StylesJson { get; set; }
    public string? LinkUrl { get; set; }
    public string? LinkText { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
