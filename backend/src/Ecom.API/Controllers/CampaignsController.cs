using Ecom.Application.Features.Campaigns;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/campaigns")]
public class CampaignsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetActive([FromQuery] bool featured = false, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetCampaignsQuery(OnlyActive: true, OnlyFeatured: featured), ct);
        return Ok(result);
    }
}
