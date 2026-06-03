using Ecom.Application.Common.Interfaces;

namespace Ecom.Worker;

// No-op hub: the worker has no SignalR, so we just log to console via Serilog.
internal sealed class NullJobStreamHub : IJobStreamHub
{
    public void CreateChannel(string jobName) { }
    public Task WriteAsync(string jobName, string message, CancellationToken ct = default) => Task.CompletedTask;
    public void Complete(string jobName) { }
    public IAsyncEnumerable<string> ReadAsync(string jobName, CancellationToken ct = default) => AsyncEmpty();
    public bool IsActive(string jobName) => false;

    private static async IAsyncEnumerable<string> AsyncEmpty()
    {
        await Task.CompletedTask;
        yield break;
    }
}
