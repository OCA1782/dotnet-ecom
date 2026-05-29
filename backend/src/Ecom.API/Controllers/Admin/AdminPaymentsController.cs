using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin.Commands;
using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/payments")]
[Authorize(Roles = "SuperAdmin,Admin,FinanceUser")]
public class AdminPaymentsController(IMediator mediator, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var (items, total) = await mediator.Send(new GetAdminPaymentsQuery(status, page, pageSize), ct);
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id:guid}/logs")]
    public async Task<IActionResult> Logs(Guid id, CancellationToken ct)
    {
        var (orderNumber, logs) = await mediator.Send(new GetAdminPaymentLogsQuery(id), ct);
        return Ok(new { orderNumber, logs });
    }

    [HttpPut("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] PaymentActionRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new ApprovePaymentCommand(id, currentUser.UserId, req.Note), ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpPut("{id:guid}/suspend")]
    public async Task<IActionResult> Suspend(Guid id, [FromBody] PaymentActionRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new SuspendPaymentCommand(id, currentUser.UserId, req.Note), ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpPut("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] PaymentActionRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new RejectPaymentCommand(id, currentUser.UserId, req.Note), ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }
}

public class PaymentActionRequest
{
    public string? Note { get; set; }
}
