using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Commands.Variants;

public record UpdateVariantCommand(
    Guid Id,
    string VariantName,
    string SKU,
    string? Barcode,
    decimal Price,
    decimal? DiscountPrice,
    string AttributesJson,
    bool IsActive
) : IRequest<Result>;

public class UpdateVariantValidator : AbstractValidator<UpdateVariantCommand>
{
    public UpdateVariantValidator()
    {
        RuleFor(x => x.VariantName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.SKU).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
    }
}

public class UpdateVariantHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<UpdateVariantCommand, Result>
{
    public async Task<Result> Handle(UpdateVariantCommand request, CancellationToken cancellationToken)
    {
        var variant = await db.ProductVariants.FindAsync([request.Id], cancellationToken);
        if (variant is null) return Result.Failure("Varyant bulunamadı.");

        if (await db.ProductVariants.AnyAsync(v => v.SKU == request.SKU && v.Id != request.Id, cancellationToken))
            return Result.Failure("Bu SKU başka bir varyantta kullanılıyor.");

        variant.VariantName = request.VariantName;
        variant.SKU = request.SKU;
        variant.Barcode = request.Barcode;
        variant.Price = request.Price;
        variant.DiscountPrice = request.DiscountPrice;
        variant.AttributesJson = request.AttributesJson;
        variant.IsActive = request.IsActive;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("VariantUpdated", "ProductVariant", variant.Id.ToString(), cancellationToken: cancellationToken);
        return Result.Success();
    }
}
