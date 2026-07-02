using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class AiTaskImage : BaseEntity
{
    public Guid AiTaskId { get; set; }
    public AiTask AiTask { get; set; } = null!;
    public string ImageUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;
}
