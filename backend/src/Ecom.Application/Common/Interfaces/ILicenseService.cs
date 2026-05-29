namespace Ecom.Application.Common.Interfaces;

public interface ILicenseService
{
    Task<bool> IsModuleActiveAsync(string module, CancellationToken ct = default);
    Task InvalidateCacheAsync(CancellationToken ct = default);
}
