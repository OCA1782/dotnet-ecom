using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Products.Queries;

public record GetProductsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    Guid? CategoryId = null,
    Guid? BrandId = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    bool? InStock = null,
    bool AdminView = false
) : IRequest<PaginatedList<ProductListItemDto>>;

public record ProductListItemDto(
    Guid Id,
    string Name,
    string Slug,
    string? ShortDescription,
    string SKU,
    string? CategoryName,
    string? BrandName,
    decimal Price,
    decimal? DiscountPrice,
    string Currency,
    int StockQuantity,
    string? MainImageUrl,
    bool IsActive,
    bool IsPublished
);

public class GetProductsQueryHandler(IApplicationDbContext db) : IRequestHandler<GetProductsQuery, PaginatedList<ProductListItemDto>>
{
    public async Task<PaginatedList<ProductListItemDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = db.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Images.Where(i => i.IsMain))
            .Include(p => p.Stock)
            .AsQueryable();

        if (!request.AdminView)
            query = query.Where(p => p.IsActive && p.IsPublished);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(p => p.Name.Contains(request.Search) || p.SKU.Contains(request.Search));

        if (request.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == request.CategoryId);

        if (request.BrandId.HasValue)
            query = query.Where(p => p.BrandId == request.BrandId);

        if (request.MinPrice.HasValue)
            query = query.Where(p => (p.DiscountPrice ?? p.Price) >= request.MinPrice);

        if (request.MaxPrice.HasValue)
            query = query.Where(p => (p.DiscountPrice ?? p.Price) <= request.MaxPrice);

        if (request.InStock == true)
            query = query.Where(p => p.Stock != null && (p.Stock.Quantity - p.Stock.ReservedQuantity) > 0);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(p => p.CreatedDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProductListItemDto(
                p.Id, p.Name, p.Slug, p.ShortDescription, p.SKU,
                p.Category.Name,
                p.Brand != null ? p.Brand.Name : null,
                p.Price, p.DiscountPrice, p.Currency,
                p.Stock != null ? p.Stock.Quantity - p.Stock.ReservedQuantity : 0,
                p.Images.Any() ? p.Images.First().ImageUrl : null,
                p.IsActive, p.IsPublished))
            .ToListAsync(cancellationToken);

        return PaginatedList<ProductListItemDto>.Create(items, total, request.Page, request.PageSize);
    }
}
