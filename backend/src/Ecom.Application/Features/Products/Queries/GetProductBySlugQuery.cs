using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Queries;

public record GetProductBySlugQuery(string Slug) : IRequest<ProductDetailDto?>;

public record ProductDetailDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? ShortDescription,
    string SKU,
    string? Barcode,
    string ProductType,
    Guid CategoryId,
    string CategoryName,
    Guid? BrandId,
    string? BrandName,
    decimal Price,
    decimal? DiscountPrice,
    string Currency,
    decimal TaxRate,
    bool IsActive,
    bool IsPublished,
    bool IsFeatured,
    string? MetaTitle,
    string? MetaDescription,
    int AvailableStock,
    List<ProductImageDto> Images,
    List<ProductVariantDto> Variants
);

public record ProductImageDto(Guid Id, string ImageUrl, int SortOrder, bool IsMain, string? AltText);

public record ProductVariantDto(
    Guid Id, string VariantName, string SKU,
    decimal Price, decimal? DiscountPrice, bool IsActive,
    string AttributesJson, int AvailableStock
);

public class GetProductBySlugQueryHandler(IApplicationDbContext db, ICacheService cache)
    : IRequestHandler<GetProductBySlugQuery, ProductDetailDto?>
{
    public async Task<ProductDetailDto?> Handle(GetProductBySlugQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"product:slug:{request.Slug}";
        var cached = await cache.GetAsync<ProductDetailDto>(cacheKey, cancellationToken);
        if (cached is not null) return cached;

        var product = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Variants.Where(v => v.IsActive))
                .ThenInclude(v => v.Stock)
            .Include(p => p.Stock)
            .FirstOrDefaultAsync(p => p.Slug == request.Slug && p.IsActive && p.IsPublished, cancellationToken);

        if (product is null) return null;

        var result = ProductMapper.ToDto(product);
        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), cancellationToken);
        return result;
    }
}

public record GetProductByIdQuery(Guid Id) : IRequest<ProductDetailDto?>;

public class GetProductByIdQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetProductByIdQuery, ProductDetailDto?>
{
    public async Task<ProductDetailDto?> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Variants.Where(v => v.IsActive))
                .ThenInclude(v => v.Stock)
            .Include(p => p.Stock)
            .FirstOrDefaultAsync(p => p.Id == request.Id && !p.IsDeleted, cancellationToken);

        return product is null ? null : ProductMapper.ToDto(product);
    }
}

internal static class ProductMapper
{
    internal static ProductDetailDto ToDto(Ecom.Domain.Entities.Product p) => new(
        p.Id, p.Name, p.Slug,
        p.Description, p.ShortDescription,
        p.SKU, p.Barcode,
        p.ProductType.ToString(),
        p.CategoryId, p.Category.Name,
        p.BrandId, p.Brand?.Name,
        p.Price, p.DiscountPrice, p.Currency, p.TaxRate,
        p.IsActive, p.IsPublished, p.IsFeatured,
        p.MetaTitle, p.MetaDescription,
        p.Stock?.AvailableQuantity ?? 0,
        p.Images.Select(i => new ProductImageDto(i.Id, i.ImageUrl, i.SortOrder, i.IsMain, i.AltText)).ToList(),
        p.Variants.Select(v => new ProductVariantDto(
            v.Id, v.VariantName, v.SKU,
            v.Price, v.DiscountPrice, v.IsActive,
            v.AttributesJson, v.Stock?.AvailableQuantity ?? 0)).ToList()
    );
}
