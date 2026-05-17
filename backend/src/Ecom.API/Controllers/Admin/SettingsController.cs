using Ecom.Application.Features.Admin.Commands;
using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/settings")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SettingsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var result = await mediator.Send(new GetSettingsQuery(), ct);
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] Dictionary<string, string> settings, CancellationToken ct)
    {
        await mediator.Send(new UpdateSettingsCommand(settings), ct);
        return NoContent();
    }
}
