using Ecom.Application.Features.Admin.Coupons;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/coupons")]
[Authorize(Roles = "SuperAdmin,Admin,FinanceUser")]
public class CouponsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool includeInactive = false,
        [FromQuery] string? search = null,
        [FromQuery] int? type = null,
        [FromQuery] string? sortBy = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetCouponsQuery(page, pageSize, includeInactive, search, type, sortBy), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCouponCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.Succeeded ? Ok(new { id = result.Data }) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCouponCommand command, CancellationToken ct)
    {
        command.Id = id;
        var result = await mediator.Send(command, ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteCouponCommand(id), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    [HttpGet("usages")]
    public async Task<IActionResult> GetUsages(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetCouponUsagesQuery(null, page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/usages")]
    public async Task<IActionResult> GetCouponUsages(Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetCouponUsagesQuery(id, page, pageSize), ct);
        return Ok(result);
    }
}
