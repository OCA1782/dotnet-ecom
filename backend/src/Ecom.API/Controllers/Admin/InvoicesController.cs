using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Invoices.Commands;
using Ecom.Application.Features.Invoices.Queries;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/invoices")]
[Authorize(Roles = "SuperAdmin,Admin,FinanceUser,OrderManager")]
public class InvoicesController(IMediator mediator, IApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] InvoiceStatus? status = null,
        [FromQuery] EInvoiceDocType? docType = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetInvoicesQuery(page, pageSize, status, docType, search, sortBy), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Detail(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetInvoiceDetailQuery(id), ct);
        return result.Succeeded ? Ok(result.Data) : NotFound(new { error = result.Error });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest req, CancellationToken ct)
    {
        Guid orderId = req.OrderId;

        if (orderId == Guid.Empty && !string.IsNullOrWhiteSpace(req.OrderNumber))
        {
            var order = await db.Orders
                .Where(o => o.OrderNumber == req.OrderNumber && !o.IsDeleted)
                .Select(o => o.Id)
                .FirstOrDefaultAsync(ct);
            if (order == Guid.Empty)
                return BadRequest(new { error = $"'{req.OrderNumber}' numaralı sipariş bulunamadı." });
            orderId = order;
        }

        if (orderId == Guid.Empty)
            return BadRequest(new { error = "Sipariş ID veya sipariş numarası zorunludur." });

        var result = await mediator.Send(new CreateInvoiceCommand(orderId, req.DocType, req.Notes), ct);
        return result.Succeeded
            ? Ok(new { id = result.Data })
            : BadRequest(new { error = result.Error });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateInvoiceStatusRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateInvoiceStatusCommand(id, req.Status, req.Notes), ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }
}

public class CreateInvoiceRequest
{
    public Guid OrderId { get; set; }
    public string? OrderNumber { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public EInvoiceDocType DocType { get; set; } = EInvoiceDocType.eArchive;
    public string? Notes { get; set; }
}

public class UpdateInvoiceStatusRequest
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public InvoiceStatus Status { get; set; }
    public string? Notes { get; set; }
}
