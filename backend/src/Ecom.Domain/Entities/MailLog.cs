namespace Ecom.Domain.Entities;

public class MailLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public string ToEmail { get; set; } = string.Empty;
    public string ToName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string TemplateName { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public bool IsDevMode { get; set; }
    public string? ErrorMessage { get; set; }
}
