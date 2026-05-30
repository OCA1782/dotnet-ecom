namespace Ecom.Application.Common.Interfaces;

public interface IDeployService
{
    Task<Guid> StartDeployAsync(Guid serverId, string triggeredBy, CancellationToken ct = default);
    Task<string> TestConnectionAsync(Guid serverId, CancellationToken ct = default);
    Task<string> GetContainerStatusAsync(Guid serverId, CancellationToken ct = default);
    string EncryptCredential(string plaintext);
    string DecryptCredential(string encrypted);
}

public interface IDeployStreamHub
{
    void CreateChannel(Guid deployLogId);
    Task WriteAsync(Guid deployLogId, string message, CancellationToken ct = default);
    void Complete(Guid deployLogId);
    IAsyncEnumerable<string> ReadAsync(Guid deployLogId, CancellationToken ct = default);
    bool Exists(Guid deployLogId);
}
