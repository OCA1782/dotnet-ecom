using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class Announcement : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? Content { get; set; }
    public string? MediaUrl { get; set; }
    public string MediaType { get; set; } = "none"; // image | video | gif | none
    public string Category { get; set; } = "duyuru"; // duyuru | kampanya | bilgilendirme | etkinlik
    public string? LinkUrl { get; set; }
    public string? LinkText { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public int DisplayOrder { get; set; } = 0;
}
