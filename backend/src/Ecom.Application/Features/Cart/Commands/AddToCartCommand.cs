using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Cart.Commands;

public record AddToCartCommand(
    Guid? UserId,
    string? SessionId,
    Guid ProductId,
    Guid? VariantId,
    int Quantity
) : IRequest<Result<Guid>>;

public class AddToCartValidator : AbstractValidator<AddToCartCommand>
{
    public AddToCartValidator()
    {
        RuleFor(x => x).Must(x => x.UserId.HasValue || !string.IsNullOrEmpty(x.SessionId))
            .WithMessage("UserId veya SessionId zorunludur.");
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}

public class AddToCartHandler(IApplicationDbContext db) : IRequestHandler<AddToCartCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddToCartCommand request, CancellationToken cancellationToken)
    {
        // Ürün/varyant geçerliliğini kontrol et
        var product = await db.Products
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.IsActive && p.IsPublished, cancellationToken);
        if (product is null) return Result<Guid>.Failure("Ürün bulunamadı veya satışta değil.");

        if (request.VariantId.HasValue)
        {
            var variant = await db.ProductVariants
                .FirstOrDefaultAsync(v => v.Id == request.VariantId && v.ProductId == request.ProductId && v.IsActive, cancellationToken);
            if (variant is null) return Result<Guid>.Failure("Varyant bulunamadı.");
        }

        // Sepeti bul veya oluştur
        var cart = await db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c =>
                (request.UserId.HasValue && c.UserId == request.UserId) ||
                (!request.UserId.HasValue && c.SessionId == request.SessionId),
                cancellationToken);

        if (cart is null)
        {
            cart = new Domain.Entities.Cart
            {
                UserId = request.UserId,
                SessionId = request.SessionId,
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            };
            db.Carts.Add(cart);
        }

        // Fiyat belirle
        decimal unitPrice;
        if (request.VariantId.HasValue)
        {
            var variant = await db.ProductVariants.FindAsync([request.VariantId], cancellationToken);
            unitPrice = variant!.DiscountPrice ?? variant.Price;
        }
        else
        {
            unitPrice = product.DiscountPrice ?? product.Price;
        }

        // Aynı ürün/varyant sepette varsa adedi artır
        var existing = cart.Items.FirstOrDefault(i =>
            i.ProductId == request.ProductId && i.ProductVariantId == request.VariantId);

        if (existing is not null)
        {
            existing.Quantity += request.Quantity;
            existing.UnitPrice = unitPrice; // Güncel fiyatı yansıt
        }
        else
        {
            cart.Items.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = request.ProductId,
                ProductVariantId = request.VariantId,
                Quantity = request.Quantity,
                UnitPrice = unitPrice
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(cart.Id);
    }
}
