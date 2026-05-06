using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Addresses.Commands;
using Ecom.Application.Features.Addresses.Queries;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AddressesController(IMediator mediator, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetAddressesQuery(currentUser.UserId!.Value), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAddressRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateAddressCommand(
            currentUser.UserId!.Value,
            req.AddressTitle, req.FirstName, req.LastName, req.PhoneNumber,
            req.City, req.District, req.Neighborhood, req.FullAddress, req.PostalCode,
            req.IsDefaultShipping, req.IsDefaultBilling,
            req.InvoiceType, req.TaxNumber, req.TaxOffice, req.CompanyName), ct);

        return result.Succeeded ? Ok(new { id = result.Data }) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAddressRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateAddressCommand(
            id, currentUser.UserId!.Value,
            req.AddressTitle, req.FirstName, req.LastName, req.PhoneNumber,
            req.City, req.District, req.Neighborhood, req.FullAddress, req.PostalCode,
            req.IsDefaultShipping, req.IsDefaultBilling,
            req.InvoiceType, req.TaxNumber, req.TaxOffice, req.CompanyName), ct);

        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteAddressCommand(id, currentUser.UserId!.Value), ct);
        return result.Succeeded ? Ok() : BadRequest(result.Error);
    }
}

public class CreateAddressRequest
{
    public string AddressTitle { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string? Neighborhood { get; set; }
    public string FullAddress { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    public bool IsDefaultShipping { get; set; }
    public bool IsDefaultBilling { get; set; }
    public InvoiceType InvoiceType { get; set; } = InvoiceType.Individual;
    public string? TaxNumber { get; set; }
    public string? TaxOffice { get; set; }
    public string? CompanyName { get; set; }
}

public class UpdateAddressRequest
{
    public string AddressTitle { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string? Neighborhood { get; set; }
    public string FullAddress { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    public bool IsDefaultShipping { get; set; }
    public bool IsDefaultBilling { get; set; }
    public InvoiceType InvoiceType { get; set; }
    public string? TaxNumber { get; set; }
    public string? TaxOffice { get; set; }
    public string? CompanyName { get; set; }
}
