using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Orders.Commands;
using Ecom.Application.Features.Orders.Queries;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController(IMediator mediator, ICurrentUserService currentUser) : ControllerBase
{
    private const string SessionCookieName = "guest_session_id";

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateOrderCommand(
            currentUser.UserId, null,
            req.ShippingAddressId, req.BillingAddressId, req.Note), ct);

        return result.Succeeded
            ? Ok(new { orderNumber = result.Data })
            : BadRequest(result.Error);
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMy(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetMyOrdersQuery(currentUser.UserId!.Value, page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("{orderNumber}")]
    [Authorize]
    public async Task<IActionResult> GetDetail(string orderNumber, CancellationToken ct)
    {
        var result = await mediator.Send(new GetOrderQuery(orderNumber, currentUser.UserId), ct);
        return result.Succeeded ? Ok(result.Data) : NotFound(result.Error);
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelOrderRequest? req, CancellationToken ct)
    {
        var result = await mediator.Send(new CancelOrderCommand(id, currentUser.UserId, req?.Reason), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    // Admin endpoints
    [HttpGet("admin/list")]
    [Authorize(Roles = "SuperAdmin,Admin,OrderManager")]
    public async Task<IActionResult> AdminList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAdminOrdersQuery(page, pageSize, status, search), ct);
        return Ok(result);
    }

    [HttpGet("admin/{orderNumber}")]
    [Authorize(Roles = "SuperAdmin,Admin,OrderManager,CustomerSupport")]
    public async Task<IActionResult> AdminGetDetail(string orderNumber, CancellationToken ct)
    {
        var result = await mediator.Send(new GetOrderQuery(orderNumber), ct);
        return result.Succeeded ? Ok(result.Data) : NotFound(result.Error);
    }

    [HttpPost("admin/{id:guid}/cancel")]
    [Authorize(Roles = "SuperAdmin,Admin,OrderManager")]
    public async Task<IActionResult> AdminCancel(Guid id, [FromBody] CancelOrderRequest? req, CancellationToken ct)
    {
        var result = await mediator.Send(new CancelOrderCommand(id, null, req?.Reason), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    [HttpPut("admin/{id:guid}/status")]
    [Authorize(Roles = "SuperAdmin,Admin,OrderManager")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateOrderStatusCommand(
            id, req.Status, currentUser.UserId, req.Note), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }
}

public class UpdateOrderStatusRequest
{
    public OrderStatus Status { get; set; }
    public string? Note { get; set; }
}

public class CreateOrderRequest
{
    public Guid ShippingAddressId { get; set; }
    public Guid? BillingAddressId { get; set; }
    public string? Note { get; set; }
}

public class CancelOrderRequest
{
    public string? Reason { get; set; }
}
