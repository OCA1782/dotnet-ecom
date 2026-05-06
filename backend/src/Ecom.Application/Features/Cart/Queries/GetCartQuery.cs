using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Cart.Queries;

public record GetCartQuery(Guid? UserId, string? SessionId) : IRequest<CartDto?>;

public record CartDto(
    Guid CartId,
    List<CartItemDto> Items,
    decimal SubTotal,
    decimal TaxAmount,
    decimal ShippingAmount,
    decimal DiscountAmount,
    string? CouponCode,
    decimal GrandTotal
);

public record CartItemDto(
    Guid CartItemId,
    Guid ProductId,
    Guid? VariantId,
    string ProductName,
    string? VariantName,
    string SKU,
    string? ImageUrl,
    int Quantity,
    decimal UnitPrice,
    decimal TaxRate,
    decimal LineTotal,
    int AvailableStock
);

public class GetCartQueryHandler(IApplicationDbContext db) : IRequestHandler<GetCartQuery, CartDto?>
{
    public async Task<CartDto?> Handle(GetCartQuery request, CancellationToken cancellationToken)
    {
        var cart = await db.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images.Where(img => img.IsMain))
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Stock)
            .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
                    .ThenInclude(v => v!.Stock)
            .FirstOrDefaultAsync(c =>
                (request.UserId.HasValue && c.UserId == request.UserId) ||
                (!request.UserId.HasValue && c.SessionId == request.SessionId),
                cancellationToken);

        if (cart is null) return null;

        var items = cart.Items.Select(i =>
        {
            var availableStock = i.ProductVariant?.Stock?.AvailableQuantity
                ?? i.Product.Stock?.AvailableQuantity ?? 0;
            var image = i.Product.Images.FirstOrDefault()?.ImageUrl;
            return new CartItemDto(
                i.Id, i.ProductId, i.ProductVariantId,
                i.Product.Name,
                i.ProductVariant?.VariantName,
                i.ProductVariant?.SKU ?? i.Product.SKU,
                image, i.Quantity, i.UnitPrice, i.Product.TaxRate,
                i.UnitPrice * i.Quantity, availableStock);
        }).ToList();

        var subTotal = items.Sum(i => i.LineTotal);
        var tax = items.Sum(i => i.LineTotal * i.TaxRate / 100);
        var shipping = subTotal >= 500 ? 0 : 29.90m;

        // Apply coupon discount
        decimal discountAmount = 0;
        string? couponCode = null;

        if (!string.IsNullOrEmpty(cart.CouponCode))
        {
            var coupon = await db.Coupons
                .FirstOrDefaultAsync(c => c.Code == cart.CouponCode && c.IsActive, cancellationToken);

            if (coupon is not null)
            {
                var now = DateTime.UtcNow;
                var couponValid =
                    (!coupon.StartDate.HasValue || coupon.StartDate <= now) &&
                    (!coupon.EndDate.HasValue || coupon.EndDate >= now) &&
                    (!coupon.MaxUsageCount.HasValue || coupon.UsageCount < coupon.MaxUsageCount) &&
                    subTotal >= coupon.MinOrderAmount;

                if (couponValid)
                {
                    couponCode = coupon.Code;
                    discountAmount = coupon.Type switch
                    {
                        CouponType.FixedAmount => Math.Min(coupon.Value, subTotal),
                        CouponType.Percentage => Math.Round(subTotal * coupon.Value / 100, 2),
                        CouponType.FreeShipping => shipping, // Covers shipping cost
                        _ => 0
                    };
                    if (coupon.Type == CouponType.FreeShipping)
                        shipping = 0;
                }
                else
                {
                    // Coupon no longer valid; auto-clear
                    cart.CouponCode = null;
                    await db.SaveChangesAsync(cancellationToken);
                }
            }
        }

        var grandTotal = Math.Max(0, subTotal + shipping - discountAmount);

        return new CartDto(cart.Id, items, subTotal, tax, shipping, discountAmount, couponCode, grandTotal);
    }
}
