using Ecom.Application.Features.Admin.Queries;
using Ecom.Application.Features.Visitor.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api")]
public class VisitorController(IMediator mediator) : ControllerBase
{
    public record LogRequest(string? Page, string? Referrer, double? Latitude, double? Longitude);

    [HttpPost("visitor/log")]
    [AllowAnonymous]
    public async Task<IActionResult> Log([FromBody] LogRequest req, CancellationToken ct)
    {
        await mediator.Send(new LogVisitorCommand(req.Page, req.Referrer, req.Latitude, req.Longitude), ct);
        return Ok();
    }

    [HttpGet("admin/visitor-logs")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? ipAddress = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] string? pageFilter = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? country = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetVisitorLogsQuery(page, pageSize, ipAddress, userId, pageFilter, from, to, country), ct);
        return Ok(result);
    }
}
