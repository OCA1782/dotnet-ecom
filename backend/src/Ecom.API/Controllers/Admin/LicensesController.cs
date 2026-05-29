using Ecom.Application.Features.Admin.Commands;
using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/licenses")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class LicensesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetLicensesQuery(), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertLicenseRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpsertLicenseCommand
        {
            Module      = req.Module,
            Description = req.Description,
            ExpiresAt   = req.ExpiresAt,
            IsActive    = req.IsActive,
            Notes       = req.Notes,
        }, ct);
        return result.Succeeded ? Ok(new { id = result.Data }) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertLicenseRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpsertLicenseCommand
        {
            Id          = id,
            Module      = req.Module,
            Description = req.Description,
            ExpiresAt   = req.ExpiresAt,
            IsActive    = req.IsActive,
            Notes       = req.Notes,
        }, ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/renew")]
    public async Task<IActionResult> Renew(Guid id, [FromBody] RenewLicenseRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new RenewLicenseCommand(id, req.Months), ct);
        return result.Succeeded
            ? Ok(new { newExpiresAt = result.Data })
            : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteLicenseCommand(id), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }
}

public class RenewLicenseRequest
{
    public int Months { get; set; } = 12;
}

public class UpsertLicenseRequest
{
    public string Module { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}
