using Ecom.Application.Features.Reviews.Commands;
using Ecom.Application.Features.Reviews.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/reviews")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class ReviewsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isApproved = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? hasReports = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAdminReviewsQuery(page, pageSize, isApproved, search, hasReports), ct);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(
            new ApproveReviewCommand(id, req.Approved, req.RejectionNote, req.NotifyUser), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteReviewCommand(id), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    // GET /api/admin/reviews/{id}/reports
    [HttpGet("{id:guid}/reports")]
    public async Task<IActionResult> GetReports(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetReviewReportsQuery(id), ct);
        return Ok(result);
    }

    // POST /api/admin/reviews/{id}/reports/{reportId}/resolve
    [HttpPost("{id:guid}/reports/{reportId:guid}/resolve")]
    public async Task<IActionResult> ResolveReport(Guid id, Guid reportId, CancellationToken ct)
    {
        var result = await mediator.Send(new ResolveReviewReportCommand(reportId), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    // GET /api/admin/reviews/{id}/replies
    [HttpGet("{id:guid}/replies")]
    public async Task<IActionResult> GetReplies(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetReviewRepliesQuery(id), ct);
        return Ok(result);
    }
}

public class ApproveRequest
{
    public bool Approved { get; set; }
    public string? RejectionNote { get; set; }
    public bool NotifyUser { get; set; }
}
