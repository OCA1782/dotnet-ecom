namespace Ecom.Application.Common.Interfaces;

public record SiteMonitorEvent(
    DateTime CheckedAt,
    bool IsUp,
    int? HttpStatusCode,
    long ResponseTimeMs,
    string? ErrorMessage);

public interface ISiteMonitorHub
{
    void Broadcast(SiteMonitorEvent evt);
    IAsyncEnumerable<SiteMonitorEvent> SubscribeAsync(string subscriberId, CancellationToken ct = default);
    void Unsubscribe(string subscriberId);
    SiteMonitorEvent? Latest { get; }
}
