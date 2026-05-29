using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Reviews.Commands;
using Ecom.Application.Features.Reviews.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/products/{productId:guid}/reviews")]
public class ReviewsController(IMediator mediator, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetReviews(
        Guid productId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetProductReviewsQuery(productId, page, pageSize, currentUser.UserId), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(Guid productId, [FromBody] CreateReviewRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateReviewCommand
        {
            ProductId = productId,
            UserId    = currentUser.UserId!.Value,
            Rating    = req.Rating,
            Title     = req.Title,
            Body      = req.Body
        }, ct);

        return result.Succeeded ? Ok(new { id = result.Data }) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid productId, Guid id, [FromBody] UpdateReviewRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateReviewCommand
        {
            Id     = id,
            UserId = currentUser.UserId!.Value,
            Rating = req.Rating,
            Title  = req.Title,
            Body   = req.Body
        }, ct);

        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    // POST .../reviews/{reviewId}/like  — toggle beğeni
    [HttpPost("{reviewId:guid}/like")]
    [Authorize]
    public async Task<IActionResult> ToggleLike(Guid productId, Guid reviewId, CancellationToken ct)
    {
        var result = await mediator.Send(new ToggleReviewLikeCommand(reviewId, currentUser.UserId!.Value, IsLike: true), ct);
        return result.Succeeded ? Ok(new { active = result.Data }) : BadRequest(result.Error);
    }

    // POST .../reviews/{reviewId}/dislike  — toggle beğenmeme
    [HttpPost("{reviewId:guid}/dislike")]
    [Authorize]
    public async Task<IActionResult> ToggleDislike(Guid productId, Guid reviewId, CancellationToken ct)
    {
        var result = await mediator.Send(new ToggleReviewLikeCommand(reviewId, currentUser.UserId!.Value, IsLike: false), ct);
        return result.Succeeded ? Ok(new { active = result.Data }) : BadRequest(result.Error);
    }

    // GET .../reviews/{reviewId}/replies
    [HttpGet("{reviewId:guid}/replies")]
    public async Task<IActionResult> GetReplies(Guid productId, Guid reviewId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetReviewRepliesQuery(reviewId), ct);
        return Ok(result);
    }

    // POST .../reviews/{reviewId}/replies
    [HttpPost("{reviewId:guid}/replies")]
    [Authorize]
    public async Task<IActionResult> CreateReply(Guid productId, Guid reviewId, [FromBody] CreateReplyRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateReviewReplyCommand
        {
            ReviewId = reviewId,
            UserId   = currentUser.UserId!.Value,
            Body     = req.Body
        }, ct);

        return result.Succeeded ? Ok(new { id = result.Data }) : BadRequest(result.Error);
    }

    // POST .../reviews/{reviewId}/report  — şikayet
    [HttpPost("{reviewId:guid}/report")]
    [Authorize]
    public async Task<IActionResult> Report(Guid productId, Guid reviewId, [FromBody] CreateReportRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateReviewReportCommand(reviewId, currentUser.UserId!.Value, req.Reason), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }
}

public class CreateReviewRequest
{
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string Body { get; set; } = string.Empty;
}

public class UpdateReviewRequest
{
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string Body { get; set; } = string.Empty;
}

public class CreateReplyRequest
{
    public string Body { get; set; } = string.Empty;
}

public class CreateReportRequest
{
    public string Reason { get; set; } = string.Empty;
}
