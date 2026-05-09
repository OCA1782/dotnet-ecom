using Ecom.Application.Features.Admin.Commands;
using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class UsersController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetUsersQuery(page, pageSize, search), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAdminUserCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return Ok(new { id = result.Data });
    }
}
