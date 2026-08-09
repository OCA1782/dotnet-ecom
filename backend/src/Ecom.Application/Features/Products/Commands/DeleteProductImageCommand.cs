using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Commands;

public record DeleteProductImageCommand(Guid ImageId) : IRequest<Result>;

public class DeleteProductImageHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<DeleteProductImageCommand, Result>
{
    public async Task<Result> Handle(DeleteProductImageCommand request, CancellationToken cancellationToken)
    {
        var image = await db.ProductImages.FindAsync([request.ImageId], cancellationToken);
        if (image is null) return Result.Failure("Görsel bulunamadı.");

        var productId = image.ProductId;
        var imageUrl  = image.ImageUrl;

        db.ProductImages.Remove(image);
        await db.SaveChangesAsync(cancellationToken);

        // Silinen resim gerçek bir resimse ve ürünün başka gerçek resmi yoksa HasProductImage=false yap
        if (!imageUrl.Contains("no-image"))
        {
            var hasReal = await db.ProductImages.AnyAsync(
                i => i.ProductId == productId && !i.IsDeleted && !i.ImageUrl.Contains("no-image"),
                cancellationToken);
            var product = await db.Products.FindAsync([productId], cancellationToken);
            if (product is not null && product.HasProductImage != hasReal)
            {
                product.HasProductImage = hasReal;
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        await audit.LogAsync("ProductImageDeleted", "Product", productId.ToString(),
            oldValue: imageUrl, cancellationToken: cancellationToken);
        return Result.Success();
    }
}
