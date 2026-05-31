using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Threading.Channels;
using Ecom.Application.Common.Interfaces;

namespace Ecom.Infrastructure.Jobs;

public class JobStreamHub : IJobStreamHub
{
    private readonly ConcurrentDictionary<string, Channel<string>> _channels = new(StringComparer.OrdinalIgnoreCase);

    public void CreateChannel(string jobName)
    {
        _channels[jobName] = Channel.CreateUnbounded<string>(
            new UnboundedChannelOptions { SingleReader = false, SingleWriter = true });
    }

    public async Task WriteAsync(string jobName, string message, CancellationToken ct = default)
    {
        if (_channels.TryGetValue(jobName, out var ch))
            await ch.Writer.WriteAsync(message, ct);
    }

    public void Complete(string jobName)
    {
        if (_channels.TryGetValue(jobName, out var ch))
            ch.Writer.TryComplete();
    }

    public async IAsyncEnumerable<string> ReadAsync(string jobName,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var waited = 0;
        while (!_channels.ContainsKey(jobName) && waited < 100)
        {
            await Task.Delay(100, ct);
            waited++;
        }

        if (!_channels.TryGetValue(jobName, out var ch)) yield break;

        await foreach (var msg in ch.Reader.ReadAllAsync(ct))
            yield return msg;

        _channels.TryRemove(jobName, out _);
    }

    public bool IsActive(string jobName) => _channels.ContainsKey(jobName);
}
