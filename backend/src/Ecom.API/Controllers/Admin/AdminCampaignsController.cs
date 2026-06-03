using Ecom.Application.Features.Campaigns;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/campaigns")]
[Authorize(Roles = "SuperAdmin,Admin,ContentManager")]
public class AdminCampaignsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetCampaignsQuery(OnlyActive: false), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CampaignRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateCampaignCommand(req.Title, req.Subtitle, req.Icon, req.ColorScheme, req.ImageUrl, req.StylesJson, req.LinkUrl, req.LinkText, req.DisplayOrder, req.IsActive), ct);
        return result.Succeeded ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CampaignRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateCampaignCommand(id, req.Title, req.Subtitle, req.Icon, req.ColorScheme, req.ImageUrl, req.StylesJson, req.LinkUrl, req.LinkText, req.DisplayOrder, req.IsActive), ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteCampaignCommand(id), ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }
}

public class CampaignRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string Icon { get; set; } = "🏷️";
    public string ColorScheme { get; set; } = "orange";
    public string? ImageUrl { get; set; }
    public string? StylesJson { get; set; }
    public string? LinkUrl { get; set; }
    public string? LinkText { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
