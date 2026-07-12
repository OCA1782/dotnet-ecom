using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Categories.Commands;

public record DeleteCategoryCommand(Guid Id, bool Cascade = false) : IRequest<Result>;

public class DeleteCategoryHandler(IApplicationDbContext db, IAuditService audit, ICacheService cache)
    : IRequestHandler<DeleteCategoryCommand, Result>
{
    public async Task<Result> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await db.Categories
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken);
        if (category is null)
            return Result.Failure("Kategori bulunamadı.");

        if (!request.Cascade)
        {
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
            await audit.LogAsync("CategoryDeleted", "Kategori", category.Id.ToString(), cancellationToken: cancellationToken);
            await cache.RemoveByPrefixAsync("categories:", cancellationToken);
            return Result.Success();
        }

        // Cascade: BFS to collect all descendant category IDs
        var allCategoryIds = new HashSet<Guid> { request.Id };
        var queue = new Queue<Guid>();
        queue.Enqueue(request.Id);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            var children = await db.Categories
                .IgnoreQueryFilters()
                .Where(c => c.ParentCategoryId == current && !c.IsDeleted)
                .Select(c => c.Id)
                .ToListAsync(cancellationToken);
            foreach (var child in children)
                if (allCategoryIds.Add(child))
                    queue.Enqueue(child);
        }

        // Soft-delete all products in those categories
        var products = await db.Products
            .IgnoreQueryFilters()
            .Where(p => allCategoryIds.Contains(p.CategoryId) && !p.IsDeleted)
            .ToListAsync(cancellationToken);
        var productIds = products.Select(p => p.Id).ToHashSet();
        foreach (var p in products)
        {
            p.IsDeleted = true;
            p.IsActive = false;
        }

        // Soft-delete associated stocks so the stocks screen stays consistent
        if (productIds.Count > 0)
        {
            var stocks = await db.Stocks
                .IgnoreQueryFilters()
                .Where(s => s.ProductId.HasValue && productIds.Contains(s.ProductId.Value) && !s.IsDeleted)
                .ToListAsync(cancellationToken);
            foreach (var s in stocks)
                s.IsDeleted = true;
        }

        // Soft-delete all descendant categories (children first, then root last)
        var cats = await db.Categories
            .IgnoreQueryFilters()
            .Where(c => allCategoryIds.Contains(c.Id) && !c.IsDeleted)
            .ToListAsync(cancellationToken);
        foreach (var c in cats)
        {
            c.IsActive = false;
            c.IsDeleted = true;
        }

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("CategoryDeleted", "Kategori", category.Id.ToString(),
            newValue: $"Cascade: {products.Count} ürün, {cats.Count - 1} alt kategori silindi",
            cancellationToken: cancellationToken);
        await cache.RemoveByPrefixAsync("categories:", cancellationToken);

        return Result.Success();
    }
}
