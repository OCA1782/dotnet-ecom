using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using Ecom.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Ecom.Application.Features.Orders.Commands;

public record GuestAddressInfo(
    string FirstName,
    string LastName,
    string Phone,
    string City,
    string District,
    string FullAddress,
    string? PostalCode = null
);

public record OrderCreatedResult(string OrderNumber, Guid OrderId);

public record CreateOrderCommand(
    Guid? UserId,
    string? SessionId,
    Guid? ShippingAddressId,
    Guid? BillingAddressId,
    string? Note,
    string? GuestEmail = null,
    GuestAddressInfo? GuestShippingAddress = null
) : IRequest<Result<OrderCreatedResult>>;

public class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x).Must(x => x.UserId.HasValue || !string.IsNullOrEmpty(x.GuestEmail))
            .WithMessage("Kayıtlı kullanıcı veya misafir e-postası zorunludur.");
        RuleFor(x => x).Must(x => x.ShippingAddressId.HasValue || x.GuestShippingAddress != null)
            .WithMessage("Teslimat adresi zorunludur.");
    }
}

public class CreateOrderHandler(
    IApplicationDbContext db,
    IStockService stockService,
    IEmailService emailService
) : IRequestHandler<CreateOrderCommand, Result<OrderCreatedResult>>
{
    public async Task<Result<OrderCreatedResult>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        // Load cart
        var cart = await db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c =>
                (request.UserId.HasValue && c.UserId == request.UserId) ||
                (!request.UserId.HasValue && c.SessionId == request.SessionId),
                cancellationToken);

        if (cart is null || !cart.Items.Any())
            return Result<OrderCreatedResult>.Failure("Sepet boş veya bulunamadı.");

        // Build shipping address snapshot
        string shippingSnapshot;
        if (request.ShippingAddressId.HasValue)
        {
            var addr = await db.UserAddresses
                .FirstOrDefaultAsync(a => a.Id == request.ShippingAddressId, cancellationToken);
            if (addr is null)
                return Result<OrderCreatedResult>.Failure("Teslimat adresi bulunamadı.");
            shippingSnapshot = JsonSerializer.Serialize(new
            {
                addr.AddressTitle, addr.FirstName, addr.LastName, addr.PhoneNumber,
                addr.Country, addr.City, addr.District, addr.Neighborhood,
                addr.FullAddress, addr.PostalCode
            });
        }
        else if (request.GuestShippingAddress is { } ga)
        {
            shippingSnapshot = JsonSerializer.Serialize(new
            {
                AddressTitle = "Teslimat Adresi",
                ga.FirstName, ga.LastName,
                PhoneNumber = ga.Phone,
                Country = "TR",
                ga.City, ga.District,
                Neighborhood = "",
                ga.FullAddress,
                PostalCode = ga.PostalCode ?? ""
            });
        }
        else
        {
            return Result<OrderCreatedResult>.Failure("Teslimat adresi zorunludur.");
        }

        // Build billing address snapshot (defaults to shipping)
        string billingSnapshot;
        if (request.BillingAddressId.HasValue)
        {
            var bAddr = await db.UserAddresses
                .FirstOrDefaultAsync(a => a.Id == request.BillingAddressId, cancellationToken);
            billingSnapshot = bAddr is not null
                ? JsonSerializer.Serialize(new
                {
                    bAddr.AddressTitle, bAddr.FirstName, bAddr.LastName, bAddr.PhoneNumber,
                    bAddr.Country, bAddr.City, bAddr.District, bAddr.Neighborhood,
                    bAddr.FullAddress, bAddr.PostalCode, bAddr.InvoiceType, bAddr.TaxNumber,
                    bAddr.TaxOffice, bAddr.CompanyName
                })
                : shippingSnapshot;
        }
        else
        {
            billingSnapshot = shippingSnapshot;
        }

        // Load cart item products, variants and images
        var productIds = cart.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(cancellationToken);

        var variantIds = cart.Items.Where(i => i.ProductVariantId.HasValue)
            .Select(i => i.ProductVariantId!.Value).Distinct().ToList();
        var variants = variantIds.Any()
            ? await db.ProductVariants.Where(v => variantIds.Contains(v.Id)).ToListAsync(cancellationToken)
            : new List<ProductVariant>();

        var images = await db.ProductImages
            .Where(i => productIds.Contains(i.ProductId) && i.IsMain)
            .ToListAsync(cancellationToken);

        // Validate stock availability before reserving
        foreach (var item in cart.Items)
        {
            var stock = await db.Stocks
                .FirstOrDefaultAsync(s =>
                    s.ProductId == item.ProductId && s.ProductVariantId == item.ProductVariantId,
                    cancellationToken);

            if (stock is null || stock.AvailableQuantity < item.Quantity)
            {
                var product = products.First(p => p.Id == item.ProductId);
                return Result<OrderCreatedResult>.Failure($"'{product.Name}' için yeterli stok yok.");
            }
        }

        // Generate order number: SIP-{YYYYMMDD}-{6-digit sequence}
        var today = DateTime.UtcNow;
        var todayPrefix = $"SIP-{today:yyyyMMdd}-";
        var lastOrderToday = await db.Orders
            .Where(o => o.OrderNumber.StartsWith(todayPrefix))
            .OrderByDescending(o => o.OrderNumber)
            .Select(o => o.OrderNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int sequence = 1;
        if (lastOrderToday is not null)
        {
            var lastSeq = lastOrderToday[todayPrefix.Length..];
            if (int.TryParse(lastSeq, out var parsed)) sequence = parsed + 1;
        }
        var orderNumber = $"{todayPrefix}{sequence:D6}";

        // Calculate totals
        decimal totalProductAmount = 0;
        decimal taxAmount = 0;
        var orderItems = new List<OrderItem>();

        foreach (var cartItem in cart.Items)
        {
            var product = products.First(p => p.Id == cartItem.ProductId);
            var variant = cartItem.ProductVariantId.HasValue
                ? variants.FirstOrDefault(v => v.Id == cartItem.ProductVariantId)
                : null;
            var image = images.FirstOrDefault(i => i.ProductId == cartItem.ProductId);

            var lineTotal = cartItem.UnitPrice * cartItem.Quantity;
            var lineTax = lineTotal * (product.TaxRate / 100m);

            totalProductAmount += lineTotal;
            taxAmount += lineTax;

            string? variantName = null;
            if (variant is not null)
            {
                try
                {
                    var attrs = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(variant.AttributesJson ?? "[]");
                    variantName = string.Join(", ", attrs?.Select(a => $"{a["key"]}: {a["value"]}") ?? []);
                }
                catch { variantName = null; }
            }

            orderItems.Add(new OrderItem
            {
                ProductId = cartItem.ProductId,
                ProductVariantId = cartItem.ProductVariantId,
                ProductName = product.Name,
                SKU = variant?.SKU ?? product.SKU,
                VariantName = variantName,
                Quantity = cartItem.Quantity,
                UnitPrice = cartItem.UnitPrice,
                DiscountAmount = 0,
                TaxRate = product.TaxRate,
                TaxAmount = Math.Round(lineTax, 2),
                LineTotal = lineTotal,
                ImageUrl = image?.ImageUrl
            });
        }

        // Free shipping threshold
        var siteShippingCost = await db.SiteSettings
            .Where(s => s.Key == "DefaultShippingCost")
            .Select(s => s.Value)
            .FirstOrDefaultAsync(cancellationToken);
        var siteShippingLimit = await db.SiteSettings
            .Where(s => s.Key == "FreeShippingLimit")
            .Select(s => s.Value)
            .FirstOrDefaultAsync(cancellationToken);

        decimal shippingCost = decimal.TryParse(siteShippingCost, out var sc) ? sc : 29.90m;
        decimal freeLimit = decimal.TryParse(siteShippingLimit, out var fl) ? fl : 500m;
        decimal shippingAmount = totalProductAmount >= freeLimit ? 0m : shippingCost;

        // Apply coupon
        decimal discountAmount = 0;
        string? couponCode = null;
        Coupon? appliedCoupon = null;

        if (!string.IsNullOrEmpty(cart.CouponCode))
        {
            appliedCoupon = await db.Coupons
                .FirstOrDefaultAsync(c => c.Code == cart.CouponCode && c.IsActive, cancellationToken);

            if (appliedCoupon is not null)
            {
                var now = DateTime.UtcNow;
                var valid =
                    (!appliedCoupon.StartDate.HasValue || appliedCoupon.StartDate <= now) &&
                    (!appliedCoupon.EndDate.HasValue || appliedCoupon.EndDate >= now) &&
                    (!appliedCoupon.MaxUsageCount.HasValue || appliedCoupon.UsageCount < appliedCoupon.MaxUsageCount) &&
                    totalProductAmount >= appliedCoupon.MinOrderAmount;

                if (valid)
                {
                    couponCode = appliedCoupon.Code;
                    discountAmount = appliedCoupon.Type switch
                    {
                        CouponType.FixedAmount => Math.Min(appliedCoupon.Value, totalProductAmount),
                        CouponType.Percentage => Math.Round(totalProductAmount * appliedCoupon.Value / 100, 2),
                        CouponType.FreeShipping => shippingAmount,
                        _ => 0
                    };
                    if (appliedCoupon.Type == CouponType.FreeShipping)
                        shippingAmount = 0;
                }
            }
        }

        decimal grandTotal = Math.Max(0, totalProductAmount + shippingAmount - discountAmount);

        var order = new Order
        {
            OrderNumber = orderNumber,
            UserId = request.UserId,
            GuestEmail = request.GuestEmail,
            Status = OrderStatus.Created,
            TotalProductAmount = totalProductAmount,
            DiscountAmount = discountAmount,
            ShippingAmount = shippingAmount,
            TaxAmount = Math.Round(taxAmount, 2),
            GrandTotal = grandTotal,
            CouponCode = couponCode,
            ShippingAddressSnapshot = shippingSnapshot,
            BillingAddressSnapshot = billingSnapshot,
            Note = request.Note,
            Items = orderItems
        };

        order.StatusHistory.Add(new OrderStatusHistory
        {
            FromStatus = OrderStatus.Created,
            ToStatus = OrderStatus.Created,
            ChangedByUserId = request.UserId
        });

        db.Orders.Add(order);

        // Reserve stock for all items
        foreach (var item in cart.Items)
        {
            await stockService.ReserveAsync(item.ProductId, item.ProductVariantId, item.Quantity, order.Id, cancellationToken);
        }

        // Record coupon usage and increment counter
        if (appliedCoupon is not null && request.UserId.HasValue)
        {
            appliedCoupon.UsageCount++;
            db.CouponUsages.Add(new CouponUsage
            {
                CouponId = appliedCoupon.Id,
                UserId = request.UserId.Value,
                OrderId = order.Id,
                DiscountApplied = discountAmount
            });
        }

        // Clear the cart
        db.CartItems.RemoveRange(cart.Items);
        db.Carts.Remove(cart);

        await db.SaveChangesAsync(cancellationToken);

        // Send order confirmation email (fire-and-forget, don't fail order on email error)
        try
        {
            string toEmail = request.GuestEmail ?? string.Empty;
            string toName = "Değerli Müşteri";
            if (request.UserId.HasValue)
            {
                var user = await db.Users.FindAsync([request.UserId.Value], cancellationToken);
                if (user is not null)
                {
                    toEmail = user.Email;
                    toName = $"{user.Name} {user.Surname}";
                }
            }
            if (!string.IsNullOrEmpty(toEmail))
                await emailService.SendOrderConfirmationAsync(toEmail, toName, order.OrderNumber, order.GrandTotal, cancellationToken);
        }
        catch { /* email failure should not affect order creation */ }

        return Result<OrderCreatedResult>.Success(new OrderCreatedResult(order.OrderNumber, order.Id));
    }
}
