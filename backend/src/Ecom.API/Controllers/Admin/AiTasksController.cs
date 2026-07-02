using Ecom.Application.Features.Admin.AiTasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/ai-tasks")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AiTasksController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default) =>
        Ok(await mediator.Send(new GetAiTasksQuery(page, pageSize, status, type, search), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAiTaskRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateAiTaskCommand(
            req.Title, req.Description, req.Type,
            req.Images.Select(i => new CreateAiTaskImageInput(i.ImageUrl, i.FileName, i.SortOrder)).ToList()
        ), ct);
        return Ok(new { id });
    }

    [HttpPost("{id:guid}/run")]
    public async Task<IActionResult> Run(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new RunAiTaskCommand(id), ct);
        return ok ? Ok() : NotFound();
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new CancelAiTaskCommand(id), ct);
        return ok ? Ok() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new DeleteAiTaskCommand(id), ct);
        return ok ? Ok() : NotFound();
    }
}

public record CreateAiTaskImageRequest(string ImageUrl, string FileName, int SortOrder);
public record CreateAiTaskRequest(string Title, string Description, string Type, List<CreateAiTaskImageRequest> Images);
