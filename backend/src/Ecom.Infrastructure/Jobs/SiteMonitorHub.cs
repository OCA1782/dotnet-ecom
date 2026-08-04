using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Threading.Channels;
using Ecom.Application.Common.Interfaces;

namespace Ecom.Infrastructure.Jobs;

public class SiteMonitorHub : ISiteMonitorHub
{
    private readonly ConcurrentDictionary<string, Channel<SiteMonitorEvent>> _subs = new();
    private volatile SiteMonitorEvent? _latest;

    public SiteMonitorEvent? Latest => _latest;

    public void Broadcast(SiteMonitorEvent evt)
    {
        _latest = evt;
        foreach (var ch in _subs.Values)
            ch.Writer.TryWrite(evt);
    }

    public async IAsyncEnumerable<SiteMonitorEvent> SubscribeAsync(
        string subscriberId,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var ch = Channel.CreateBounded<SiteMonitorEvent>(
            new BoundedChannelOptions(50)
            {
                FullMode = BoundedChannelFullMode.DropOldest,
                SingleWriter = false,
                SingleReader = true,
            });
        _subs[subscriberId] = ch;
        try
        {
            if (_latest != null)
                ch.Writer.TryWrite(_latest);

            await foreach (var evt in ch.Reader.ReadAllAsync(ct))
                yield return evt;
        }
        finally
        {
            _subs.TryRemove(subscriberId, out _);
        }
    }

    public void Unsubscribe(string subscriberId)
    {
        if (_subs.TryRemove(subscriberId, out var ch))
            ch.Writer.TryComplete();
    }
}
