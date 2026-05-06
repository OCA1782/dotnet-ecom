namespace Ecom.Application.Common.Interfaces;

public interface IAuditService
{
    Task LogAsync(string action, string entityName, string? entityId = null,
        string? oldValue = null, string? newValue = null,
        Guid? userId = null, CancellationToken cancellationToken = default);
}
