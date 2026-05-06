using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Commands;

public record AddProductImageCommand(
    Guid ProductId,
    string ImageUrl,
    int SortOrder,
    bool IsMain,
    string? AltText
) : IRequest<Result<Guid>>;

public class AddProductImageValidator : AbstractValidator<AddProductImageCommand>
{
    public AddProductImageValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.ImageUrl).NotEmpty().MaximumLength(1000);
    }
}

public class AddProductImageHandler(IApplicationDbContext db)
    : IRequestHandler<AddProductImageCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddProductImageCommand request, CancellationToken cancellationToken)
    {
        var productExists = await db.Products.AnyAsync(p => p.Id == request.ProductId, cancellationToken);
        if (!productExists) return Result<Guid>.Failure("Ürün bulunamadı.");

        // Eğer IsMain ise diğer görsellerin IsMain'ini false yap
        if (request.IsMain)
        {
            var existing = await db.ProductImages
                .Where(i => i.ProductId == request.ProductId && i.IsMain)
                .ToListAsync(cancellationToken);
            existing.ForEach(i => i.IsMain = false);
        }

        var image = new ProductImage
        {
            ProductId = request.ProductId,
            ImageUrl = request.ImageUrl,
            SortOrder = request.SortOrder,
            IsMain = request.IsMain,
            AltText = request.AltText
        };

        db.ProductImages.Add(image);
        await db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(image.Id);
    }
}
