using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Commands.Variants;

public record CreateVariantCommand(
    Guid ProductId,
    string VariantName,
    string SKU,
    string? Barcode,
    decimal Price,
    decimal? DiscountPrice,
    string AttributesJson,
    int InitialStock = 0
) : IRequest<Result<Guid>>;

public class CreateVariantValidator : AbstractValidator<CreateVariantCommand>
{
    public CreateVariantValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.VariantName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.SKU).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.InitialStock).GreaterThanOrEqualTo(0);
    }
}

public class CreateVariantHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<CreateVariantCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateVariantCommand request, CancellationToken cancellationToken)
    {
        var product = await db.Products.FindAsync([request.ProductId], cancellationToken);
        if (product is null) return Result<Guid>.Failure("Ürün bulunamadı.");

        if (await db.ProductVariants.AnyAsync(v => v.SKU == request.SKU, cancellationToken))
            return Result<Guid>.Failure("Bu SKU zaten kullanılıyor.");

        var variant = new ProductVariant
        {
            ProductId = request.ProductId,
            VariantName = request.VariantName,
            SKU = request.SKU,
            Barcode = request.Barcode,
            Price = request.Price,
            DiscountPrice = request.DiscountPrice,
            AttributesJson = request.AttributesJson
        };

        var stock = new Stock
        {
            ProductVariantId = variant.Id,
            ProductId = request.ProductId,
            Quantity = request.InitialStock
        };

        db.ProductVariants.Add(variant);
        db.Stocks.Add(stock);
        await db.SaveChangesAsync(cancellationToken);

        if (request.InitialStock > 0)
        {
            db.StockMovements.Add(new StockMovement
            {
                StockId = stock.Id,
                MovementType = Domain.Enums.StockMovementType.StockIn,
                Quantity = request.InitialStock,
                QuantityBefore = 0,
                QuantityAfter = request.InitialStock,
                Note = "Varyant başlangıç stoğu"
            });
            await db.SaveChangesAsync(cancellationToken);
        }

        await audit.LogAsync("VariantCreated", "ProductVariant", variant.Id.ToString(), cancellationToken: cancellationToken);
        return Result<Guid>.Success(variant.Id);
    }
}
