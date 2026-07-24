using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin.Queries;
using Ecom.Application.Features.Visitor.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api")]
public class VisitorController(IMediator mediator, ICurrentUserService currentUser, IServiceScopeFactory scopeFactory) : ControllerBase
{
    public record LogRequest(string? Page, string? Referrer, double? Latitude, double? Longitude);

    [HttpPost("visitor/log")]
    [AllowAnonymous]
    public IActionResult Log([FromBody] LogRequest req)
    {
        // Capture request-scoped values before response is sent
        var ip        = currentUser.IpAddress;
        var ua        = currentUser.UserAgent;
        var sessionId = currentUser.SessionId;
        var userId    = currentUser.UserId;

        _ = Task.Run(async () =>
        {
            using var scope = scopeFactory.CreateScope();
            var m = scope.ServiceProvider.GetRequiredService<IMediator>();
            await m.Send(new LogVisitorCommand(req.Page, req.Referrer, req.Latitude, req.Longitude, ip, ua, sessionId, userId));
        });

        return NoContent();
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
