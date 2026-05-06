using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Shipments.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/shipments")]
[Authorize(Roles = "SuperAdmin,Admin,OrderManager")]
public class ShipmentsController(IMediator mediator, ICurrentUserService currentUser) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShipmentRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateShipmentCommand(
            req.OrderId, req.CargoCompany, req.TrackingNumber, req.TrackingUrl, currentUser.UserId), ct);

        return result.Succeeded ? Ok(new { shipmentId = result.Data }) : BadRequest(result.Error);
    }
}

public class CreateShipmentRequest
{
    public Guid OrderId { get; set; }
    public string CargoCompany { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public string? TrackingUrl { get; set; }
}
