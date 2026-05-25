using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin;

public class ImportBatchProcessor(IApplicationDbContext db)
{
    private static readonly Dictionary<char, char> TrMap = new()
    {
        {'ğ','g'},{'Ğ','g'},{'ü','u'},{'Ü','u'},{'ş','s'},{'Ş','s'},
        {'ı','i'},{'İ','i'},{'ö','o'},{'Ö','o'},{'ç','c'},{'Ç','c'},
    };

    public static string Slugify(string s) =>
        System.Text.RegularExpressions.Regex.Replace(
            new string(s.Select(c => TrMap.TryGetValue(c, out var r) ? r : c).ToArray()).ToLowerInvariant(),
            @"[^a-z0-9\s-]", "")
        .Trim()
        .Replace(' ', '-');

    private static string? Map(Dictionary<string, string> row, Dictionary<string, string> mapping, string field)
    {
        if (mapping.TryGetValue(field, out var col) && row.TryGetValue(col, out var val))
            return val?.Trim();
        return null;
    }

    // Returns (inserted, updated, skipped, skipReasons)
    public Task<(int inserted, int updated, int skipped, Dictionary<string, int> skipReasons)> ProcessAsync(
        string targetEntity,
        List<Dictionary<string, string>> rows,
        Dictionary<string, string> fieldMapping,
        string conflictStrategy,
        CancellationToken ct,
        Guid? sourceId = null) => targetEntity switch
    {
        "Category" => ImportCategoriesAsync(rows, fieldMapping, conflictStrategy, ct, sourceId),
        "Brand"    => ImportBrandsAsync(rows, fieldMapping, conflictStrategy, ct, sourceId),
        "Product"  => ImportProductsAsync(rows, fieldMapping, conflictStrategy, ct, sourceId),
        "Stock"    => ImportStocksAsync(rows, fieldMapping, conflictStrategy, ct),
        _          => throw new InvalidOperationException($"Desteklenmeyen hedef: {targetEntity}"),
    };

    private static void Bump(Dictionary<string, int> d, string key)
        => d[key] = d.TryGetValue(key, out var v) ? v + 1 : 1;

    private async Task<(int, int, int, Dictionary<string, int>)> ImportCategoriesAsync(
        List<Dictionary<string, string>> rows, Dictionary<string, string> fm, string conflict, CancellationToken ct, Guid? sourceId)
    {
        int ins = 0, upd = 0, skip = 0;
        var reasons = new Dictionary<string, int>();
        var seen = await db.Categories.ToDictionaryAsync(c => c.Name.ToLower(), ct);

        foreach (var row in rows)
        {
            var name = Map(row, fm, "Name");
            if (string.IsNullOrWhiteSpace(name)) { skip++; Bump(reasons, "İsim boş"); continue; }
            var slug = Map(row, fm, "Slug") ?? Slugify(name);

            if (seen.TryGetValue(name.ToLower(), out var cat))
            {
                if (conflict == "update") { cat.Slug = slug; upd++; }
                else { skip++; Bump(reasons, "Çakışma (mevcut kayıt atlandı)"); }
            }
            else
            {
                var entity = new Category { Name = name, Slug = slug, Description = Map(row, fm, "Description"), ImportedFromSourceId = sourceId };
                db.Categories.Add(entity);
                seen[name.ToLower()] = entity;
                ins++;
            }
        }
        await db.SaveChangesAsync(ct);
        db.ClearChangeTracker();
        return (ins, upd, skip, reasons);
    }

    private async Task<(int, int, int, Dictionary<string, int>)> ImportBrandsAsync(
        List<Dictionary<string, string>> rows, Dictionary<string, string> fm, string conflict, CancellationToken ct, Guid? sourceId)
    {
        int ins = 0, upd = 0, skip = 0;
        var reasons = new Dictionary<string, int>();
        var seen = await db.Brands.ToDictionaryAsync(b => b.Name.ToLower(), ct);

        foreach (var row in rows)
        {
            var name = Map(row, fm, "Name");
            if (string.IsNullOrWhiteSpace(name)) { skip++; Bump(reasons, "İsim boş"); continue; }

            if (seen.TryGetValue(name.ToLower(), out var brand))
            {
                if (conflict == "update") { brand.Description = Map(row, fm, "Description") ?? brand.Description; upd++; }
                else { skip++; Bump(reasons, "Çakışma (mevcut kayıt atlandı)"); }
            }
            else
            {
                var entity = new Brand { Name = name, Slug = Slugify(name), Description = Map(row, fm, "Description"), ImportedFromSourceId = sourceId };
                db.Brands.Add(entity);
                seen[name.ToLower()] = entity;
                ins++;
            }
        }
        await db.SaveChangesAsync(ct);
        db.ClearChangeTracker();
        return (ins, upd, skip, reasons);
    }

    private async Task<(int, int, int, Dictionary<string, int>)> ImportProductsAsync(
        List<Dictionary<string, string>> rows, Dictionary<string, string> fm, string conflict, CancellationToken ct, Guid? sourceId)
    {
        int ins = 0, upd = 0, skip = 0;
        var reasons = new Dictionary<string, int>();

        // Per-batch optimized lookup: only load SKUs that appear in this batch
        var batchSkus = rows
            .Select(r => Map(r, fm, "SKU") ?? Map(r, fm, "Sku") ?? "")
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToHashSet();

        Dictionary<string, Product> seenSku;
        if (conflict == "update" && batchSkus.Count > 0)
        {
            // Load full entities only for batch-relevant SKUs
            seenSku = await db.Products
                .Where(p => batchSkus.Contains(p.SKU))
                .ToDictionaryAsync(p => p.SKU, ct);
        }
        else
        {
            // Skip strategy: only existence check — load keys only, no tracking
            var existingSkus = await db.Products
                .AsNoTracking()
                .Select(p => p.SKU)
                .ToHashSetAsync(ct);
            seenSku = existingSkus.ToDictionary(s => s, _ => (Product)null!);
        }

        // For slug uniqueness: load only string slugs (no entity tracking)
        var seenSlug = await db.Products
            .AsNoTracking()
            .Select(p => p.Slug)
            .ToHashSetAsync(ct);

        var categories = await db.Categories.AsNoTracking().ToDictionaryAsync(c => c.Name.ToLower(), ct);
        var brands = await db.Brands.AsNoTracking().ToDictionaryAsync(b => b.Name.ToLower(), ct);

        foreach (var row in rows)
        {
            var name = Map(row, fm, "Name");
            var sku = Map(row, fm, "SKU") ?? Map(row, fm, "Sku") ?? "";
            if (string.IsNullOrWhiteSpace(name)) { skip++; Bump(reasons, "İsim boş"); continue; }

            var priceStr = Map(row, fm, "Price") ?? Map(row, fm, "BasePrice");
            if (!decimal.TryParse(priceStr?.Replace(",", "."),
                System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var price))
            { skip++; Bump(reasons, "Fiyat geçersiz veya boş"); continue; }

            var catName = Map(row, fm, "Category");
            var brandName = Map(row, fm, "Brand");
            Guid? categoryId = catName != null && categories.TryGetValue(catName.ToLower(), out var cat) ? cat.Id : null;
            Guid? brandId = brandName != null && brands.TryGetValue(brandName.ToLower(), out var br) ? br.Id : null;

            if (!string.IsNullOrWhiteSpace(sku) && seenSku.TryGetValue(sku, out var prod))
            {
                if (conflict == "update" && prod != null)
                {
                    // Re-attach for update if needed
                    var tracked = db.Products.Local.FindEntry(prod.Id);
                    if (tracked == null)
                    {
                        var attached = await db.Products.FindAsync([prod.Id], ct);
                        if (attached != null)
                        {
                            attached.Name = name;
                            attached.Price = price;
                            if (categoryId.HasValue) attached.CategoryId = categoryId.Value;
                            if (brandId.HasValue) attached.BrandId = brandId.Value;
                            upd++;
                        }
                    }
                    else
                    {
                        prod.Name = name; prod.Price = price;
                        if (categoryId.HasValue) prod.CategoryId = categoryId.Value;
                        if (brandId.HasValue) prod.BrandId = brandId.Value;
                        upd++;
                    }
                }
                else { skip++; Bump(reasons, "Çakışma (mevcut kayıt atlandı)"); }
            }
            else
            {
                if (!categoryId.HasValue)
                {
                    skip++;
                    Bump(reasons, string.IsNullOrWhiteSpace(catName)
                        ? "Kategori alanı eşlenmemiş"
                        : $"Kategori bulunamadı: {catName}");
                    continue;
                }

                var slug = Slugify(name);
                var baseSlug = slug;
                for (int n = 2; seenSlug.Contains(slug); n++) slug = $"{baseSlug}-{n}";
                seenSlug.Add(slug);

                var entity = new Product
                {
                    Name = name, Slug = slug, SKU = sku, Price = price,
                    CategoryId = categoryId.Value, BrandId = brandId,
                    Description = Map(row, fm, "Description") ?? string.Empty,
                    ImportedFromSourceId = sourceId,
                };
                db.Products.Add(entity);
                if (!string.IsNullOrWhiteSpace(sku)) seenSku[sku] = entity;
                ins++;
            }
        }
        await db.SaveChangesAsync(ct);
        db.ClearChangeTracker();
        return (ins, upd, skip, reasons);
    }

    private async Task<(int, int, int, Dictionary<string, int>)> ImportStocksAsync(
        List<Dictionary<string, string>> rows, Dictionary<string, string> fm, string conflict, CancellationToken ct)
    {
        int ins = 0, upd = 0, skip = 0;
        var reasons = new Dictionary<string, int>();

        // Load only SKUs present in this batch
        var batchKeys = rows
            .Select(r => Map(r, fm, "SKU") ?? Map(r, fm, "Sku") ?? Map(r, fm, "ProductName") ?? "")
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToHashSet();

        var products = await db.Products
            .AsNoTracking()
            .Where(p => batchKeys.Contains(p.SKU))
            .ToDictionaryAsync(p => p.SKU, ct);

        var productIds = products.Values.Select(p => p.Id).ToHashSet();
        var stocks = await db.Stocks
            .Where(s => s.ProductId.HasValue && productIds.Contains(s.ProductId.Value))
            .ToDictionaryAsync(s => s.ProductId!.Value, ct);

        foreach (var row in rows)
        {
            var key = Map(row, fm, "SKU") ?? Map(row, fm, "Sku") ?? Map(row, fm, "ProductName");
            var qtyStr = Map(row, fm, "Quantity");
            if (string.IsNullOrWhiteSpace(key)) { skip++; Bump(reasons, "SKU / ürün kodu boş"); continue; }
            if (!int.TryParse(qtyStr, out var qty)) { skip++; Bump(reasons, "Adet geçersiz veya boş"); continue; }
            if (!products.TryGetValue(key, out var product)) { skip++; Bump(reasons, $"Ürün bulunamadı: {key}"); continue; }

            if (stocks.TryGetValue(product.Id, out var stock))
            {
                stock.Quantity = qty; upd++;
            }
            else
            {
                db.Stocks.Add(new Stock { ProductId = product.Id, Quantity = qty });
                ins++;
            }
        }
        await db.SaveChangesAsync(ct);
        db.ClearChangeTracker();
        return (ins, upd, skip, reasons);
    }
}
