using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Orders.Commands;
using Ecom.Application.Features.Orders.Queries;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController(IMediator mediator, ICurrentUserService currentUser) : ControllerBase
{
    private const string SessionCookieName = "guest_session_id";

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateOrderCommand(
            currentUser.UserId, null,
            req.ShippingAddressId, req.BillingAddressId, req.Note), ct);

        return result.Succeeded
            ? Ok(new { orderNumber = result.Data!.OrderNumber, id = result.Data.OrderId })
            : BadRequest(new { error = result.Error });
    }

    [HttpPost("guest")]
    public async Task<IActionResult> CreateGuest([FromBody] CreateGuestOrderRequest req, CancellationToken ct)
    {
        var sessionId = Request.Cookies.TryGetValue(SessionCookieName, out var sid) ? sid : null;
        if (string.IsNullOrEmpty(sessionId))
            return BadRequest(new { error = "Oturum bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin." });

        var address = new GuestAddressInfo(
            req.FirstName, req.LastName, req.Phone,
            req.City, req.District, req.FullAddress, req.PostalCode);

        var result = await mediator.Send(new CreateOrderCommand(
            null, sessionId, null, null, req.Note, req.GuestEmail, address), ct);

        return result.Succeeded
            ? Ok(new { orderNumber = result.Data!.OrderNumber, id = result.Data.OrderId })
            : BadRequest(new { error = result.Error });
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMy(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] string? statuses = null,
        CancellationToken ct = default)
    {
        List<OrderStatus>? statusList = null;
        if (!string.IsNullOrEmpty(statuses))
        {
            statusList = statuses
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s.Trim(), out var v) ? (OrderStatus?)v : null)
                .Where(v => v.HasValue)
                .Select(v => v!.Value)
                .ToList();
        }
        var result = await mediator.Send(new GetMyOrdersQuery(currentUser.UserId!.Value, page, pageSize, statusList), ct);
        return Ok(result);
    }

    [HttpGet("{orderNumber}")]
    [Authorize]
    public async Task<IActionResult> GetDetail(string orderNumber, CancellationToken ct)
    {
        var result = await mediator.Send(new GetOrderQuery(orderNumber, currentUser.UserId), ct);
        return result.Succeeded ? Ok(result.Data) : NotFound(result.Error);
    }

    [HttpPatch("{id:guid}/address")]
    [Authorize]
    public async Task<IActionResult> UpdateAddress(Guid id, [FromBody] UpdateOrderAddressRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateOrderAddressCommand(
            id, currentUser.UserId!.Value,
            req.ShippingAddressId,
            req.FirstName, req.LastName, req.Phone,
            req.City, req.District, req.FullAddress, req.PostalCode,
            req.BillingAddressId,
            req.BillingFirstName, req.BillingLastName, req.BillingPhone,
            req.BillingCity, req.BillingDistrict, req.BillingFullAddress, req.BillingPostalCode), ct);
        return result.Succeeded ? NoContent() : BadRequest(new { error = result.Error });
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelOrderRequest? req, CancellationToken ct)
    {
        var result = await mediator.Send(new CancelOrderCommand(id, currentUser.UserId, req?.Reason), ct);
        return result.Succeeded ? NoContent() : BadRequest(new { error = result.Error });
    }

    [HttpPost("{orderNumber}/request-refund")]
    [Authorize]
    public async Task<IActionResult> RequestRefund(string orderNumber, [FromBody] RequestRefundRequest? req, CancellationToken ct)
    {
        var result = await mediator.Send(new RequestRefundCommand(currentUser.UserId!.Value, orderNumber, req?.Reason), ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpGet("track")]
    public async Task<IActionResult> Track(
        [FromQuery] string orderNumber,
        [FromQuery] string email,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(orderNumber) || string.IsNullOrWhiteSpace(email))
            return BadRequest(new { error = "Sipariş numarası ve e-posta zorunludur." });

        var result = await mediator.Send(new GetOrderQuery(orderNumber), ct);
        if (!result.Succeeded) return NotFound(new { error = result.Error });

        var order = result.Data!;
        var emailMatch = (order.GuestEmail ?? "").Equals(email, StringComparison.OrdinalIgnoreCase);

        if (!emailMatch)
            return NotFound(new { error = "Sipariş bulunamadı veya e-posta eşleşmiyor." });

        return Ok(result.Data);
    }

    // Admin endpoints
    [HttpGet("admin/list")]
    [Authorize(Roles = "SuperAdmin,Admin,OrderManager")]
    public async Task<IActionResult> AdminList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAdminOrdersQuery(page, pageSize, status, search), ct);
        return Ok(result);
    }

    [HttpGet("admin/{orderNumber}")]
    [Authorize(Roles = "SuperAdmin,Admin,OrderManager,CustomerSupport")]
    public async Task<IActionResult> AdminGetDetail(string orderNumber, CancellationToken ct)
    {
        var result = await mediator.Send(new GetOrderQuery(orderNumber), ct);
        return result.Succeeded ? Ok(result.Data) : NotFound(result.Error);
    }

    [HttpPost("admin/{id:guid}/cancel")]
    [Authorize(Roles = "SuperAdmin,Admin,OrderManager")]
    public async Task<IActionResult> AdminCancel(Guid id, [FromBody] CancelOrderRequest? req, CancellationToken ct)
    {
        var result = await mediator.Send(new CancelOrderCommand(id, null, req?.Reason), ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpPut("admin/{id:guid}/status")]
    [Authorize(Roles = "SuperAdmin,Admin,OrderManager")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateOrderStatusCommand(
            id, req.Status, currentUser.UserId, req.Note), ct);
        return result.Succeeded ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpDelete("admin/{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> AdminDelete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteOrderCommand(id), ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return NoContent();
    }

    [HttpGet("admin/export")]
    [Authorize(Roles = "SuperAdmin,Admin,FinanceUser,OrderManager")]
    public async Task<IActionResult> Export(
        [FromQuery] OrderStatus? status = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var rows = await mediator.Send(new ExportAdminOrdersQuery(status, from, to, search), ct);

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Sipariş No,Tarih,Durum,Ödeme,Kargo,Ürün Sayısı,Toplam (TL),Müşteri");
        foreach (var r in rows)
            sb.AppendLine($"{r.OrderNumber},{r.CreatedDate},{r.Status},{r.PaymentStatus},{r.ShipmentStatus},{r.ItemCount},{r.GrandTotal:F2},{r.CustomerEmail}");

        var bytes = System.Text.Encoding.UTF8.GetPreamble()
            .Concat(System.Text.Encoding.UTF8.GetBytes(sb.ToString()))
            .ToArray();

        var filename = $"siparisler-{DateTime.Now:yyyyMMdd}.csv";
        return File(bytes, "text/csv; charset=utf-8", filename);
    }
}

public class UpdateOrderStatusRequest
{
    public OrderStatus Status { get; set; }
    public string? Note { get; set; }
}

public class CreateOrderRequest
{
    public Guid ShippingAddressId { get; set; }
    public Guid? BillingAddressId { get; set; }
    public string? Note { get; set; }
}

public class CreateGuestOrderRequest
{
    public string GuestEmail { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string City { get; set; } = "";
    public string District { get; set; } = "";
    public string FullAddress { get; set; } = "";
    public string? PostalCode { get; set; }
    public string? Note { get; set; }
}

public class UpdateOrderAddressRequest
{
    // Shipping: saved address OR inline
    public Guid? ShippingAddressId { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? FullAddress { get; set; }
    public string? PostalCode { get; set; }
    // Billing: saved address OR inline (null = same as shipping)
    public Guid? BillingAddressId { get; set; }
    public string? BillingFirstName { get; set; }
    public string? BillingLastName { get; set; }
    public string? BillingPhone { get; set; }
    public string? BillingCity { get; set; }
    public string? BillingDistrict { get; set; }
    public string? BillingFullAddress { get; set; }
    public string? BillingPostalCode { get; set; }
}

public class CancelOrderRequest
{
    public string? Reason { get; set; }
}

public class RequestRefundRequest
{
    public string? Reason { get; set; }
}
