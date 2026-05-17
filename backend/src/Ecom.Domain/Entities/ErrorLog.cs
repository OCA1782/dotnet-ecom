using Ecom.Domain.Common;

namespace Ecom.Domain.Entities;

public class ErrorLog : BaseEntity
{
    public string Source { get; set; } = "Backend";
    public string Level { get; set; } = "Error";
    public string Message { get; set; } = string.Empty;
    public string? StackTrace { get; set; }
    public string? Path { get; set; }
    public string? Url { get; set; }
    public string? ExceptionType { get; set; }
    public string? UserEmail { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public int? StatusCode { get; set; }
}
