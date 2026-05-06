using Ecom.Application.Features.Stocks.Commands;
using Ecom.Application.Features.Stocks.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin,StockManager")]
public class StocksController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool onlyCritical = false,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetStocksQuery(page, pageSize, search, onlyCritical), ct);
        return Ok(result);
    }

    [HttpGet("{productId:guid}/movements")]
    public async Task<IActionResult> GetMovements(
        Guid productId,
        [FromQuery] Guid? variantId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetStockMovementsQuery(productId, variantId, page, pageSize), ct);
        return Ok(result);
    }

    [HttpPost("adjust")]
    public async Task<IActionResult> Adjust([FromBody] AdjustStockCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return Ok(new { message = "Stok güncellendi." });
    }
}
