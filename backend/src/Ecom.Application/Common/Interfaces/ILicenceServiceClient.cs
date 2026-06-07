namespace Ecom.Application.Common.Interfaces;

public interface ILicenceServiceClient
{
    // Licenses
    Task<string> GetLicensesAsync(CancellationToken ct = default);
    Task<string> CreateLicenseAsync(string jsonBody, CancellationToken ct = default);
    Task<string> UpdateLicenseAsync(Guid id, string jsonBody, CancellationToken ct = default);
    Task<string> RenewLicenseAsync(Guid id, string jsonBody, CancellationToken ct = default);
    Task<string> DeleteLicenseAsync(Guid id, CancellationToken ct = default);

    // License assignments
    Task<string> GetAssignmentsAsync(CancellationToken ct = default);
    Task<string> AssignLicenseAsync(string jsonBody, CancellationToken ct = default);
    Task<string> RevokeAssignmentAsync(Guid id, string? reason, CancellationToken ct = default);
    Task<string> ResetViewPasswordAsync(Guid id, CancellationToken ct = default);
    Task<string> RevealMyLicenseAsync(string jsonBody, CancellationToken ct = default);
    Task<string> GetAssignmentHistoryAsync(int limit, CancellationToken ct = default);

    // Validation
    Task<string> ValidateLicenseAsync(string jsonBody, CancellationToken ct = default);
}
