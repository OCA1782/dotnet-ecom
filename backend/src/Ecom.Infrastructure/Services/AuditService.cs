using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;

namespace Ecom.Infrastructure.Services;

public class AuditService(IApplicationDbContext db, ICurrentUserService currentUser) : IAuditService
{
    public async Task LogAsync(string action, string entityName, string? entityId = null,
        string? oldValue = null, string? newValue = null,
        Guid? userId = null, CancellationToken cancellationToken = default)
    {
        var log = new AuditLog
        {
            UserId = userId ?? currentUser.UserId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            OldValue = oldValue,
            NewValue = newValue,
            IpAddress = currentUser.IpAddress
        };

        db.AuditLogs.Add(log);
        await db.SaveChangesAsync(cancellationToken);
    }
}
