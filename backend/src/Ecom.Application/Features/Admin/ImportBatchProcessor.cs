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

    // Returns (inserted, updated, skipped, restored, skipReasons)
    // touchedProductIds: optional accumulator — populated with the DB IDs of every product seen (insert, update, or no-change skip)
    public Task<(int inserted, int updated, int skipped, int restored, Dictionary<string, int> skipReasons)> ProcessAsync(
        string targetEntity,
        List<Dictionary<string, string>> rows,
        Dictionary<string, string> fieldMapping,
        string conflictStrategy,
        CancellationToken ct,
        Guid? sourceId = null,
        HashSet<Guid>? touchedProductIds = null) => targetEntity switch
    {
        "Category" => WrapWithZeroRestored(ImportCategoriesAsync(rows, fieldMapping, conflictStrategy, ct, sourceId)),
        "Brand"    => WrapWithZeroRestored(ImportBrandsAsync(rows, fieldMapping, conflictStrategy, ct, sourceId)),
        "Product"  => ImportProductsAsync(rows, fieldMapping, conflictStrategy, ct, sourceId, touchedProductIds),
        "Stock"    => WrapWithZeroRestored(ImportStocksAsync(rows, fieldMapping, conflictStrategy, ct)),
        _          => throw new InvalidOperationException($"Desteklenmeyen hedef: {targetEntity}"),
    };

    private static async Task<(int, int, int, int, Dictionary<string, int>)> WrapWithZeroRestored(
        Task<(int ins, int upd, int skip, Dictionary<string, int> reasons)> inner)
    {
        var (ins, upd, skip, reasons) = await inner;
        return (ins, upd, skip, 0, reasons);
    }

    private static void Bump(Dictionary<string, int> d, string key)
        => d[key] = d.TryGetValue(key, out var v) ? v + 1 : 1;

    // --- Idempotency helpers ---

    private static bool SameStr(string? a, string? b)
        => string.Equals((a ?? "").Trim(), (b ?? "").Trim(), StringComparison.OrdinalIgnoreCase);

    private static bool SameDecimal(decimal a, decimal b) => Math.Abs(a - b) < 0.005m;

    // --- Category hierarchy resolver ---
    // Handles plain names ("Süspansiyon") and hierarchical paths ("Otomotiv > Süspansiyon > Amortisör").
    // Soft-deleted categories are included (IgnoreQueryFilters) to avoid slug duplicate errors;
    // they are collected in `toReactivate` and re-enabled before SaveChangesAsync.
    private Guid? ResolveCategoryId(
        string catName,
        Dictionary<string, Category> seen,
        HashSet<string> slugsSeen,
        Guid? sourceId,
        HashSet<Guid> toReactivate)
    {
        if (string.IsNullOrWhiteSpace(catName)) return null;

        if (!catName.Contains('>'))
        {
            var key = catName.ToLower();
            if (seen.TryGetValue(key, out var direct) && !direct.IsDeleted)
                return direct.Id;

            // "Otomotiv Filtre" → detect "Otomotiv" root prefix → create "Filtre" under Otomotiv.
            // Tries longest prefix first (e.g. "A B C" checks "A B" before "A").
            var words = catName.Split(' ');
            if (words.Length > 1)
            {
                for (int i = words.Length - 1; i >= 1; i--)
                {
                    var prefix = string.Join(" ", words.Take(i));
                    if (seen.TryGetValue(prefix.ToLower(), out var parentCat)
                        && !parentCat.IsDeleted
                        && parentCat.ParentCategoryId == null)
                    {
                        var subName = string.Join(" ", words.Skip(i));
                        var existingSub = seen.Values.FirstOrDefault(c =>
                            c.Name.Equals(subName, StringComparison.OrdinalIgnoreCase)
                            && c.ParentCategoryId == parentCat.Id
                            && !c.IsDeleted);
                        if (existingSub != null)
                            return existingSub.Id;

                        var subSlug = Slugify(subName);
                        var baseSubSlug = subSlug;
                        for (int n = 2; slugsSeen.Contains(subSlug); n++) subSlug = $"{baseSubSlug}-{n}";
                        slugsSeen.Add(subSlug);
                        var sub = new Category
                        {
                            Name = subName,
                            Slug = subSlug,
                            ParentCategoryId = parentCat.Id,
                            ImportedFromSourceId = sourceId,
                        };
                        db.Categories.Add(sub);
                        seen[subName.ToLower()] = sub;
                        return sub.Id;
                    }
                }
            }

            // Reactivate soft-deleted category if no prefix match
            if (seen.TryGetValue(key, out var softDel) && softDel.IsDeleted)
            {
                toReactivate.Add(softDel.Id);
                return softDel.Id;
            }

            // Auto-create root-level category
            var slug = Slugify(catName);
            var baseSlug = slug;
            for (int n = 2; slugsSeen.Contains(slug); n++) slug = $"{baseSlug}-{n}";
            slugsSeen.Add(slug);
            var cat = new Category { Name = catName, Slug = slug, ImportedFromSourceId = sourceId };
            db.Categories.Add(cat);
            seen[key] = cat;
            return cat.Id;
        }

        var parts = catName.Split('>').Select(p => p.Trim()).Where(p => !string.IsNullOrEmpty(p)).ToArray();
        if (parts.Length == 0) return null;

        Guid? parentId = null;
        Category? leaf = null;

        foreach (var part in parts)
        {
            var key = part.ToLower();
            if (seen.TryGetValue(key, out var existing))
            {
                if (existing.IsDeleted) toReactivate.Add(existing.Id);
                parentId = existing.Id;
                leaf = existing;
            }
            else
            {
                var slug = Slugify(part);
                var baseSlug = slug;
                for (int n = 2; slugsSeen.Contains(slug); n++) slug = $"{baseSlug}-{n}";
                slugsSeen.Add(slug);

                var cat = new Category
                {
                    Name = part,
                    Slug = slug,
                    ParentCategoryId = parentId,
                    ImportedFromSourceId = sourceId,
                };
                db.Categories.Add(cat);
                seen[key] = cat;
                parentId = cat.Id;
                leaf = cat;
            }
        }

        return leaf?.Id;
    }

    // ---

    private async Task<(int, int, int, Dictionary<string, int>)> ImportCategoriesAsync(
        List<Dictionary<string, string>> rows, Dictionary<string, string> fm, string conflict, CancellationToken ct, Guid? sourceId)
    {
        int ins = 0, upd = 0, skip = 0;
        var reasons = new Dictionary<string, int>();
        var seen = (await db.Categories.IgnoreQueryFilters().ToListAsync(ct))
            .GroupBy(c => c.Name.ToLower()).ToDictionary(g => g.Key, g => g.First());

        foreach (var row in rows)
        {
            var name = Map(row, fm, "Name");
            if (string.IsNullOrWhiteSpace(name)) { skip++; Bump(reasons, "İsim boş"); continue; }
            var slug = Map(row, fm, "Slug") ?? Slugify(name);
            var desc = Map(row, fm, "Description");

            if (seen.TryGetValue(name.ToLower(), out var cat))
            {
                // Idempotency: skip if nothing changed
                if (SameStr(cat.Description, desc))
                { skip++; Bump(reasons, "Zaten güncel (değişiklik yok)"); continue; }

                if (conflict == "update") { cat.Slug = slug; cat.Description = desc; upd++; }
                else { skip++; Bump(reasons, "Çakışma (mevcut kayıt atlandı)"); }
            }
            else
            {
                var entity = new Category { Name = name, Slug = slug, Description = desc, ImportedFromSourceId = sourceId };
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
        var seen = (await db.Brands.ToListAsync(ct))
            .GroupBy(b => b.Name.ToLower()).ToDictionary(g => g.Key, g => g.First());

        foreach (var row in rows)
        {
            var name = Map(row, fm, "Name");
            if (string.IsNullOrWhiteSpace(name)) { skip++; Bump(reasons, "İsim boş"); continue; }
            var desc = Map(row, fm, "Description");

            if (seen.TryGetValue(name.ToLower(), out var brand))
            {
                // Idempotency: skip if nothing changed
                if (SameStr(brand.Description, desc))
                { skip++; Bump(reasons, "Zaten güncel (değişiklik yok)"); continue; }

                if (conflict == "update") { brand.Description = desc ?? brand.Description; upd++; }
                else { skip++; Bump(reasons, "Çakışma (mevcut kayıt atlandı)"); }
            }
            else
            {
                var entity = new Brand { Name = name, Slug = Slugify(name), Description = desc, ImportedFromSourceId = sourceId };
                db.Brands.Add(entity);
                seen[name.ToLower()] = entity;
                ins++;
            }
        }
        await db.SaveChangesAsync(ct);
        db.ClearChangeTracker();
        return (ins, upd, skip, reasons);
    }

    private async Task<(int, int, int, int, Dictionary<string, int>)> ImportProductsAsync(
        List<Dictionary<string, string>> rows, Dictionary<string, string> fm, string conflict, CancellationToken ct, Guid? sourceId,
        HashSet<Guid>? touchedProductIds = null)
    {
        int ins = 0, upd = 0, skip = 0, rst = 0;
        var reasons = new Dictionary<string, int>();

        var batchSkus = rows
            .Select(r =>
            {
                var s = Map(r, fm, "SKU") ?? Map(r, fm, "Sku");
                if (string.IsNullOrWhiteSpace(s)) s = Map(r, fm, "FallbackSku");
                return s;
            })
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s!)
            .ToHashSet(StringComparer.OrdinalIgnoreCase); // CI: SQL Server unique index is case-insensitive

        // IgnoreQueryFilters: soft-deleted products must be included to avoid SKU/Slug unique index violations
        // OrdinalIgnoreCase: SQL Server CI collation means 'ABC' and 'abc' are the same SKU in the unique index
        var seenSku = new Dictionary<string, Product>(StringComparer.OrdinalIgnoreCase);
        if (batchSkus.Count > 0)
        {
            var dbProds = await db.Products
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(p => p.SKU != null && batchSkus.Contains(p.SKU))
                .ToListAsync(ct);
            foreach (var p in dbProds) seenSku.TryAdd(p.SKU!, p);
        }

        var seenSlug = await db.Products
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Select(p => p.Slug)
            .ToHashSetAsync(ct);

        // IgnoreQueryFilters: soft-deleted categories/brands must be visible to avoid slug duplicate errors
        var allCategoryList = await db.Categories.IgnoreQueryFilters().AsNoTracking().ToListAsync(ct);
        var categories = allCategoryList.GroupBy(c => c.Name.ToLower()).ToDictionary(g => g.Key, g => g.First());
        var categoryById = allCategoryList.ToDictionary(c => c.Id);
        var categorySlugs = allCategoryList.Select(c => c.Slug).ToHashSet();
        var brands = (await db.Brands.IgnoreQueryFilters().AsNoTracking().ToListAsync(ct))
            .GroupBy(b => b.Name.ToLower()).ToDictionary(g => g.Key, g => g.First());
        var brandSlugs = await db.Brands.IgnoreQueryFilters().AsNoTracking().Select(b => b.Slug).ToHashSetAsync(ct);
        var toReactivate = new HashSet<Guid>();
        var toReactivateBrands = new HashSet<Guid>();
        var seenProductIdsWithImage = new HashSet<Guid>(); // tracks products already staged with an image in this batch
        var addedProductEntities = new List<Product>();
        var addedImageEntities = new List<ProductImage>();

        foreach (var row in rows)
        {
            var name = Map(row, fm, "Name");
            var sku = Map(row, fm, "SKU") ?? Map(row, fm, "Sku");
            if (string.IsNullOrWhiteSpace(sku))
            {
                // FallbackSku: use external record id when supplier SKU is absent (prevents re-import duplicates)
                var fallback = Map(row, fm, "FallbackSku");
                if (!string.IsNullOrWhiteSpace(fallback)) sku = fallback;
            }
            if (string.IsNullOrWhiteSpace(sku)) sku = null;
            if (string.IsNullOrWhiteSpace(name)) { skip++; Bump(reasons, "İsim boş"); continue; }
            // Truncate to DB column limits
            if (name!.Length > 300) name = name[..300];
            if (sku != null && sku.Length > 100) sku = sku[..100];

            var priceStr = Map(row, fm, "Price") ?? Map(row, fm, "BasePrice");
            if (!decimal.TryParse(priceStr?.Replace(",", "."),
                System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var price))
            { skip++; Bump(reasons, "Fiyat geçersiz veya boş"); continue; }

            var catName = Map(row, fm, "Category");
            var brandName = Map(row, fm, "Brand");
            var desc = Map(row, fm, "Description") ?? string.Empty;
            var imageUrl = Map(row, fm, "ImageUrl");
            var oemPartNumber = Map(row, fm, "OemPartNumber");
            var chassis = Map(row, fm, "Chassis");
            // Auto-extract OEM ref from "BRAND REFCODE | Description" pattern
            if (string.IsNullOrWhiteSpace(oemPartNumber) && name!.Contains(" | "))
                oemPartNumber = name[..name.IndexOf(" | ", StringComparison.Ordinal)].Trim();
            if (oemPartNumber != null && oemPartNumber.Length > 200) oemPartNumber = oemPartNumber[..200];

            // Category: auto-resolve/create. Empty/unmapped → fall back to default "Genel" category.
            Guid? categoryId;
            string? vehicleModel = null;
            if (!string.IsNullOrWhiteSpace(catName))
            {
                categoryId = ResolveCategoryId(catName!, categories, categorySlugs, sourceId, toReactivate);
                vehicleModel = ExtractVehicleModelFromCategoryPath(catName!, categories, categoryById);
            }
            else
            {
                const string defaultCat = "Genel";
                if (!categories.TryGetValue(defaultCat.ToLower(), out var defCat))
                {
                    var defSlug = "genel";
                    for (int n = 2; categorySlugs.Contains(defSlug); n++) defSlug = $"genel-{n}";
                    categorySlugs.Add(defSlug);
                    defCat = new Category { Name = defaultCat, Slug = defSlug, ImportedFromSourceId = sourceId };
                    db.Categories.Add(defCat);
                    categories[defaultCat.ToLower()] = defCat;
                }
                else if (defCat.IsDeleted)
                {
                    toReactivate.Add(defCat.Id);
                }
                categoryId = defCat.Id;
            }

            // Brand: auto-resolve/create when name is given but not found.
            Guid? brandId = null;
            if (!string.IsNullOrWhiteSpace(brandName))
            {
                var bKey = brandName!.ToLower();
                if (brands.TryGetValue(bKey, out var br))
                {
                    if (br.IsDeleted) toReactivateBrands.Add(br.Id);
                    brandId = br.Id;
                }
                else
                {
                    var bSlug = Slugify(brandName!);
                    var bBase = bSlug;
                    for (int n = 2; brandSlugs.Contains(bSlug); n++) bSlug = $"{bBase}-{n}";
                    brandSlugs.Add(bSlug);
                    var newBrand = new Brand { Name = brandName!, Slug = bSlug, ImportedFromSourceId = sourceId };
                    db.Brands.Add(newBrand);
                    brands[bKey] = newBrand;
                    brandId = newBrand.Id;
                }
            }

            if (sku != null && seenSku.TryGetValue(sku, out var existing))
            {
                // Idempotency check: compare all mapped fields
                bool nameMatch  = SameStr(existing.Name, name);
                bool priceMatch = SameDecimal(existing.Price, price);
                bool descMatch  = SameStr(existing.Description, desc);
                bool catMatch   = !categoryId.HasValue || existing.CategoryId == categoryId.Value;
                bool brandMatch = brandId == existing.BrandId;

                if (nameMatch && priceMatch && descMatch && catMatch && brandMatch)
                {
                    if (existing.IsDeleted)
                    {
                        // Soft-deleted product has same data — just restore it
                        var restoredAttached = await db.Products.FindAsync([existing.Id], ct);
                        if (restoredAttached != null) { restoredAttached.IsDeleted = false; rst++; }
                    }
                    else
                    {
                        skip++; Bump(reasons, "Zaten güncel (değişiklik yok)");
                    }
                    touchedProductIds?.Add(existing.Id);
                    continue;
                }

                if (conflict == "update")
                {
                    var attached = await db.Products.FindAsync([existing.Id], ct);
                    if (attached != null)
                    {
                        attached.Name = name;
                        attached.Price = price;
                        attached.Description = desc;
                        attached.IsDeleted = false;
                        if (categoryId.HasValue) attached.CategoryId = categoryId.Value;
                        if (brandId.HasValue) attached.BrandId = brandId.Value;
                        if (!string.IsNullOrWhiteSpace(oemPartNumber)) attached.OemPartNumber = oemPartNumber;
                        if (!string.IsNullOrWhiteSpace(chassis)) attached.Chassis = chassis;
                        if (vehicleModel != null && attached.VehicleModel == null) attached.VehicleModel = vehicleModel;
                        touchedProductIds?.Add(attached.Id);

                        // Add main image if mapped and not already present (check both DB and change-tracker staged images)
                        if (!string.IsNullOrWhiteSpace(imageUrl) && !seenProductIdsWithImage.Contains(attached.Id))
                        {
                            bool hasImage = await db.ProductImages
                                .AnyAsync(pi => pi.ProductId == attached.Id && pi.IsMain, ct);
                            if (!hasImage)
                            {
                                db.ProductImages.Add(new ProductImage { ProductId = attached.Id, ImageUrl = imageUrl, IsMain = true, SortOrder = 0 });
                                seenProductIdsWithImage.Add(attached.Id);
                            }
                        }
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
                    Bump(reasons, catName == null ? "Kategori alanı eşlenmemiş" : "Kategori değeri boş");
                    continue;
                }

                var slug = Slugify(name);
                if (slug.Length > 300) slug = slug[..300];
                var baseSlug = slug;
                for (int n = 2; seenSlug.Contains(slug); n++) slug = $"{baseSlug}-{n}";
                seenSlug.Add(slug);

                var entity = new Product
                {
                    Name = name, Slug = slug, SKU = sku, Price = price,
                    CategoryId = categoryId.Value, BrandId = brandId,
                    Description = desc,
                    OemPartNumber = oemPartNumber,
                    Chassis = chassis,
                    VehicleModel = vehicleModel,
                    ImportedFromSourceId = sourceId,
                    IsActive = true,
                    IsPublished = true,
                };
                db.Products.Add(entity);
                addedProductEntities.Add(entity);
                if (!string.IsNullOrWhiteSpace(imageUrl))
                {
                    var img = new ProductImage { Product = entity, ImageUrl = imageUrl, IsMain = true, SortOrder = 0 };
                    db.ProductImages.Add(img);
                    addedImageEntities.Add(img);
                    seenProductIdsWithImage.Add(entity.Id);
                }
                touchedProductIds?.Add(entity.Id);
                if (sku != null) seenSku[sku] = entity;
                ins++;
            }
        }
        // Reactivate any soft-deleted categories/brands referenced by this batch
        if (toReactivate.Count > 0)
        {
            var softDeleted = await db.Categories
                .IgnoreQueryFilters()
                .Where(c => toReactivate.Contains(c.Id))
                .ToListAsync(ct);
            foreach (var c in softDeleted) c.IsDeleted = false;
        }
        if (toReactivateBrands.Count > 0)
        {
            var softDeletedBrands = await db.Brands
                .IgnoreQueryFilters()
                .Where(b => toReactivateBrands.Contains(b.Id))
                .ToListAsync(ct);
            foreach (var b in softDeletedBrands) b.IsDeleted = false;
        }

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException batchEx)
        {
            var inner = batchEx.InnerException?.Message ?? batchEx.Message;
            bool isDupKey = inner.Contains("duplicate key", StringComparison.OrdinalIgnoreCase)
                         || inner.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                         || inner.Contains("UNIQUE constraint", StringComparison.OrdinalIgnoreCase);
            if (!isDupKey)
                throw new InvalidOperationException($"DB save failed: {inner}", batchEx);

            // Duplicate key: retry entity-by-entity using locally-tracked lists (IApplicationDbContext has no ChangeTracker).
            db.ClearChangeTracker();

            // Re-save category/brand reactivations (safe — no unique constraint on these)
            if (toReactivate.Count > 0)
            {
                var cats = await db.Categories.IgnoreQueryFilters()
                    .Where(c => toReactivate.Contains(c.Id)).ToListAsync(ct);
                foreach (var c in cats) c.IsDeleted = false;
            }
            if (toReactivateBrands.Count > 0)
            {
                var brnds = await db.Brands.IgnoreQueryFilters()
                    .Where(b => toReactivateBrands.Contains(b.Id)).ToListAsync(ct);
                foreach (var b in brnds) b.IsDeleted = false;
            }
            if (toReactivate.Count > 0 || toReactivateBrands.Count > 0)
            { await db.SaveChangesAsync(ct); db.ClearChangeTracker(); }

            // Products: one-by-one to skip only the conflicting product
            foreach (var prod in addedProductEntities)
            {
                try
                {
                    db.Products.Add(prod);
                    foreach (var img in addedImageEntities.Where(i => i.ProductId == prod.Id || ReferenceEquals(i.Product, prod)))
                        db.ProductImages.Add(img);
                    await db.SaveChangesAsync(ct);
                    db.ClearChangeTracker();
                }
                catch (Microsoft.EntityFrameworkCore.DbUpdateException e2)
                    when ((e2.InnerException?.Message ?? e2.Message).Contains("duplicate key", StringComparison.OrdinalIgnoreCase)
                       || (e2.InnerException?.Message ?? e2.Message).Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                       || (e2.InnerException?.Message ?? e2.Message).Contains("UNIQUE constraint", StringComparison.OrdinalIgnoreCase))
                {
                    db.ClearChangeTracker();
                    ins = Math.Max(0, ins - 1);
                    skip++;
                    Bump(reasons, "SKU/Slug çakışması atlandı");
                }
            }
            return (ins, upd, skip, rst, reasons);
        }
        db.ClearChangeTracker();
        return (ins, upd, skip, rst, reasons);
    }

    private async Task<(int, int, int, Dictionary<string, int>)> ImportStocksAsync(
        List<Dictionary<string, string>> rows, Dictionary<string, string> fm, string conflict, CancellationToken ct)
    {
        int ins = 0, upd = 0, skip = 0;
        var reasons = new Dictionary<string, int>();

        var batchKeys = rows
            .Select(r => Map(r, fm, "SKU") ?? Map(r, fm, "Sku") ?? Map(r, fm, "ProductName") ?? "")
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToHashSet();

        var products = await db.Products
            .AsNoTracking()
            .Where(p => p.SKU != null && batchKeys.Contains(p.SKU))
            .ToDictionaryAsync(p => p.SKU!, ct);

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
                // Idempotency: skip if quantity unchanged
                if (stock.Quantity == qty)
                { skip++; Bump(reasons, "Zaten güncel (değişiklik yok)"); continue; }
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

    // Extracts VehicleModel from a category path such as "Mercedes-Benz > A Serisi W176".
    // Returns the leaf node when its parent category has ShowInVehicleNav=true.
    // E.g., "Opel > Astra F" → "Astra F"; "Fren Sistemi" → null (not a vehicle category).
    private static string? ExtractVehicleModelFromCategoryPath(
        string catName,
        Dictionary<string, Category> categoryByName,
        Dictionary<Guid, Category> categoryById)
    {
        if (string.IsNullOrWhiteSpace(catName)) return null;

        if (catName.Contains('>'))
        {
            var parts = catName.Split('>').Select(p => p.Trim()).Where(p => !string.IsNullOrEmpty(p)).ToArray();
            if (parts.Length < 2) return null;
            var parentName = parts[^2]; // second-to-last
            var leafName   = parts[^1]; // last
            if (categoryByName.TryGetValue(parentName.ToLower(), out var parentCat) && parentCat.ShowInVehicleNav)
                return leafName;
            return null;
        }

        // Single-name: find category, check its parent
        if (!categoryByName.TryGetValue(catName.ToLower(), out var cat)) return null;
        if (cat.ParentCategoryId.HasValue &&
            categoryById.TryGetValue(cat.ParentCategoryId.Value, out var parent) &&
            parent.ShowInVehicleNav)
            return cat.Name;
        return null;
    }
}
