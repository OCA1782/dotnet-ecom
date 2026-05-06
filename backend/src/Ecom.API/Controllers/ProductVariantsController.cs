using Ecom.Application.Features.Products.Commands.Variants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/products/{productId:guid}/variants")]
public class ProductVariantsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> Create(Guid productId, [FromBody] CreateVariantCommand command, CancellationToken ct)
    {
        if (productId != command.ProductId) return BadRequest("ProductId uyuşmazlığı.");
        var result = await mediator.Send(command, ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return Ok(new { id = result.Data });
    }

    [HttpPut("{variantId:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> Update(Guid productId, Guid variantId, [FromBody] UpdateVariantCommand command, CancellationToken ct)
    {
        if (variantId != command.Id) return BadRequest("VariantId uyuşmazlığı.");
        var result = await mediator.Send(command, ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return NoContent();
    }
}
