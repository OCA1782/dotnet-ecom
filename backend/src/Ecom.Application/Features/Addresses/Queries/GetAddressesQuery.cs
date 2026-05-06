using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Addresses.Queries;

public record AddressDto(
    Guid Id,
    string AddressTitle,
    string FirstName,
    string LastName,
    string PhoneNumber,
    string Country,
    string City,
    string District,
    string? Neighborhood,
    string FullAddress,
    string? PostalCode,
    bool IsDefaultShipping,
    bool IsDefaultBilling,
    InvoiceType InvoiceType,
    string? TaxNumber,
    string? TaxOffice,
    string? CompanyName
);

public record GetAddressesQuery(Guid UserId) : IRequest<IEnumerable<AddressDto>>;

public class GetAddressesHandler(IApplicationDbContext db) : IRequestHandler<GetAddressesQuery, IEnumerable<AddressDto>>
{
    public async Task<IEnumerable<AddressDto>> Handle(GetAddressesQuery request, CancellationToken cancellationToken)
    {
        return await db.UserAddresses
            .Where(a => a.UserId == request.UserId)
            .OrderByDescending(a => a.IsDefaultShipping)
            .ThenByDescending(a => a.CreatedDate)
            .Select(a => new AddressDto(
                a.Id, a.AddressTitle, a.FirstName, a.LastName, a.PhoneNumber,
                a.Country, a.City, a.District, a.Neighborhood, a.FullAddress,
                a.PostalCode, a.IsDefaultShipping, a.IsDefaultBilling,
                a.InvoiceType, a.TaxNumber, a.TaxOffice, a.CompanyName))
            .ToListAsync(cancellationToken);
    }
}
