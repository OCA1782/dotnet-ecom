using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Invoices.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController(IMediator mediator, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet("my")]
    public async Task<IActionResult> GetMy(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetMyInvoicesQuery(currentUser.UserId!.Value, page, pageSize), ct);
        return Ok(result);
    }
}
