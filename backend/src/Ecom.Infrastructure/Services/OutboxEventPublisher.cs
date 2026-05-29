using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Ecom.Infrastructure.Persistence;
using System.Text.Json;

namespace Ecom.Infrastructure.Services;

public class OutboxEventPublisher(ApplicationDbContext db) : IEventPublisher
{
    public async Task PublishAsync<T>(T message, CancellationToken cancellationToken = default) where T : class
    {
        var outbox = new OutboxMessage
        {
            Type = typeof(T).AssemblyQualifiedName ?? typeof(T).Name,
            Payload = JsonSerializer.Serialize(message),
        };
        db.OutboxMessages.Add(outbox);
        await db.SaveChangesAsync(cancellationToken);
    }
}
