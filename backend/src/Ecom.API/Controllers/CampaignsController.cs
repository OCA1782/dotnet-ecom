using Ecom.Application.Features.Campaigns;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/campaigns")]
public class CampaignsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetActive(CancellationToken ct)
    {
        var result = await mediator.Send(new GetCampaignsQuery(OnlyActive: true), ct);
        return Ok(result);
    }
}
