using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using Ecom.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Addresses.Commands;

public record CreateAddressCommand(
    Guid UserId,
    string AddressTitle,
    string FirstName,
    string LastName,
    string PhoneNumber,
    string City,
    string District,
    string? Neighborhood,
    string FullAddress,
    string? PostalCode,
    bool IsDefaultShipping,
    bool IsDefaultBilling,
    InvoiceType InvoiceType = InvoiceType.Individual,
    string? TaxNumber = null,
    string? TaxOffice = null,
    string? CompanyName = null
) : IRequest<Result<Guid>>;

public class CreateAddressValidator : AbstractValidator<CreateAddressCommand>
{
    public CreateAddressValidator()
    {
        RuleFor(x => x.AddressTitle).NotEmpty().MaximumLength(100);
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PhoneNumber).NotEmpty().MaximumLength(20);
        RuleFor(x => x.City).NotEmpty().MaximumLength(100);
        RuleFor(x => x.District).NotEmpty().MaximumLength(100);
        RuleFor(x => x.FullAddress).NotEmpty().MaximumLength(500);
    }
}

public class CreateAddressHandler(IApplicationDbContext db) : IRequestHandler<CreateAddressCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateAddressCommand request, CancellationToken cancellationToken)
    {
        if (request.IsDefaultShipping)
        {
            var existingDefaults = await db.UserAddresses
                .Where(a => a.UserId == request.UserId && a.IsDefaultShipping)
                .ToListAsync(cancellationToken);
            existingDefaults.ForEach(a => a.IsDefaultShipping = false);
        }

        if (request.IsDefaultBilling)
        {
            var existingDefaults = await db.UserAddresses
                .Where(a => a.UserId == request.UserId && a.IsDefaultBilling)
                .ToListAsync(cancellationToken);
            existingDefaults.ForEach(a => a.IsDefaultBilling = false);
        }

        var address = new UserAddress
        {
            UserId = request.UserId,
            AddressTitle = request.AddressTitle,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            City = request.City,
            District = request.District,
            Neighborhood = request.Neighborhood,
            FullAddress = request.FullAddress,
            PostalCode = request.PostalCode,
            IsDefaultShipping = request.IsDefaultShipping,
            IsDefaultBilling = request.IsDefaultBilling,
            InvoiceType = request.InvoiceType,
            TaxNumber = request.TaxNumber,
            TaxOffice = request.TaxOffice,
            CompanyName = request.CompanyName
        };

        db.UserAddresses.Add(address);
        await db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(address.Id);
    }
}
