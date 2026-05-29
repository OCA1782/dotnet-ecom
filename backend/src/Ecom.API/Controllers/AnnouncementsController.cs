using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/announcements")]
public class AnnouncementsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetActive(
        [FromQuery] string? category = null,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetAnnouncementsQuery(1, pageSize, category, null, null, OnlyActive: true), ct);
        return Ok(result);
    }
}
