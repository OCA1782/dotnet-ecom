using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;

namespace Ecom.Application.Features.Products.Commands;

public record DeactivateProductCommand(Guid Id) : IRequest<Result>;

public class DeactivateProductHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<DeactivateProductCommand, Result>
{
    public async Task<Result> Handle(DeactivateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await db.Products.FindAsync([request.Id], cancellationToken);
        if (product is null) return Result.Failure("Ürün bulunamadı.");

        product.IsActive = false;
        product.IsPublished = false;
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("ProductDeactivated", "Product", product.Id.ToString(), cancellationToken: cancellationToken);

        return Result.Success();
    }
}
