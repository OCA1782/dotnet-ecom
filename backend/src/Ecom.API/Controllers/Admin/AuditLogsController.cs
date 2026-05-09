using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/audit-logs")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AuditLogsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        [FromQuery] string? entityName = null,
        [FromQuery] string? action = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAuditLogsQuery(page, pageSize, entityName, action), ct);
        return Ok(result);
    }
}
