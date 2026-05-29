using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Shipments.Commands;
using Ecom.Application.Features.Shipments.Queries;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/shipments")]
[Authorize(Roles = "SuperAdmin,Admin,OrderManager")]
public class ShipmentsController(IMediator mediator, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetShipmentsQuery(page, pageSize, status, search), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShipmentRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateShipmentCommand(
            req.OrderId, req.CargoCompany, req.TrackingNumber, req.TrackingUrl, currentUser.UserId), ct);

        return result.Succeeded ? Ok(new { shipmentId = result.Data }) : BadRequest(new { error = result.Error });
    }

    [HttpPatch("{shipmentId:guid}")]
    public async Task<IActionResult> Update(Guid shipmentId, [FromBody] UpdateShipmentRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateShipmentCommand(
            shipmentId, req.CargoCompany, req.TrackingNumber, req.TrackingUrl, req.Status), ct);

        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }
}

public class CreateShipmentRequest
{
    public Guid OrderId { get; set; }
    public string CargoCompany { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public string? TrackingUrl { get; set; }
}

public class UpdateShipmentRequest
{
    public string CargoCompany { get; set; } = string.Empty;
    public string? TrackingNumber { get; set; }
    public string? TrackingUrl { get; set; }
    public ShipmentStatus Status { get; set; } = ShipmentStatus.Shipped;
}
