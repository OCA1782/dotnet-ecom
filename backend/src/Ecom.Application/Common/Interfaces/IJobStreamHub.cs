namespace Ecom.Application.Common.Interfaces;

public interface IJobStreamHub
{
    void CreateChannel(string jobName);
    Task WriteAsync(string jobName, string message, CancellationToken ct = default);
    void Complete(string jobName);
    IAsyncEnumerable<string> ReadAsync(string jobName, CancellationToken ct = default);
    bool IsActive(string jobName);
}
