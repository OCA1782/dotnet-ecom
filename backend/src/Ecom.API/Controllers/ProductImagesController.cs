using Ecom.Application.Features.Products.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/products/{productId:guid}/images")]
[Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
public class ProductImagesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Add(Guid productId, [FromBody] AddProductImageCommand command, CancellationToken ct)
    {
        if (productId != command.ProductId) return BadRequest("ProductId uyuşmazlığı.");
        var result = await mediator.Send(command, ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return Ok(new { id = result.Data });
    }

    [HttpDelete("{imageId:guid}")]
    public async Task<IActionResult> Delete(Guid productId, Guid imageId, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteProductImageCommand(imageId), ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return NoContent();
    }
}
