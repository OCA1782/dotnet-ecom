using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class VisitorLog : BaseEntity
{
    public string? SessionId { get; set; }
    public Guid? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Page { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Referrer { get; set; }
}
