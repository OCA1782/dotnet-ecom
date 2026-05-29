using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Brands.Commands;

public record DeleteBrandCommand(Guid Id) : IRequest<Result>;

public class DeleteBrandHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<DeleteBrandCommand, Result>
{
    public async Task<Result> Handle(DeleteBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = await db.Brands.FindAsync([request.Id], cancellationToken);
        if (brand is null)
            return Result.Failure("Marka bulunamadı.");

        var hasActiveProducts = await db.Products
            .AnyAsync(p => p.BrandId == request.Id && p.IsActive, cancellationToken);
        if (hasActiveProducts)
            return Result.Failure("Aktif ürünü bulunan marka silinemez. Önce ürünleri pasif yapın veya markasını değiştirin.");

        brand.IsActive = false;
        brand.IsDeleted = true;
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("BrandDeleted", "Marka", brand.Id.ToString(), cancellationToken: cancellationToken);

        return Result.Success();
    }
}
