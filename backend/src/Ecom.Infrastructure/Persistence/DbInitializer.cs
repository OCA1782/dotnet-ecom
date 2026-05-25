using ClosedXML.Excel;
using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using UserRoleEntity = Ecom.Domain.Entities.UserRole;
using UserRoleEnum = Ecom.Domain.Enums.UserRole;

namespace Ecom.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext db, IConfiguration config, string contentRootPath)
    {
        await db.Database.MigrateAsync();

        await SeedAdminUser(db, config);
        await SeedSiteSettings(db);
        await SeedTestExternalSources(db, contentRootPath);
    }

    private static async Task SeedAdminUser(ApplicationDbContext db, IConfiguration config)
    {
        var adminEmail = config["Seed:AdminEmail"] ?? "admin@ecom.com";

        var exists = await db.Users.IgnoreQueryFilters()
            .AnyAsync(u => u.Email == adminEmail);

        if (exists) return;

        var admin = new User
        {
            Name = "Super",
            Surname = "Admin",
            Email = adminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(config["Seed:AdminPassword"] ?? "REDACTED_ADMIN_PASSWORD"),
            IsActive = true,
            EmailConfirmed = true,
            KvkkConsent = true,
            KvkkConsentDate = DateTime.UtcNow
        };

        admin.Roles.Add(new UserRoleEntity { UserId = admin.Id, Role = UserRoleEnum.SuperAdmin });
        admin.Roles.Add(new UserRoleEntity { UserId = admin.Id, Role = UserRoleEnum.Admin });

        db.Users.Add(admin);
        await db.SaveChangesAsync();
    }

    private static async Task SeedSiteSettings(ApplicationDbContext db)
    {
        if (await db.SiteSettings.AnyAsync()) return;

        var settings = new List<SiteSetting>
        {
            new() { Key = "SiteName", Value = "Ecom Store", Group = "General" },
            new() { Key = "SiteUrl", Value = "http://localhost:3000", Group = "General" },
            new() { Key = "Currency", Value = "TRY", Group = "General" },
            new() { Key = "DefaultTaxRate", Value = "20", Group = "General" },
            new() { Key = "FreeShippingLimit", Value = "500", Group = "Shipping" },
            new() { Key = "DefaultShippingCost", Value = "29.90", Group = "Shipping" },
            new() { Key = "MaintenanceMode", Value = "false", Group = "System" }
        };

        db.SiteSettings.AddRange(settings);
        await db.SaveChangesAsync();
    }

    private static async Task SeedTestExternalSources(ApplicationDbContext db, string contentRootPath)
    {
        const string excelSourceName = "Test Excel Kaynağı";
        const string restSourceName = "Test REST Kaynağı (DummyJSON)";

        var uploadDir = Path.Combine(contentRootPath, "uploads", "external-sources");
        Directory.CreateDirectory(uploadDir);

        // Check if Excel source already exists — regenerate file if outdated
        var existingExcel = await db.ExternalSources.FirstOrDefaultAsync(s => s.Name == excelSourceName);
        if (existingExcel != null)
        {
            var path = Path.Combine(uploadDir, $"{existingExcel.Id}.xlsx");
            if (!File.Exists(path) || new FileInfo(path).Length < 50_000)
            {
                CreateTestExcel(path);
                existingExcel.LastExcelFilePath = path;
                existingExcel.LastFetchedCount = 20_000;
                await db.SaveChangesAsync();
            }
        }

        var alreadySeeded = await db.ExternalSources
            .AnyAsync(s => s.Name == excelSourceName || s.Name == restSourceName);

        if (alreadySeeded) return;

        // --- Excel source ---
        var excelSource = new ExternalSource
        {
            Name = excelSourceName,
            Type = "Excel",
            Description = "20.000 satır test verisi — ürün, kategori, marka",
            IsActive = true,
            FetchSchedule = "None",
        };
        db.ExternalSources.Add(excelSource);
        await db.SaveChangesAsync(); // get Id

        var excelPath = Path.Combine(uploadDir, $"{excelSource.Id}.xlsx");
        CreateTestExcel(excelPath);

        excelSource.LastExcelFilePath = excelPath;
        excelSource.LastFetchedCount = 20_000;
        await db.SaveChangesAsync();

        // --- REST API source ---
        var restConfig = JsonSerializer.Serialize(new
        {
            url = "https://dummyjson.com/products?limit=30",
            dataPath = "products",
        });

        var restSource = new ExternalSource
        {
            Name = restSourceName,
            Type = "RestApi",
            Description = "DummyJSON'dan 30 örnek ürün çeker (Product aktarımı için)",
            IsActive = true,
            FetchSchedule = "None",
            Config = restConfig,
        };
        db.ExternalSources.Add(restSource);
        await db.SaveChangesAsync();
    }

    private static void CreateTestExcel(string filePath)
    {
        using var wb = new XLWorkbook();

        string[] catNames  = ["Elektronik", "Giyim", "Ev & Yaşam", "Spor", "Kitap"];
        string[] catSlugs  = ["test-elektronik", "test-giyim", "test-ev-yasam", "test-spor", "test-kitap"];
        string[] catDescs  = ["Elektronik ürünler", "Giyim ve moda", "Ev dekorasyon", "Spor ve outdoor", "Kitap ve yayınlar"];
        string[] brandNames = ["Samsung", "Apple", "Nike", "Adidas", "IKEA"];
        string[] brandDescs = ["Elektronik markası", "Teknoloji markası", "Spor giyim markası", "Alman spor markası", "Mobilya markası"];

        // --- Categories sheet ---
        var catSheet = wb.AddWorksheet("Kategoriler");
        catSheet.Cell(1, 1).Value = "Name";
        catSheet.Cell(1, 2).Value = "Slug";
        catSheet.Cell(1, 3).Value = "Description";
        for (int i = 0; i < catNames.Length; i++)
        {
            catSheet.Cell(i + 2, 1).Value = catNames[i];
            catSheet.Cell(i + 2, 2).Value = catSlugs[i];
            catSheet.Cell(i + 2, 3).Value = catDescs[i];
        }

        // --- Brands sheet ---
        var brandSheet = wb.AddWorksheet("Markalar");
        brandSheet.Cell(1, 1).Value = "Name";
        brandSheet.Cell(1, 2).Value = "Description";
        for (int i = 0; i < brandNames.Length; i++)
        {
            brandSheet.Cell(i + 2, 1).Value = brandNames[i];
            brandSheet.Cell(i + 2, 2).Value = brandDescs[i];
        }

        // --- Products sheet: 20 000 rows ---
        var prodSheet = wb.AddWorksheet("Urunler");
        prodSheet.Cell(1, 1).Value = "Name";
        prodSheet.Cell(1, 2).Value = "SKU";
        prodSheet.Cell(1, 3).Value = "Price";
        prodSheet.Cell(1, 4).Value = "Category";
        prodSheet.Cell(1, 5).Value = "Brand";
        prodSheet.Cell(1, 6).Value = "Description";

        var rng = new Random(42);
        const int productCount = 20_000;
        for (int i = 1; i <= productCount; i++)
        {
            int catIdx   = (i - 1) % catNames.Length;
            int brandIdx = (i - 1) % brandNames.Length;
            decimal price = Math.Round(rng.Next(99, 50000) + (decimal)rng.NextDouble(), 2);
            prodSheet.Cell(i + 1, 1).Value = $"Test Ürün {i:D5}";
            prodSheet.Cell(i + 1, 2).Value = $"TST-{i:D5}";
            prodSheet.Cell(i + 1, 3).Value = price.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);
            prodSheet.Cell(i + 1, 4).Value = catNames[catIdx];
            prodSheet.Cell(i + 1, 5).Value = brandNames[brandIdx];
            prodSheet.Cell(i + 1, 6).Value = $"Test ürün açıklaması — {catNames[catIdx]} / {brandNames[brandIdx]}";
        }

        wb.SaveAs(filePath);
    }
}
