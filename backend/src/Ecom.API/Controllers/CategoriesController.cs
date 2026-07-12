using Ecom.Application.Features.Categories.Commands;
using Ecom.Application.Features.Categories.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool onlyActive = true, [FromQuery] bool onlyMenu = false, [FromQuery] bool? showInVehicleNav = null, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetCategoriesQuery(onlyActive, onlyMenu, showInVehicleNav), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/products")]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> GetProducts(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string sortBy = "name",
        [FromQuery] string sortDir = "asc",
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetCategoryProductsQuery(id, page, pageSize, search, sortBy, sortDir), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager,ContentManager")]
    public async Task<IActionResult> Create([FromBody] CreateCategoryCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetAll), new { id = result.Data }, new { id = result.Data });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager,ContentManager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest("ID uyuşmazlığı.");
        var result = await mediator.Send(command, ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Delete(Guid id, [FromQuery] bool cascade = false, CancellationToken ct = default)
    {
        var result = await mediator.Send(new DeleteCategoryCommand(id, cascade), ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return NoContent();
    }
}
