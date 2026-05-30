using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Threading.Channels;
using Ecom.Application.Common.Interfaces;

namespace Ecom.Infrastructure.Services;

public class DeployStreamHub : IDeployStreamHub
{
    private readonly ConcurrentDictionary<Guid, Channel<string>> _channels = new();

    public void CreateChannel(Guid deployLogId)
    {
        _channels[deployLogId] = Channel.CreateUnbounded<string>(
            new UnboundedChannelOptions { SingleReader = false, SingleWriter = true });
    }

    public async Task WriteAsync(Guid deployLogId, string message, CancellationToken ct = default)
    {
        if (_channels.TryGetValue(deployLogId, out var ch))
            await ch.Writer.WriteAsync(message, ct);
    }

    public void Complete(Guid deployLogId)
    {
        if (_channels.TryGetValue(deployLogId, out var ch))
            ch.Writer.TryComplete();
    }

    public async IAsyncEnumerable<string> ReadAsync(Guid deployLogId,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        // Wait up to 10 seconds for the channel to be created
        var waited = 0;
        while (!_channels.ContainsKey(deployLogId) && waited < 100)
        {
            await Task.Delay(100, ct);
            waited++;
        }

        if (!_channels.TryGetValue(deployLogId, out var ch)) yield break;

        await foreach (var msg in ch.Reader.ReadAllAsync(ct))
            yield return msg;

        _channels.TryRemove(deployLogId, out _);
    }

    public bool Exists(Guid deployLogId) => _channels.ContainsKey(deployLogId);
}
