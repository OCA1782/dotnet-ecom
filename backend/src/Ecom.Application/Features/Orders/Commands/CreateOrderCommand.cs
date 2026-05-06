using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using Ecom.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Ecom.Application.Features.Orders.Commands;

public record CreateOrderCommand(
    Guid? UserId,
    string? SessionId,
    Guid ShippingAddressId,
    Guid? BillingAddressId,
    string? Note,
    string? GuestEmail = null
) : IRequest<Result<string>>;

public class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x).Must(x => x.UserId.HasValue || !string.IsNullOrEmpty(x.GuestEmail))
            .WithMessage("Kayıtlı kullanıcı veya misafir e-postası zorunludur.");
        RuleFor(x => x.ShippingAddressId).NotEmpty();
    }
}

public class CreateOrderHandler(
    IApplicationDbContext db,
    IStockService stockService,
    IEmailService emailService
) : IRequestHandler<CreateOrderCommand, Result<string>>
{
    public async Task<Result<string>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        // Load cart
        var cart = await db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c =>
                (request.UserId.HasValue && c.UserId == request.UserId) ||
                (!request.UserId.HasValue && c.SessionId == request.SessionId),
                cancellationToken);

        if (cart is null || !cart.Items.Any())
            return Result<string>.Failure("Sepet boş veya bulunamadı.");

        // Load shipping address
        var shippingAddress = await db.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == request.ShippingAddressId, cancellationToken);
        if (shippingAddress is null)
            return Result<string>.Failure("Teslimat adresi bulunamadı.");

        // Load billing address (defaults to shipping if not specified)
        var billingAddress = request.BillingAddressId.HasValue
            ? await db.UserAddresses.FirstOrDefaultAsync(a => a.Id == request.BillingAddressId, cancellationToken)
            : shippingAddress;

        // Load products and variants for snapshots
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
                return Result<string>.Failure($"'{product.Name}' için yeterli stok yok.");
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

        // Serialize address snapshots
        var shippingSnapshot = JsonSerializer.Serialize(new
        {
            shippingAddress.AddressTitle,
            shippingAddress.FirstName,
            shippingAddress.LastName,
            shippingAddress.PhoneNumber,
            shippingAddress.Country,
            shippingAddress.City,
            shippingAddress.District,
            shippingAddress.Neighborhood,
            shippingAddress.FullAddress,
            shippingAddress.PostalCode
        });

        var billingSnapshot = JsonSerializer.Serialize(new
        {
            billingAddress!.AddressTitle,
            billingAddress.FirstName,
            billingAddress.LastName,
            billingAddress.PhoneNumber,
            billingAddress.Country,
            billingAddress.City,
            billingAddress.District,
            billingAddress.Neighborhood,
            billingAddress.FullAddress,
            billingAddress.PostalCode,
            billingAddress.InvoiceType,
            billingAddress.TaxNumber,
            billingAddress.TaxOffice,
            billingAddress.CompanyName
        });

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

        return Result<string>.Success(order.OrderNumber);
    }
}
