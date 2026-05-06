using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Categories.Commands;

public record DeleteCategoryCommand(Guid Id) : IRequest<Result>;

public class DeleteCategoryHandler(IApplicationDbContext db, IAuditService audit)
    : IRequestHandler<DeleteCategoryCommand, Result>
{
    public async Task<Result> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await db.Categories.FindAsync([request.Id], cancellationToken);
        if (category is null)
            return Result.Failure("Kategori bulunamadı.");

        var hasActiveProducts = await db.Products
            .AnyAsync(p => p.CategoryId == request.Id && p.IsActive, cancellationToken);
        if (hasActiveProducts)
            return Result.Failure("İçinde aktif ürün bulunan kategori silinemez. Önce ürünleri pasif yapın veya taşıyın.");

        var hasSubCategories = await db.Categories
            .AnyAsync(c => c.ParentCategoryId == request.Id && c.IsActive, cancellationToken);
        if (hasSubCategories)
            return Result.Failure("Alt kategorisi bulunan kategori silinemez.");

        category.IsActive = false;
        category.IsDeleted = true;
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("CategoryDeleted", "Category", category.Id.ToString(), cancellationToken: cancellationToken);

        return Result.Success();
    }
}
