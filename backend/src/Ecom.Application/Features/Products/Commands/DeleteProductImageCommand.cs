using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;

namespace Ecom.Application.Features.Products.Commands;

public record DeleteProductImageCommand(Guid ImageId) : IRequest<Result>;

public class DeleteProductImageHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<DeleteProductImageCommand, Result>
{
    public async Task<Result> Handle(DeleteProductImageCommand request, CancellationToken cancellationToken)
    {
        var image = await db.ProductImages.FindAsync([request.ImageId], cancellationToken);
        if (image is null) return Result.Failure("Görsel bulunamadı.");

        var productId = image.ProductId.ToString();
        var imageUrl = image.ImageUrl;

        db.ProductImages.Remove(image);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("ProductImageDeleted", "Product", productId,
            oldValue: imageUrl, cancellationToken: cancellationToken);
        return Result.Success();
    }
}
