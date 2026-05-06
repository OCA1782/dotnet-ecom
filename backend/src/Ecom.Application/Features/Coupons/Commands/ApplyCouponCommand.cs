using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Coupons.Commands;

public record ApplyCouponCommand(
    string Code,
    Guid? UserId,
    string? SessionId
) : IRequest<Result<CouponValidationResult>>;

public record CouponValidationResult(
    string Code,
    CouponType Type,
    decimal Value,
    decimal DiscountAmount
);

public class ApplyCouponValidator : AbstractValidator<ApplyCouponCommand>
{
    public ApplyCouponValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
    }
}

public class ApplyCouponHandler(IApplicationDbContext db) : IRequestHandler<ApplyCouponCommand, Result<CouponValidationResult>>
{
    public async Task<Result<CouponValidationResult>> Handle(ApplyCouponCommand request, CancellationToken cancellationToken)
    {
        var code = request.Code.Trim().ToUpperInvariant();

        var coupon = await db.Coupons
            .FirstOrDefaultAsync(c => c.Code == code && c.IsActive, cancellationToken);

        if (coupon is null)
            return Result<CouponValidationResult>.Failure("Geçersiz veya süresi dolmuş kupon kodu.");

        var now = DateTime.UtcNow;
        if (coupon.StartDate.HasValue && coupon.StartDate > now)
            return Result<CouponValidationResult>.Failure("Bu kupon henüz aktif değil.");
        if (coupon.EndDate.HasValue && coupon.EndDate < now)
            return Result<CouponValidationResult>.Failure("Bu kuponun kullanım süresi dolmuş.");
        if (coupon.MaxUsageCount.HasValue && coupon.UsageCount >= coupon.MaxUsageCount)
            return Result<CouponValidationResult>.Failure("Bu kuponun kullanım limiti dolmuş.");

        // Per-user limit check
        if (coupon.MaxUsagePerUser.HasValue && request.UserId.HasValue)
        {
            var userUsages = await db.CouponUsages
                .CountAsync(u => u.CouponId == coupon.Id && u.UserId == request.UserId, cancellationToken);
            if (userUsages >= coupon.MaxUsagePerUser)
                return Result<CouponValidationResult>.Failure("Bu kuponu daha fazla kullanamazsınız.");
        }

        // Find cart and check min order amount
        var cart = await db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c =>
                (request.UserId.HasValue && c.UserId == request.UserId) ||
                (!request.UserId.HasValue && c.SessionId == request.SessionId),
                cancellationToken);

        if (cart is null || !cart.Items.Any())
            return Result<CouponValidationResult>.Failure("Sepet boş.");

        var subTotal = cart.Items.Sum(i => i.UnitPrice * i.Quantity);

        if (subTotal < coupon.MinOrderAmount)
            return Result<CouponValidationResult>.Failure(
                $"Bu kupon için minimum sipariş tutarı {coupon.MinOrderAmount:C2} TL olmalıdır.");

        // Compute discount
        decimal discountAmount = coupon.Type switch
        {
            CouponType.FixedAmount => Math.Min(coupon.Value, subTotal),
            CouponType.Percentage => Math.Round(subTotal * coupon.Value / 100, 2),
            CouponType.FreeShipping => 0, // Shipping discount handled in cart totals
            _ => 0
        };

        cart.CouponCode = code;
        await db.SaveChangesAsync(cancellationToken);

        return Result<CouponValidationResult>.Success(
            new CouponValidationResult(coupon.Code, coupon.Type, coupon.Value, discountAmount));
    }
}
