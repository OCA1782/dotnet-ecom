using System.Collections.Concurrent;

namespace Ecom.Infrastructure.Services;

public record QnbFormData(
    string FormAction,
    Dictionary<string, string> HiddenFields,
    DateTimeOffset ExpiresAt);

public static class PayforSessionCache
{
    private static readonly ConcurrentDictionary<string, QnbFormData> _sessions = new();

    public static string Store(QnbFormData data)
    {
        Cleanup();
        var id = Guid.NewGuid().ToString("N");
        _sessions[id] = data;
        return id;
    }

    public static QnbFormData? Get(string sessionId)
    {
        if (_sessions.TryGetValue(sessionId, out var data))
        {
            if (data.ExpiresAt > DateTimeOffset.UtcNow)
                return data;
            _sessions.TryRemove(sessionId, out _);
        }
        return null;
    }

    private static void Cleanup()
    {
        var expired = _sessions.Where(kv => kv.Value.ExpiresAt <= DateTimeOffset.UtcNow)
                               .Select(kv => kv.Key).ToList();
        foreach (var k in expired) _sessions.TryRemove(k, out _);
    }
}
