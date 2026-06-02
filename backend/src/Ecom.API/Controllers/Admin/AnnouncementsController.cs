using Ecom.Application.Features.Admin.Commands;
using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/announcements")]
[Authorize(Roles = "SuperAdmin,Admin,ContentManager")]
public class AnnouncementsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? category = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetAnnouncementsQuery(page, pageSize, category, isActive, search, false, sortBy), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AnnouncementRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateAnnouncementCommand(
            req.Title, req.Summary, req.Content,
            req.MediaUrl, req.MediaType ?? "none",
            req.Category ?? "duyuru",
            req.LinkUrl, req.LinkText,
            req.IsActive, req.StartsAt, req.EndsAt,
            req.DisplayOrder), ct);
        return Ok(new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AnnouncementRequest req, CancellationToken ct)
    {
        var ok = await mediator.Send(new UpdateAnnouncementCommand(
            id, req.Title, req.Summary, req.Content,
            req.MediaUrl, req.MediaType ?? "none",
            req.Category ?? "duyuru",
            req.LinkUrl, req.LinkText,
            req.IsActive, req.StartsAt, req.EndsAt,
            req.DisplayOrder), ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new DeleteAnnouncementCommand(id), ct);
        return ok ? NoContent() : NotFound();
    }
}

public record AnnouncementRequest(
    string Title,
    string? Summary,
    string? Content,
    string? MediaUrl,
    string? MediaType,
    string? Category,
    string? LinkUrl,
    string? LinkText,
    bool IsActive,
    DateTime? StartsAt,
    DateTime? EndsAt,
    int DisplayOrder
);
