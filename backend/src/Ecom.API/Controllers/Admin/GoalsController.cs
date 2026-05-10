using Ecom.Application.Features.Admin.Commands;
using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/goals")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class GoalsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? year = null, CancellationToken ct = default)
    {
        var y = year ?? DateTime.UtcNow.Year;
        var result = await mediator.Send(new GetSalesGoalsQuery(y), ct);
        return Ok(result);
    }

    [HttpPut("{year:int}/{month:int}")]
    public async Task<IActionResult> Upsert(int year, int month, [FromBody] UpsertGoalRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpsertSalesGoalCommand(year, month, req.TargetRevenue, req.TargetOrderCount), ct);
        return result.Succeeded ? NoContent() : BadRequest(result.Error);
    }
}

public record UpsertGoalRequest(decimal TargetRevenue, int TargetOrderCount);
