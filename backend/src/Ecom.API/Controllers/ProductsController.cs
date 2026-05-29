using Ecom.Application.Features.Products.Commands;
using Ecom.Application.Features.Products.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? categorySlug = null,
        [FromQuery] Guid? brandId = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] bool? inStock = null,
        [FromQuery] bool? featured = null,
        [FromQuery] bool? onSale = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? brandIds = null,
        [FromQuery] int? minRating = null,
        [FromQuery] string? attributes = null,
        [FromQuery] bool? onlyActive = null,
        CancellationToken ct = default)
    {
        var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("Admin") || User.IsInRole("ProductManager");
        var result = await mediator.Send(new GetProductsQuery(
            page, pageSize, search, categoryId, categorySlug, brandId, minPrice, maxPrice, inStock, isAdmin, featured, onSale, sortBy, brandIds, minRating, attributes, onlyActive), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductByIdQuery(id), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductBySlugQuery(slug), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> Create([FromBody] CreateProductCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetBySlug), new { slug = command.Slug }, new { id = result.Data });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest("ID uyuşmazlığı.");
        var result = await mediator.Send(command, ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return NoContent();
    }

    [HttpGet("attributes")]
    public async Task<IActionResult> GetAttributes([FromQuery] string? categorySlug = null, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetProductAttributesQuery(categorySlug), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteProductCommand(id), ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return NoContent();
    }

    [HttpGet("{id:guid}/history")]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> GetHistory(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductHistoryQuery(id), ct);
        return Ok(result);
    }
}
