using Ecom.Application.Features.ShippingCarriers.Commands;
using Ecom.Application.Features.ShippingCarriers.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/shipping-carriers")]
[Authorize(Roles = "SuperAdmin,Admin,OrderManager")]
public class ShippingCarriersController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] bool? onlyActive, CancellationToken ct)
    {
        var result = await mediator.Send(new GetShippingCarriersQuery(onlyActive), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShippingCarrierRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateShippingCarrierCommand(
            req.Name, req.Code, req.BasePrice, req.FreeShippingThreshold,
            req.EstimatedDays, req.MaxWeightKg, req.TrackingUrlTemplate,
            req.LogoUrl, req.ApiEndpoint, req.Notes, req.WeightPricingJson), ct);

        return result.Succeeded
            ? Ok(new { id = result.Data })
            : BadRequest(new { error = result.Error });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateShippingCarrierRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateShippingCarrierCommand(
            id, req.Name, req.Code, req.IsActive, req.BasePrice, req.FreeShippingThreshold,
            req.EstimatedDays, req.MaxWeightKg, req.TrackingUrlTemplate,
            req.LogoUrl, req.ApiEndpoint, req.Notes, req.WeightPricingJson), ct);

        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteShippingCarrierCommand(id), ct);
        return result.Succeeded ? NoContent() : BadRequest(new { error = result.Error });
    }
}

public class CreateShippingCarrierRequest
{
    public string Name { get; set; } = "";
    public string Code { get; set; } = "";
    public decimal BasePrice { get; set; }
    public decimal? FreeShippingThreshold { get; set; }
    public int EstimatedDays { get; set; } = 1;
    public decimal? MaxWeightKg { get; set; }
    public string? TrackingUrlTemplate { get; set; }
    public string? LogoUrl { get; set; }
    public string? ApiEndpoint { get; set; }
    public string? Notes { get; set; }
    public string? WeightPricingJson { get; set; }
}

public class UpdateShippingCarrierRequest : CreateShippingCarrierRequest
{
    public bool IsActive { get; set; } = true;
}
