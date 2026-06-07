using Ecom.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

/// <summary>
/// License CRUD — delegates to dotnet-ecom-licence service.
/// If LicenceService:BaseUrl is not configured, returns 503.
/// </summary>
[ApiController]
[Route("api/admin/licenses")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class LicensesController(ILicenceServiceClient licenceClient, IConfiguration config) : ControllerBase
{
    private bool IsConfigured => !string.IsNullOrWhiteSpace(config["LicenceService:BaseUrl"]);

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        if (!IsConfigured) return ServiceUnavailable();
        var json = await licenceClient.GetLicensesAsync(ct);
        return Content(json, "application/json");
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] object req, CancellationToken ct)
    {
        if (!IsConfigured) return ServiceUnavailable();
        var json = await licenceClient.CreateLicenseAsync(
            System.Text.Json.JsonSerializer.Serialize(req), ct);
        return Content(json, "application/json");
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] object req, CancellationToken ct)
    {
        if (!IsConfigured) return ServiceUnavailable();
        var json = await licenceClient.UpdateLicenseAsync(id,
            System.Text.Json.JsonSerializer.Serialize(req), ct);
        return Content(json, "application/json");
    }

    [HttpPost("{id:guid}/renew")]
    public async Task<IActionResult> Renew(Guid id, [FromBody] object req, CancellationToken ct)
    {
        if (!IsConfigured) return ServiceUnavailable();
        var json = await licenceClient.RenewLicenseAsync(id,
            System.Text.Json.JsonSerializer.Serialize(req), ct);
        return Content(json, "application/json");
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if (!IsConfigured) return ServiceUnavailable();
        var json = await licenceClient.DeleteLicenseAsync(id, ct);
        return Content(json, "application/json");
    }

    private IActionResult ServiceUnavailable() =>
        StatusCode(503, new { error = "Lisans servisi yapılandırılmamış. LicenceService:BaseUrl ayarlanmalıdır." });
}
