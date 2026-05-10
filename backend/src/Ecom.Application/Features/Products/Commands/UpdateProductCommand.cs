using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Commands;

public record UpdateProductCommand(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? ShortDescription,
    string SKU,
    string? Barcode,
    Guid CategoryId,
    Guid? BrandId,
    decimal Price,
    decimal? DiscountPrice,
    decimal TaxRate,
    bool IsActive,
    bool IsPublished,
    bool IsFeatured,
    string? MetaTitle,
    string? MetaDescription
) : IRequest<Result>;

public class UpdateProductValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(300)
            .Matches("^[a-z0-9-]+$").WithMessage("Slug sadece küçük harf, rakam ve tire içerebilir.");
        RuleFor(x => x.SKU).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
    }
}

public class UpdateProductHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<UpdateProductCommand, Result>
{
    public async Task<Result> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await db.Products.FindAsync([request.Id], cancellationToken);
        if (product is null) return Result.Failure("Ürün bulunamadı.");

        if (await db.Products.AnyAsync(p => p.Slug == request.Slug && p.Id != request.Id, cancellationToken))
            return Result.Failure("Bu slug başka bir üründe kullanılıyor.");

        if (await db.Products.AnyAsync(p => p.SKU == request.SKU && p.Id != request.Id, cancellationToken))
            return Result.Failure("Bu SKU başka bir üründe kullanılıyor.");

        var oldPrice = product.Price;
        product.Name = request.Name;
        product.Slug = request.Slug;
        product.Description = request.Description;
        product.ShortDescription = request.ShortDescription;
        product.SKU = request.SKU;
        product.Barcode = request.Barcode;
        product.CategoryId = request.CategoryId;
        product.BrandId = request.BrandId;
        product.Price = request.Price;
        product.DiscountPrice = request.DiscountPrice;
        product.TaxRate = request.TaxRate;
        product.IsActive = request.IsActive;
        product.IsPublished = request.IsPublished;
        product.IsFeatured = request.IsFeatured;
        product.MetaTitle = request.MetaTitle;
        product.MetaDescription = request.MetaDescription;

        await db.SaveChangesAsync(cancellationToken);

        if (oldPrice != request.Price)
            await audit.LogAsync("ProductPriceChanged", "Product", product.Id.ToString(),
                oldPrice.ToString("F2"), request.Price.ToString("F2"), cancellationToken: cancellationToken);
        else
            await audit.LogAsync("ProductUpdated", "Product", product.Id.ToString(), cancellationToken: cancellationToken);

        return Result.Success();
    }
}
