using Ecom.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Text;

namespace Ecom.Infrastructure.Services;

public class LicenceServiceClient(IHttpClientFactory factory, IConfiguration config)
    : ILicenceServiceClient
{
    private HttpClient Client
    {
        get
        {
            var client = factory.CreateClient("EcomLicence");
            var baseUrl = config["LicenceService:BaseUrl"];
            if (!string.IsNullOrWhiteSpace(baseUrl))
                client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
            var key = Environment.GetEnvironmentVariable("LICENCE_SERVICE_KEY")
                ?? config["LicenceService:ServiceKey"]
                ?? "";
            if (!string.IsNullOrWhiteSpace(key))
                client.DefaultRequestHeaders.Add("X-Service-Key", key);
            return client;
        }
    }

    // ── Licenses ─────────────────────────────────────────────────────────────
    public Task<string> GetLicensesAsync(CancellationToken ct = default)
        => GetAsync("api/licenses", ct);

    public Task<string> CreateLicenseAsync(string jsonBody, CancellationToken ct = default)
        => PostAsync("api/licenses", jsonBody, ct);

    public Task<string> UpdateLicenseAsync(Guid id, string jsonBody, CancellationToken ct = default)
        => PutAsync($"api/licenses/{id}", jsonBody, ct);

    public Task<string> RenewLicenseAsync(Guid id, string jsonBody, CancellationToken ct = default)
        => PostAsync($"api/licenses/{id}/renew", jsonBody, ct);

    public Task<string> DeleteLicenseAsync(Guid id, CancellationToken ct = default)
        => DeleteAsync($"api/licenses/{id}", ct);

    // ── License Assignments ───────────────────────────────────────────────────
    public Task<string> GetAssignmentsAsync(CancellationToken ct = default)
        => GetAsync("api/license-assignments", ct);

    public Task<string> AssignLicenseAsync(string jsonBody, CancellationToken ct = default)
        => PostAsync("api/license-assignments", jsonBody, ct);

    public Task<string> RevokeAssignmentAsync(Guid id, string? reason, CancellationToken ct = default)
    {
        var qs = string.IsNullOrWhiteSpace(reason) ? "" : $"?reason={Uri.EscapeDataString(reason)}";
        return DeleteAsync($"api/license-assignments/{id}{qs}", ct);
    }

    public Task<string> ResetViewPasswordAsync(Guid id, CancellationToken ct = default)
        => PostAsync($"api/license-assignments/{id}/reset-password", "{}", ct);

    public Task<string> RevealMyLicenseAsync(string jsonBody, CancellationToken ct = default)
        => PostAsync("api/license-assignments/reveal", jsonBody, ct);

    public Task<string> GetAssignmentHistoryAsync(int limit, CancellationToken ct = default)
        => GetAsync($"api/license-assignments/history?limit={limit}", ct);

    // ── Validation ────────────────────────────────────────────────────────────
    public Task<string> ValidateLicenseAsync(string jsonBody, CancellationToken ct = default)
        => PostAsync("api/validate", jsonBody, ct);

    // ── HTTP helpers ──────────────────────────────────────────────────────────
    private async Task<string> GetAsync(string path, CancellationToken ct)
    {
        var res = await Client.GetAsync(path, ct);
        return await res.Content.ReadAsStringAsync(ct);
    }

    private async Task<string> PostAsync(string path, string json, CancellationToken ct)
    {
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var res = await Client.PostAsync(path, content, ct);
        return await res.Content.ReadAsStringAsync(ct);
    }

    private async Task<string> PutAsync(string path, string json, CancellationToken ct)
    {
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var res = await Client.PutAsync(path, content, ct);
        return await res.Content.ReadAsStringAsync(ct);
    }

    private async Task<string> DeleteAsync(string path, CancellationToken ct)
    {
        var res = await Client.DeleteAsync(path, ct);
        return await res.Content.ReadAsStringAsync(ct);
    }
}
