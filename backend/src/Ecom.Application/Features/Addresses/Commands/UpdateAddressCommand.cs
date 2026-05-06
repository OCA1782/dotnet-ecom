using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Addresses.Commands;

public record UpdateAddressCommand(
    Guid AddressId,
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
    InvoiceType InvoiceType,
    string? TaxNumber,
    string? TaxOffice,
    string? CompanyName
) : IRequest<Result>;

public class UpdateAddressValidator : AbstractValidator<UpdateAddressCommand>
{
    public UpdateAddressValidator()
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

public class UpdateAddressHandler(IApplicationDbContext db) : IRequestHandler<UpdateAddressCommand, Result>
{
    public async Task<Result> Handle(UpdateAddressCommand request, CancellationToken cancellationToken)
    {
        var address = await db.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == request.AddressId && a.UserId == request.UserId, cancellationToken);

        if (address is null) return Result.Failure("Adres bulunamadı.");

        if (request.IsDefaultShipping && !address.IsDefaultShipping)
        {
            var others = await db.UserAddresses
                .Where(a => a.UserId == request.UserId && a.IsDefaultShipping && a.Id != request.AddressId)
                .ToListAsync(cancellationToken);
            others.ForEach(a => a.IsDefaultShipping = false);
        }

        if (request.IsDefaultBilling && !address.IsDefaultBilling)
        {
            var others = await db.UserAddresses
                .Where(a => a.UserId == request.UserId && a.IsDefaultBilling && a.Id != request.AddressId)
                .ToListAsync(cancellationToken);
            others.ForEach(a => a.IsDefaultBilling = false);
        }

        address.AddressTitle = request.AddressTitle;
        address.FirstName = request.FirstName;
        address.LastName = request.LastName;
        address.PhoneNumber = request.PhoneNumber;
        address.City = request.City;
        address.District = request.District;
        address.Neighborhood = request.Neighborhood;
        address.FullAddress = request.FullAddress;
        address.PostalCode = request.PostalCode;
        address.IsDefaultShipping = request.IsDefaultShipping;
        address.IsDefaultBilling = request.IsDefaultBilling;
        address.InvoiceType = request.InvoiceType;
        address.TaxNumber = request.TaxNumber;
        address.TaxOffice = request.TaxOffice;
        address.CompanyName = request.CompanyName;

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
