using System.Net;
using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Products.Commands;
using Ecom.Application.Features.Products.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? categorySlug = null,
        [FromQuery] Guid? brandId = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] bool? inStock = null,
        [FromQuery] bool? featured = null,
        [FromQuery] bool? onSale = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? brandIds = null,
        [FromQuery] int? minRating = null,
        [FromQuery] string? attributes = null,
        [FromQuery] bool? onlyActive = null,
        [FromQuery] string? dataSource = null,
        CancellationToken ct = default)
    {
        var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("Admin") || User.IsInRole("ProductManager");
        var result = await mediator.Send(new GetProductsQuery(
            page, pageSize, search, categoryId, categorySlug, brandId, minPrice, maxPrice, inStock, isAdmin, featured, onSale, sortBy, brandIds, minRating, attributes, onlyActive, dataSource), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductByIdQuery(id), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions([FromQuery] string q = "", [FromQuery] int limit = 8, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(new { items = Array.Empty<object>(), totalProducts = 0 });
        var result = await mediator.Send(new GetSearchSuggestionsQuery(q, limit), ct);
        return Ok(result);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductBySlugQuery(slug), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> Create([FromBody] CreateProductCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetBySlug), new { slug = command.Slug }, new { id = result.Data });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest("ID uyuşmazlığı.");
        var result = await mediator.Send(command, ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return NoContent();
    }

    [HttpGet("attributes")]
    public async Task<IActionResult> GetAttributes([FromQuery] string? categorySlug = null, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetProductAttributesQuery(categorySlug), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteProductCommand(id), ct);
        if (!result.Succeeded) return BadRequest(new { error = result.Error });
        return NoContent();
    }

    [HttpGet("{id:guid}/history")]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> GetHistory(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductHistoryQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> Bulk([FromBody] BulkProductsCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPost("bulk-price-preview")]
    [Authorize(Roles = "SuperAdmin,Admin,ProductManager")]
    public async Task<IActionResult> BulkPricePreview([FromBody] BulkPricePreviewQuery query, CancellationToken ct)
    {
        var count = await mediator.Send(query, ct);
        return Ok(new { count });
    }

    /// <summary>
    /// CatalogIQ machine-to-machine upsert endpoint. Authenticates via X-CatalogIQ-Key header.
    /// Creates or updates a product by SKU; auto-creates missing category/brand by name.
    /// </summary>
    [HttpPost("import")]
    [AllowAnonymous]
    public async Task<IActionResult> Import(
        [FromBody] CatalogIqProductDto dto,
        [FromHeader(Name = "X-CatalogIQ-Key")] string? headerKey,
        [FromHeader(Name = "Authorization")] string? authHeader,
        [FromServices] IConfiguration configuration,
        [FromServices] IApplicationDbContext db,
        CancellationToken ct)
    {
        var expectedKey = configuration["CatalogIQ:ApiKey"];
        var apiKey = headerKey
            ?? (authHeader?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true ? authHeader[7..] : authHeader);
        if (string.IsNullOrEmpty(expectedKey) || apiKey != expectedKey)
            return Unauthorized(new { error = "Geçersiz API anahtarı." });

        if (string.IsNullOrWhiteSpace(dto.Sku) || string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { error = "name ve sku zorunludur." });

        if (dto.Price is null or <= 0)
            return BadRequest(new { error = "Geçerli bir fiyat gereklidir." });

        // HTML-decode text fields — two passes handle double-encoded entities (&amp;nbsp; → &nbsp; → space)
        static string? DecodeHtml(string? raw, bool stripTags = false)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            var decoded = WebUtility.HtmlDecode(WebUtility.HtmlDecode(raw));
            if (!stripTags) return decoded.Trim();
            var stripped = System.Text.RegularExpressions.Regex.Replace(decoded, "<[^>]+>", " ");
            return System.Text.RegularExpressions.Regex.Replace(stripped, @"\s{2,}", " ").Trim();
        }
        var shortDesc = DecodeHtml(dto.ShortDescription, stripTags: true);
        var description = DecodeHtml(dto.Description, stripTags: false);

        // Collect all image URLs, deduplicated and non-empty
        var allImageUrls = new List<string>();
        if (!string.IsNullOrWhiteSpace(dto.ImageUrl)) allImageUrls.Add(dto.ImageUrl.Trim());
        if (dto.ImageUrls is { Length: > 0 })
            allImageUrls.AddRange(dto.ImageUrls.Where(u => !string.IsNullOrWhiteSpace(u)).Select(u => u.Trim()));
        allImageUrls = allImageUrls.Distinct().ToList();

        // Resolve stock quantity from status string
        int? stockQty = null;
        if (!string.IsNullOrWhiteSpace(dto.StockStatus))
        {
            var lower = dto.StockStatus.ToLowerInvariant();
            stockQty = lower is "in_stock" or "instock" or "stokta" or "stokta var" or "var" or "mevcut" or "available" ? 99 : 0;
        }

        // Resolve or auto-create category hierarchy (e.g. "Otomotiv > Fren Sistemi > Balata")
        Guid? categoryId = null;
        if (!string.IsNullOrWhiteSpace(dto.CategoryName))
        {
            var levels = dto.CategoryName
                .Split('>')
                .Select(s => s.Trim())
                .Where(s => s.Length > 0)
                .ToList();

            Guid? parentId = null;
            foreach (var level in levels)
            {
                var nameLower = level.ToLowerInvariant();
                var category = await db.Categories
                    .FirstOrDefaultAsync(c =>
                        c.Name.ToLower() == nameLower &&
                        c.ParentCategoryId == parentId, ct);

                if (category is null)
                {
                    category = new Ecom.Domain.Entities.Category
                    {
                        Name = level,
                        Slug = await EnsureUniqueCategorySlug(db, Slugify(level), ct),
                        ParentCategoryId = parentId,
                    };
                    db.Categories.Add(category);
                    await db.SaveChangesAsync(ct);
                }
                parentId = category.Id;
            }
            categoryId = parentId;
        }

        // Resolve or auto-create brand by name
        Guid? brandId = null;
        if (!string.IsNullOrWhiteSpace(dto.BrandName))
        {
            var brand = await db.Brands
                .FirstOrDefaultAsync(b => b.Name.ToLower() == dto.BrandName.ToLower(), ct);

            if (brand is null)
            {
                brand = new Ecom.Domain.Entities.Brand
                {
                    Name = dto.BrandName,
                    Slug = Slugify(dto.BrandName),
                };
                db.Brands.Add(brand);
                await db.SaveChangesAsync(ct);
            }
            brandId = brand.Id;
        }

        // Upsert by SKU
        var existing = await db.Products
            .Include(p => p.Images)
            .Include(p => p.Stock)
            .FirstOrDefaultAsync(p => p.SKU == dto.Sku, ct);
        if (existing is not null)
        {
            existing.Name = dto.Name;
            existing.Price = dto.Price.Value;
            if (shortDesc is not null) existing.ShortDescription = shortDesc;
            if (description is not null) existing.Description = description;
            existing.Currency = dto.Currency ?? existing.Currency;
            if (!string.IsNullOrWhiteSpace(dto.Barcode)) existing.Barcode = dto.Barcode;
            if (categoryId.HasValue) existing.CategoryId = categoryId.Value;
            if (brandId.HasValue) existing.BrandId = brandId.Value;

            // Sync images: remove stale, add new
            if (allImageUrls.Count > 0)
            {
                var toRemove = existing.Images.Where(i => !allImageUrls.Contains(i.ImageUrl)).ToList();
                foreach (var img in toRemove) db.ProductImages.Remove(img);

                var existingUrls = existing.Images.Select(i => i.ImageUrl).ToHashSet();
                for (var i = 0; i < allImageUrls.Count; i++)
                {
                    if (!existingUrls.Contains(allImageUrls[i]))
                        db.ProductImages.Add(new Ecom.Domain.Entities.ProductImage { ProductId = existing.Id, ImageUrl = allImageUrls[i], IsMain = i == 0, SortOrder = i });
                }
                foreach (var img in existing.Images.Where(i => allImageUrls.Contains(i.ImageUrl)))
                {
                    var idx = allImageUrls.IndexOf(img.ImageUrl);
                    img.IsMain = idx == 0;
                    img.SortOrder = idx;
                }
            }

            // Sync stock
            if (stockQty.HasValue)
            {
                if (existing.Stock is null)
                    db.Stocks.Add(new Ecom.Domain.Entities.Stock { ProductId = existing.Id, Quantity = stockQty.Value });
                else
                    existing.Stock.Quantity = stockQty.Value;
            }

            await db.SaveChangesAsync(ct);
            return Ok(new { id = existing.Id, action = "updated", sku = existing.SKU });
        }

        // Create new product
        var slug = await EnsureUniqueSlug(db, Slugify(dto.Name), ct);
        var product = new Ecom.Domain.Entities.Product
        {
            Name = dto.Name,
            Slug = slug,
            SKU = dto.Sku,
            ShortDescription = shortDesc,
            Description = description,
            Barcode = dto.Barcode,
            Price = dto.Price.Value,
            Currency = dto.Currency ?? "TRY",
            CategoryId = categoryId ?? await GetDefaultCategoryId(db, ct),
            BrandId = brandId,
            IsPublished = true,
            IsActive = true,
            DataSource = "catalogiq",
        };
        db.Products.Add(product);
        await db.SaveChangesAsync(ct);

        for (var i = 0; i < allImageUrls.Count; i++)
            db.ProductImages.Add(new Ecom.Domain.Entities.ProductImage { ProductId = product.Id, ImageUrl = allImageUrls[i], IsMain = i == 0, SortOrder = i });

        if (stockQty.HasValue)
            db.Stocks.Add(new Ecom.Domain.Entities.Stock { ProductId = product.Id, Quantity = stockQty.Value });

        if (allImageUrls.Count > 0 || stockQty.HasValue)
            await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetBySlug), new { slug = product.Slug }, new { id = product.Id, action = "created", sku = product.SKU });
    }

    private static string Slugify(string s)
    {
        var map = new Dictionary<char, char>
        {
            {'ğ','g'},{'Ğ','g'},{'ü','u'},{'Ü','u'},{'ş','s'},{'Ş','s'},
            {'ı','i'},{'İ','i'},{'ö','o'},{'Ö','o'},{'ç','c'},{'Ç','c'},
        };
        var clean = new string(s.Select(c => map.TryGetValue(c, out var r) ? r : c).ToArray()).ToLowerInvariant();
        return System.Text.RegularExpressions.Regex.Replace(clean, @"[^a-z0-9]+", "-").Trim('-');
    }

    private static async Task<string> EnsureUniqueSlug(IApplicationDbContext db, string baseSlug, CancellationToken ct)
    {
        var slug = baseSlug;
        var counter = 1;
        while (await db.Products.AnyAsync(p => p.Slug == slug, ct))
            slug = $"{baseSlug}-{counter++}";
        return slug;
    }

    private static async Task<string> EnsureUniqueCategorySlug(IApplicationDbContext db, string baseSlug, CancellationToken ct)
    {
        var slug = baseSlug;
        var counter = 1;
        while (await db.Categories.AnyAsync(c => c.Slug == slug, ct))
            slug = $"{baseSlug}-{counter++}";
        return slug;
    }

    private static async Task<Guid> GetDefaultCategoryId(IApplicationDbContext db, CancellationToken ct)
    {
        var cat = await db.Categories.FirstOrDefaultAsync(ct);
        if (cat is not null) return cat.Id;
        var newCat = new Ecom.Domain.Entities.Category { Name = "Genel", Slug = "genel" };
        db.Categories.Add(newCat);
        await db.SaveChangesAsync(ct);
        return newCat.Id;
    }
}

public record CatalogIqProductDto(
    string Name,
    string Sku,
    decimal? Price,
    string? ShortDescription,
    string? Description,
    string? CategoryName,
    string? BrandName,
    string? ImageUrl,
    string[]? ImageUrls,
    string? Currency,
    string? SourceUrl,
    string? Barcode,
    string? StockStatus);
