using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Ecom.Application.Features.Orders.Commands;

public record UpdateOrderAddressCommand(
    Guid OrderId,
    Guid UserId,
    // Shipping — saved address OR inline
    Guid? ShippingAddressId,
    string? FirstName = null,
    string? LastName = null,
    string? Phone = null,
    string? City = null,
    string? District = null,
    string? FullAddress = null,
    string? PostalCode = null,
    // Billing — saved address OR inline (null = same as shipping)
    Guid? BillingAddressId = null,
    string? BillingFirstName = null,
    string? BillingLastName = null,
    string? BillingPhone = null,
    string? BillingCity = null,
    string? BillingDistrict = null,
    string? BillingFullAddress = null,
    string? BillingPostalCode = null
) : IRequest<Result>;

public class UpdateOrderAddressHandler(IApplicationDbContext db, IAuditService auditService)
    : IRequestHandler<UpdateOrderAddressCommand, Result>
{
    private static readonly JsonSerializerOptions CamelCase = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    public async Task<Result> Handle(UpdateOrderAddressCommand request, CancellationToken cancellationToken)
    {
        var order = await db.Orders.FirstOrDefaultAsync(
            o => o.Id == request.OrderId && o.UserId == request.UserId, cancellationToken);

        if (order is null) return Result.Failure("Sipariş bulunamadı.");

        if (order.Status != OrderStatus.Created && order.Status != OrderStatus.PaymentPending)
            return Result.Failure("Bu sipariş için adres güncellenemez.");

        // ── Shipping snapshot ──
        string shippingSnapshot;
        if (request.ShippingAddressId.HasValue)
        {
            var addr = await db.UserAddresses.FirstOrDefaultAsync(
                a => a.Id == request.ShippingAddressId && a.UserId == request.UserId, cancellationToken);
            if (addr is null) return Result.Failure("Teslimat adresi bulunamadı.");
            shippingSnapshot = JsonSerializer.Serialize(new
            {
                addr.AddressTitle, addr.FirstName, addr.LastName, addr.PhoneNumber,
                addr.Country, addr.City, addr.District, addr.Neighborhood,
                addr.FullAddress, addr.PostalCode
            }, CamelCase);
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.FirstName) ||
                string.IsNullOrWhiteSpace(request.LastName) ||
                string.IsNullOrWhiteSpace(request.Phone) ||
                string.IsNullOrWhiteSpace(request.City) ||
                string.IsNullOrWhiteSpace(request.District) ||
                string.IsNullOrWhiteSpace(request.FullAddress))
                return Result.Failure("Teslimat adresi için ad, soyad, telefon, şehir, ilçe ve açık adres zorunludur.");

            shippingSnapshot = JsonSerializer.Serialize(new
            {
                AddressTitle = "Teslimat Adresi",
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.Phone,
                Country = "TR",
                City = request.City,
                District = request.District,
                Neighborhood = "",
                FullAddress = request.FullAddress,
                PostalCode = request.PostalCode ?? ""
            }, CamelCase);
        }

        // ── Billing snapshot ──
        string billingSnapshot = shippingSnapshot;

        if (request.BillingAddressId.HasValue)
        {
            var bAddr = await db.UserAddresses.FirstOrDefaultAsync(
                a => a.Id == request.BillingAddressId && a.UserId == request.UserId, cancellationToken);
            if (bAddr is not null)
                billingSnapshot = JsonSerializer.Serialize(new
                {
                    bAddr.AddressTitle, bAddr.FirstName, bAddr.LastName, bAddr.PhoneNumber,
                    bAddr.Country, bAddr.City, bAddr.District, bAddr.Neighborhood,
                    bAddr.FullAddress, bAddr.PostalCode
                }, CamelCase);
        }
        else if (!string.IsNullOrWhiteSpace(request.BillingFullAddress))
        {
            if (string.IsNullOrWhiteSpace(request.BillingFirstName) ||
                string.IsNullOrWhiteSpace(request.BillingLastName) ||
                string.IsNullOrWhiteSpace(request.BillingPhone) ||
                string.IsNullOrWhiteSpace(request.BillingCity) ||
                string.IsNullOrWhiteSpace(request.BillingDistrict))
                return Result.Failure("Fatura adresi için tüm zorunlu alanları doldurun.");

            billingSnapshot = JsonSerializer.Serialize(new
            {
                AddressTitle = "Fatura Adresi",
                FirstName = request.BillingFirstName,
                LastName = request.BillingLastName,
                PhoneNumber = request.BillingPhone,
                Country = "TR",
                City = request.BillingCity,
                District = request.BillingDistrict,
                Neighborhood = "",
                FullAddress = request.BillingFullAddress,
                PostalCode = request.BillingPostalCode ?? ""
            }, CamelCase);
        }

        order.ShippingAddressSnapshot = shippingSnapshot;
        order.BillingAddressSnapshot = billingSnapshot;
        await db.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            "AdresGüncellendi", "Sipariş", order.Id.ToString(),
            newValue: $"Sipariş {order.OrderNumber} adres güncellendi",
            userId: request.UserId,
            cancellationToken: cancellationToken);

        return Result.Success();
    }
}
