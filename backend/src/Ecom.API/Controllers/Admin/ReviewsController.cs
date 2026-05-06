using Ecom.Application.Features.Reviews.Commands;
using Ecom.Application.Features.Reviews.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/reviews")]
[Authorize(Roles = "Admin")]
public class ReviewsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isApproved = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAdminReviewsQuery(page, pageSize, isApproved, search), ct);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new ApproveReviewCommand(id, req.Approved), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteReviewCommand(id), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }
}

public class ApproveRequest
{
    public bool Approved { get; set; }
}
