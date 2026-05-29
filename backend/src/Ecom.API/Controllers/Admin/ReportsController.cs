using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/reports")]
[Authorize(Roles = "SuperAdmin,Admin,FinanceUser")]
public class ReportsController(IMediator mediator) : ControllerBase
{
    [HttpGet("visitor-stats")]
    public async Task<IActionResult> VisitorStats([FromQuery] int days = 30, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetVisitorStatsQuery(days), ct);
        return Ok(result);
    }

    [HttpGet("product-sales")]
    public async Task<IActionResult> ProductSales([FromQuery] int days = 30, [FromQuery] int topN = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetProductSalesReportQuery(days, topN), ct);
        return Ok(result);
    }

    [HttpGet("queue-stats")]
    public async Task<IActionResult> QueueStats(CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetQueueStatsQuery(), ct);
        return Ok(result);
    }
}
