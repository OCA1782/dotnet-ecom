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
        [FromQuery] string? sortBy = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetStocksQuery(page, pageSize, search, onlyCritical, sortBy), ct);
        return Ok(result);
    }

    [HttpGet("movements")]
    public async Task<IActionResult> GetAllMovements(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        [FromQuery] string? movementType = null,
        [FromQuery] Guid? productId = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAllStockMovementsQuery(page, pageSize, movementType, productId), ct);
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

    [HttpPost("bulk-adjust")]
    public async Task<IActionResult> BulkAdjust([FromBody] BulkAdjustStockCommand command, CancellationToken ct)
    {
        if (command.ProductIds == null || command.ProductIds.Count == 0)
            return BadRequest(new { error = "En az bir ürün seçilmelidir." });
        var result = await mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPost("bulk-adjust-by-condition")]
    public async Task<IActionResult> BulkAdjustByCondition([FromBody] BulkAdjustStockByConditionCommand command, CancellationToken ct)
    {
        if (command.MinStock == null && command.MaxStock == null)
            return BadRequest(new { error = "En az bir stok koşulu belirtilmelidir." });
        var result = await mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPost("bulk-adjust-by-percentage")]
    public async Task<IActionResult> BulkAdjustByPercentage([FromBody] BulkAdjustStockByPercentageCommand command, CancellationToken ct)
    {
        if (command.ProductIds == null || command.ProductIds.Count == 0)
            return BadRequest(new { error = "En az bir ürün seçilmelidir." });
        if (command.Percentage <= 0)
            return BadRequest(new { error = "Oran 0'dan büyük olmalıdır." });
        var validModes = new[] { "increase", "decrease", "set" };
        if (!validModes.Contains(command.PercentageMode))
            return BadRequest(new { error = "Geçersiz oran modu. Geçerli değerler: increase, decrease, set" });
        var result = await mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpGet("condition-preview")]
    public async Task<IActionResult> ConditionPreview(
        [FromQuery] int? minStock,
        [FromQuery] int? maxStock,
        CancellationToken ct)
    {
        var result = await mediator.Send(new GetStockConditionCountQuery(minStock, maxStock), ct);
        return Ok(new { count = result });
    }

    [HttpDelete("{productId:guid}")]
    public async Task<IActionResult> Delete(Guid productId, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteStockCommand(productId), ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return Ok(new { message = "Stok kaydı silindi." });
    }
}
