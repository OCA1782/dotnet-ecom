using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Wishlist;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WishlistController(IMediator mediator, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetWishlist(CancellationToken ct)
    {
        var items = await mediator.Send(new GetWishlistQuery(currentUser.UserId!.Value), ct);
        return Ok(items);
    }

    [HttpPost("{productId:guid}")]
    public async Task<IActionResult> Add(Guid productId, CancellationToken ct)
    {
        var result = await mediator.Send(new AddToWishlistCommand(currentUser.UserId!.Value, productId), ct);
        return result.Succeeded ? Ok(new { id = result.Data }) : BadRequest(new { error = result.Error });
    }

    [HttpDelete("{productId:guid}")]
    public async Task<IActionResult> Remove(Guid productId, CancellationToken ct)
    {
        var result = await mediator.Send(new RemoveFromWishlistCommand(currentUser.UserId!.Value, productId), ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }
}
