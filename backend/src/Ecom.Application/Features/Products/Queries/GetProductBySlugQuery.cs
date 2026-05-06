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

public class GetProductBySlugQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetProductBySlugQuery, ProductDetailDto?>
{
    public async Task<ProductDetailDto?> Handle(GetProductBySlugQuery request, CancellationToken cancellationToken)
    {
        var product = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Variants.Where(v => v.IsActive))
                .ThenInclude(v => v.Stock)
            .Include(p => p.Stock)
            .FirstOrDefaultAsync(p => p.Slug == request.Slug, cancellationToken);

        if (product is null) return null;

        return new ProductDetailDto(
            product.Id, product.Name, product.Slug,
            product.Description, product.ShortDescription,
            product.SKU, product.Barcode,
            product.ProductType.ToString(),
            product.CategoryId, product.Category.Name,
            product.BrandId, product.Brand?.Name,
            product.Price, product.DiscountPrice, product.Currency, product.TaxRate,
            product.IsActive, product.IsPublished,
            product.MetaTitle, product.MetaDescription,
            product.Stock?.AvailableQuantity ?? 0,
            product.Images.Select(i => new ProductImageDto(i.Id, i.ImageUrl, i.SortOrder, i.IsMain, i.AltText)).ToList(),
            product.Variants.Select(v => new ProductVariantDto(
                v.Id, v.VariantName, v.SKU,
                v.Price, v.DiscountPrice, v.IsActive,
                v.AttributesJson, v.Stock?.AvailableQuantity ?? 0)).ToList()
        );
    }
}
