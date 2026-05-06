using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using Ecom.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Commands;

public record CreateProductCommand(
    string Name,
    string Slug,
    string? Description,
    string? ShortDescription,
    string SKU,
    string? Barcode,
    ProductType ProductType,
    Guid CategoryId,
    Guid? BrandId,
    decimal Price,
    decimal? DiscountPrice,
    string Currency,
    decimal TaxRate,
    bool IsPublished,
    string? MetaTitle,
    string? MetaDescription,
    int InitialStock = 0
) : IRequest<Result<Guid>>;

public class CreateProductValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(300)
            .Matches("^[a-z0-9-]+$").WithMessage("Slug sadece küçük harf, rakam ve tire içerebilir.");
        RuleFor(x => x.SKU).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TaxRate).InclusiveBetween(0, 100);
        RuleFor(x => x.InitialStock).GreaterThanOrEqualTo(0);
    }
}

public class CreateProductHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<CreateProductCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        if (await db.Products.AnyAsync(p => p.Slug == request.Slug, cancellationToken))
            return Result<Guid>.Failure("Bu slug zaten kullanılıyor.");

        if (await db.Products.AnyAsync(p => p.SKU == request.SKU, cancellationToken))
            return Result<Guid>.Failure("Bu SKU zaten kullanılıyor.");

        var categoryExists = await db.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken);
        if (!categoryExists)
            return Result<Guid>.Failure("Kategori bulunamadı.");

        if (request.BrandId.HasValue)
        {
            var brandExists = await db.Brands.AnyAsync(b => b.Id == request.BrandId, cancellationToken);
            if (!brandExists)
                return Result<Guid>.Failure("Marka bulunamadı.");
        }

        var product = new Product
        {
            Name = request.Name,
            Slug = request.Slug,
            Description = request.Description,
            ShortDescription = request.ShortDescription,
            SKU = request.SKU,
            Barcode = request.Barcode,
            ProductType = request.ProductType,
            CategoryId = request.CategoryId,
            BrandId = request.BrandId,
            Price = request.Price,
            DiscountPrice = request.DiscountPrice,
            Currency = request.Currency,
            TaxRate = request.TaxRate,
            IsPublished = request.IsPublished,
            MetaTitle = request.MetaTitle,
            MetaDescription = request.MetaDescription
        };

        var stock = new Stock
        {
            ProductId = product.Id,
            Quantity = request.InitialStock
        };

        db.Products.Add(product);
        db.Stocks.Add(stock);
        await db.SaveChangesAsync(cancellationToken);

        if (request.InitialStock > 0)
        {
            db.StockMovements.Add(new StockMovement
            {
                StockId = stock.Id,
                MovementType = StockMovementType.StockIn,
                Quantity = request.InitialStock,
                QuantityBefore = 0,
                QuantityAfter = request.InitialStock,
                Note = "Başlangıç stoğu"
            });
            await db.SaveChangesAsync(cancellationToken);
        }

        await audit.LogAsync("ProductCreated", "Product", product.Id.ToString(), cancellationToken: cancellationToken);
        return Result<Guid>.Success(product.Id);
    }
}
