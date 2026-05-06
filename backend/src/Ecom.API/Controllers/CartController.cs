using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Cart.Commands;
using Ecom.Application.Features.Cart.Queries;
using Ecom.Application.Features.Coupons.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CartController(IMediator mediator, ICurrentUserService currentUser) : ControllerBase
{
    private const string SessionCookieName = "guest_session_id";

    private string? GetOrCreateSessionId()
    {
        if (Request.Cookies.TryGetValue(SessionCookieName, out var existing))
            return existing;

        var newId = Guid.NewGuid().ToString("N");
        Response.Cookies.Append(SessionCookieName, newId, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(30)
        });
        return newId;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        Guid? userId = currentUser.IsAuthenticated ? currentUser.UserId : null;
        string? sessionId = userId.HasValue ? null : GetOrCreateSessionId();

        var result = await mediator.Send(new GetCartQuery(userId, sessionId), ct);
        return Ok(result);
    }

    [HttpPost("add")]
    public async Task<IActionResult> Add([FromBody] AddToCartRequest req, CancellationToken ct)
    {
        Guid? userId = currentUser.IsAuthenticated ? currentUser.UserId : null;
        string? sessionId = userId.HasValue ? null : GetOrCreateSessionId();

        var result = await mediator.Send(new AddToCartCommand(
            userId, sessionId, req.ProductId, req.VariantId, req.Quantity), ct);

        return result.Succeeded ? Ok(new { cartId = result.Data }) : BadRequest(result.Error);
    }

    [HttpPut("update")]
    public async Task<IActionResult> Update([FromBody] UpdateCartItemRequest req, CancellationToken ct)
    {
        Guid? userId = currentUser.IsAuthenticated ? currentUser.UserId : null;
        string? sessionId = userId.HasValue ? null : GetSessionId();

        var result = await mediator.Send(new UpdateCartItemCommand(
            req.CartItemId, userId, sessionId, req.Quantity), ct);

        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    [HttpDelete("remove/{cartItemId:guid}")]
    public async Task<IActionResult> Remove(Guid cartItemId, CancellationToken ct)
    {
        Guid? userId = currentUser.IsAuthenticated ? currentUser.UserId : null;
        string? sessionId = userId.HasValue ? null : GetSessionId();

        var result = await mediator.Send(new RemoveFromCartCommand(cartItemId, userId, sessionId), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    [HttpDelete("clear")]
    public async Task<IActionResult> Clear(CancellationToken ct)
    {
        Guid? userId = currentUser.IsAuthenticated ? currentUser.UserId : null;
        string? sessionId = userId.HasValue ? null : GetSessionId();

        var result = await mediator.Send(new ClearCartCommand(userId, sessionId), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    [HttpPost("merge")]
    [Authorize]
    public async Task<IActionResult> Merge(CancellationToken ct)
    {
        var sessionId = GetSessionId();
        if (string.IsNullOrEmpty(sessionId)) return Ok();

        var result = await mediator.Send(new MergeGuestCartCommand(sessionId, currentUser.UserId!.Value), ct);

        Response.Cookies.Delete(SessionCookieName);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    [HttpPost("apply-coupon")]
    public async Task<IActionResult> ApplyCoupon([FromBody] ApplyCouponRequest req, CancellationToken ct)
    {
        Guid? userId = currentUser.IsAuthenticated ? currentUser.UserId : null;
        string? sessionId = userId.HasValue ? null : GetSessionId();

        var result = await mediator.Send(new ApplyCouponCommand(req.Code, userId, sessionId), ct);
        return result.Succeeded ? Ok(result.Data) : BadRequest(result.Error);
    }

    [HttpDelete("remove-coupon")]
    public async Task<IActionResult> RemoveCoupon(CancellationToken ct)
    {
        Guid? userId = currentUser.IsAuthenticated ? currentUser.UserId : null;
        string? sessionId = userId.HasValue ? null : GetSessionId();

        var result = await mediator.Send(new RemoveCouponCommand(userId, sessionId), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    private string? GetSessionId() =>
        Request.Cookies.TryGetValue(SessionCookieName, out var id) ? id : null;
}

public class AddToCartRequest
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; }
}

public class UpdateCartItemRequest
{
    public Guid CartItemId { get; set; }
    public int Quantity { get; set; }
}

public class ApplyCouponRequest
{
    public string Code { get; set; } = string.Empty;
}
