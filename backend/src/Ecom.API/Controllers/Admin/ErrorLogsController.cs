using Ecom.Application.Features.Admin.Commands;
using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/error-logs")]
public class ErrorLogsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        [FromQuery] string? source = null,
        [FromQuery] string? level = null,
        [FromQuery] string? search = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetErrorLogsQuery(page, pageSize, source, level, search, startDate, endDate), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Log([FromBody] LogErrorRequest req, CancellationToken ct)
    {
        var userEmail = User.Identity?.IsAuthenticated == true
            ? User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value
            : null;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.FirstOrDefault();

        await mediator.Send(new LogErrorCommand(
            req.Source ?? "Frontend",
            req.Level ?? "Error",
            req.Message,
            req.StackTrace,
            req.Path,
            userEmail,
            ip,
            ua,
            req.StatusCode
        ), ct);

        return NoContent();
    }
}

public record LogErrorRequest(
    string? Source,
    string? Level,
    string Message,
    string? StackTrace,
    string? Path,
    int? StatusCode
);
