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
        var result = await mediator.Send(new GetProductReviewsQuery(productId, page, pageSize), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(Guid productId, [FromBody] CreateReviewRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateReviewCommand
        {
            ProductId = productId,
            UserId = currentUser.UserId!.Value,
            Rating = req.Rating,
            Title = req.Title,
            Body = req.Body
        }, ct);

        return result.Succeeded ? Ok(new { id = result.Data }) : BadRequest(result.Error);
    }
}

public class CreateReviewRequest
{
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string Body { get; set; } = string.Empty;
}
