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
    string? CategorySlug = null,
    Guid? BrandId = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    bool? InStock = null,
    bool AdminView = false,
    bool? IsFeatured = null,
    bool? OnSale = null,
    string? SortBy = null,       // newest | bestseller | price-asc | price-desc | name-asc | name-desc | stock-asc | stock-desc
    string? BrandIds = null,     // comma-separated brand IDs for multi-brand filter
    int? MinRating = null,       // minimum average rating (1-5)
    string? Attributes = null,   // comma-separated key:value pairs, e.g. "Renk:Kırmızı,Beden:M"
    bool? OnlyActive = null,     // admin view: explicitly restrict to active-only
    string? DataSource = null    // "__manual__" = null datasource, otherwise exact match
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
    int AvailableStock,
    string? ImageUrl,
    bool IsActive,
    bool IsPublished,
    bool IsFeatured,
    string? ImportedFromSourceName = null,
    DateTime CreatedDate = default,
    string? DataSource = null,
    string? CreatedByAdminEmail = null
);

public class GetProductsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<GetProductsQuery, PaginatedList<ProductListItemDto>>
{
    public async Task<PaginatedList<ProductListItemDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = db.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Images.Where(i => i.IsMain))
            .Include(p => p.Stock)
            .Where(p => !p.IsDeleted)
            .AsQueryable();

        if (!request.AdminView)
            query = query.Where(p => p.IsActive && p.IsPublished);
        else if (request.OnlyActive == true)
            query = query.Where(p => p.IsActive);

        if (request.AdminView && !currentUser.IsSuperAdmin && currentUser.UserId.HasValue)
            query = query.Where(p => p.CreatedByAdminId == currentUser.UserId.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(p => p.Name.Contains(request.Search) || p.SKU.Contains(request.Search) || (p.Brand != null && p.Brand.Name.Contains(request.Search)));

        if (request.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == request.CategoryId);

        if (!string.IsNullOrWhiteSpace(request.CategorySlug))
        {
            var slug = request.CategorySlug.ToLower();
            query = query.Where(p => p.Category.Slug == slug);
        }

        if (request.BrandId.HasValue)
            query = query.Where(p => p.BrandId == request.BrandId);

        // DataSource filter: "__manual__" = null/empty datasource
        if (!string.IsNullOrWhiteSpace(request.DataSource))
        {
            if (request.DataSource == "__manual__")
                query = query.Where(p => p.DataSource == null || p.DataSource == "");
            else
                query = query.Where(p => p.DataSource == request.DataSource);
        }

        // Multi-brand filter (comma-separated brand IDs)
        if (!string.IsNullOrWhiteSpace(request.BrandIds))
        {
            var ids = request.BrandIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => Guid.TryParse(s.Trim(), out var g) ? g : Guid.Empty)
                .Where(g => g != Guid.Empty)
                .ToList();
            if (ids.Count > 0)
                query = query.Where(p => p.BrandId.HasValue && ids.Contains(p.BrandId.Value));
        }

        // Rating filter: require average review score >= minRating
        if (request.MinRating.HasValue && request.MinRating.Value > 0)
        {
            var minRating = request.MinRating.Value;
            var ratedProductIds = await db.ProductReviews
                .Where(r => r.IsApproved)
                .GroupBy(r => r.ProductId)
                .Where(g => g.Average(r => r.Rating) >= minRating)
                .Select(g => g.Key)
                .ToListAsync(cancellationToken);
            query = query.Where(p => ratedProductIds.Contains(p.Id));
        }

        // Attribute/color filter: "Renk:Kırmızı,Beden:M" → products with matching variants
        if (!string.IsNullOrWhiteSpace(request.Attributes))
        {
            var pairs = request.Attributes
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(p => p.Trim().Split(':', 2))
                .Where(p => p.Length == 2)
                .Select(p => new { Key = p[0].Trim().ToLower(), Value = p[1].Trim().ToLower() })
                .ToList();

            if (pairs.Count > 0)
            {
                var productIds = await db.ProductVariants
                    .Where(v => v.AttributesJson != "[]" && v.AttributesJson != "")
                    .Select(v => new { v.ProductId, v.AttributesJson })
                    .ToListAsync(cancellationToken);

                var matchingIds = productIds
                    .Where(v =>
                    {
                        try
                        {
                            var attrs = System.Text.Json.JsonSerializer.Deserialize<List<AttrPair>>(v.AttributesJson);
                            if (attrs == null) return false;
                            return pairs.All(filter =>
                                attrs.Any(a =>
                                    a.Key.ToLower() == filter.Key &&
                                    a.Value.ToLower() == filter.Value));
                        }
                        catch { return false; }
                    })
                    .Select(v => v.ProductId)
                    .Distinct()
                    .ToHashSet();

                query = query.Where(p => matchingIds.Contains(p.Id));
            }
        }

        if (request.MinPrice.HasValue)
            query = query.Where(p => (p.DiscountPrice ?? p.Price) >= request.MinPrice);

        if (request.MaxPrice.HasValue)
            query = query.Where(p => (p.DiscountPrice ?? p.Price) <= request.MaxPrice);

        if (request.InStock == true)
            query = query.Where(p => p.Stock != null && (p.Stock.Quantity - p.Stock.ReservedQuantity) > 0);

        if (request.IsFeatured.HasValue)
            query = query.Where(p => p.IsFeatured == request.IsFeatured.Value);

        if (request.OnSale == true)
            query = query.Where(p => p.DiscountPrice != null);

        if (request.SortBy == "newest")
            query = query.Where(p => p.CreatedDate >= DateTime.UtcNow.AddDays(-60));

        var total = await query.CountAsync(cancellationToken);

        IQueryable<Ecom.Domain.Entities.Product> orderedQuery = request.SortBy switch
        {
            "bestseller"  => query
                .GroupJoin(db.OrderItems, p => p.Id, oi => oi.ProductId,
                    (p, ois) => new { Product = p, SalesCount = ois.Sum(oi => (int?)oi.Quantity) ?? 0 })
                .OrderByDescending(x => x.SalesCount)
                .Select(x => x.Product),
            "price-asc"   => query.OrderBy(p => p.DiscountPrice ?? p.Price),
            "price-desc"  => query.OrderByDescending(p => p.DiscountPrice ?? p.Price),
            "name-asc"    => query.OrderBy(p => p.Name),
            "name-desc"   => query.OrderByDescending(p => p.Name),
            "stock-asc"        => query.OrderBy(p => (int?)(p.Stock == null ? 0 : p.Stock.Quantity - p.Stock.ReservedQuantity)),
            "stock-desc"       => query.OrderByDescending(p => (int?)(p.Stock == null ? 0 : p.Stock.Quantity - p.Stock.ReservedQuantity)),
            "createdDate-asc"  => query.OrderBy(p => p.CreatedDate),
            "createdDate-desc" => query.OrderByDescending(p => p.CreatedDate),
            "dataSource-asc"   => query.OrderBy(p => p.DataSource),
            "dataSource-desc"  => query.OrderByDescending(p => p.DataSource),
            _                  => query.OrderByDescending(p => p.CreatedDate),
        };

        var items = await orderedQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProductListItemDto(
                p.Id, p.Name, p.Slug, p.ShortDescription, p.SKU,
                p.Category != null ? p.Category.Name : null,
                p.Brand != null ? p.Brand.Name : null,
                p.Price, p.DiscountPrice, p.Currency,
                p.Stock != null ? p.Stock.Quantity - p.Stock.ReservedQuantity : 0,
                p.Images.Any() ? p.Images.First().ImageUrl : null,
                p.IsActive, p.IsPublished, p.IsFeatured,
                p.ImportedFromSourceId != null
                    ? db.ExternalSources.Where(s => s.Id == p.ImportedFromSourceId).Select(s => s.Name).FirstOrDefault()
                    : null,
                p.CreatedDate,
                p.DataSource,
                p.CreatedByAdminId != null
                    ? db.Users.Where(u => u.Id == p.CreatedByAdminId).Select(u => u.Email).FirstOrDefault()
                    : null))
            .ToListAsync(cancellationToken);

        return PaginatedList<ProductListItemDto>.Create(items, total, request.Page, request.PageSize);
    }

    private record AttrPair(string Key, string Value);
}
