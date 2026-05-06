using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UserRoleEntity = Ecom.Domain.Entities.UserRole;
using UserRoleEnum = Ecom.Domain.Enums.UserRole;

namespace Ecom.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext db, IConfiguration config)
    {
        await db.Database.MigrateAsync();

        await SeedAdminUser(db, config);
        await SeedSiteSettings(db);
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
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(config["Seed:AdminPassword"] ?? "Admin1234!"),
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
}
