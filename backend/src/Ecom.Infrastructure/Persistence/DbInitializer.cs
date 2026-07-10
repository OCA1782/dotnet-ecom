using ClosedXML.Excel;
using Ecom.Domain.Entities;
using Ecom.Infrastructure.Security;
using Ecom.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using UserRoleEntity = Ecom.Domain.Entities.UserRole;
using UserRoleEnum = Ecom.Domain.Enums.UserRole;

namespace Ecom.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext db, IConfiguration config, string contentRootPath)
    {
        var provider = db.Database.ProviderName ?? "";
        if (provider.Contains("Npgsql"))
        {
            // EnsureCreated connects to the maintenance 'postgres' DB first (to check if EcomDb exists),
            // but our Docker user may not have access to 'postgres'. Instead, use RelationalDatabaseCreator
            // directly to create tables in the already-existing database without the DB-existence check.
            var creator = db.GetService<IRelationalDatabaseCreator>();
            if (!await creator.HasTablesAsync())
                await creator.CreateTablesAsync();
        }
        else
            await db.Database.MigrateAsync();

        await SeedAdminUser(db, config);
        await SeedSiteSettings(db);
        await EnsureAlertSettings(db);
        await SeedRevealPassword(db, config);
        await SeedTestExternalSources(db, contentRootPath);
        await SeedMailTemplates(db);
    }

    private static async Task EnsureAlertSettings(ApplicationDbContext db)
    {
        var keys = new[] { "Alert:Enabled", "Alert:Emails" };
        var existing = await db.SiteSettings
            .Where(s => keys.Contains(s.Key))
            .Select(s => s.Key)
            .ToListAsync();

        var toAdd = new List<SiteSetting>();
        if (!existing.Contains("Alert:Enabled"))
            toAdd.Add(new SiteSetting { Key = "Alert:Enabled", Value = "false", Group = "Alert" });
        if (!existing.Contains("Alert:Emails"))
            toAdd.Add(new SiteSetting { Key = "Alert:Emails", Value = "", Group = "Alert" });

        if (toAdd.Count > 0)
        {
            db.SiteSettings.AddRange(toAdd);
            await db.SaveChangesAsync();
        }
    }

    private static async Task SeedRevealPassword(ApplicationDbContext db, IConfiguration config)
    {
        var alreadySeeded = await db.SiteSettings.AnyAsync(s => s.Key == "RevealPasswordHash");
        if (alreadySeeded) return;

        var revealPw = config["DevRevealPassword"] ?? "";
        if (string.IsNullOrWhiteSpace(revealPw)) return;

        db.SiteSettings.Add(new SiteSetting
        {
            Key   = "RevealPasswordHash",
            Value = CryptoHelper.Hash(revealPw),
            Group = "Security"
        });
        await db.SaveChangesAsync();
    }

    private static async Task SeedAdminUser(ApplicationDbContext db, IConfiguration config)
    {
        var adminEmail = config["Seed:AdminEmail"] ?? "admin@ecom.com";

        var existingUsers = await db.Users
            .IgnoreQueryFilters()
            .Include(u => u.Roles)
            .Where(u => u.Email == adminEmail)
            .ToListAsync();

        if (existingUsers.Count > 0)
        {
            var changed = false;
            foreach (var existing in existingUsers)
            {
                var roleNames = existing.Roles.Select(r => r.Role).ToHashSet();

                if (roleNames.Contains(UserRoleEnum.Admin))
                {
                    var adminRoles = existing.Roles.Where(r => r.Role == UserRoleEnum.Admin).ToList();
                    db.UserRoles.RemoveRange(adminRoles);
                    changed = true;
                }

                if (!roleNames.Contains(UserRoleEnum.SuperAdmin))
                {
                    db.UserRoles.Add(new UserRoleEntity { UserId = existing.Id, Role = UserRoleEnum.SuperAdmin });
                    changed = true;
                }

                if (!existing.IsActive)
                {
                    existing.IsActive = true;
                    changed = true;
                }

                if (!existing.EmailConfirmed)
                {
                    existing.EmailConfirmed = true;
                    changed = true;
                }

                if (!existing.KvkkConsent)
                {
                    existing.KvkkConsent = true;
                    existing.KvkkConsentDate = DateTime.UtcNow;
                    changed = true;
                }

                if (existing.TwoFactorEnabled)
                {
                    existing.TwoFactorEnabled = false;
                    existing.TwoFactorSecret = null;
                    changed = true;
                }
            }

            if (changed)
                await db.SaveChangesAsync();

            return;
        }

        // Admin henüz yok — ilk kurulumda password zorunlu
        var adminPassword = config["Seed:AdminPassword"];
        if (string.IsNullOrWhiteSpace(adminPassword))
            throw new InvalidOperationException(
                "Seed:AdminPassword yapılandırması eksik. appsettings.Development.json'a veya ortam değişkenine Seed__AdminPassword ekleyin.");

        var admin = new User
        {
            Name = "Super",
            Surname = "Admin",
            Email = adminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            IsActive = true,
            EmailConfirmed = true,
            KvkkConsent = true,
            KvkkConsentDate = DateTime.UtcNow
        };

        admin.Roles.Add(new UserRoleEntity { UserId = admin.Id, Role = UserRoleEnum.SuperAdmin });

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
            new() { Key = "MaintenanceMode", Value = "false", Group = "System" },
            new() { Key = "I18nJob:EnableAutoRun", Value = "false", Group = "Jobs" },
            new() { Key = "I18nJob:AllowSourceMutation", Value = "false", Group = "Jobs" },
            new() { Key = "I18nJob:AllowDocsWrite", Value = "false", Group = "Jobs" },
            new() { Key = "I18nJob:TriggerBuilderFromScanner", Value = "false", Group = "Jobs" },
            new() { Key = "I18nJob:ProjectRoot", Value = "", Group = "Jobs" },
            new() { Key = "I18nJob:DocsPath", Value = "", Group = "Jobs" },
            new() { Key = "I18nJob:ScheduleTimeZone", Value = "Turkey Standard Time", Group = "Jobs" },
            new() { Key = "I18nJob:DictionaryBuilderWindowStart", Value = "01:00:00", Group = "Jobs" },
            new() { Key = "I18nJob:DictionaryBuilderWindowEnd", Value = "07:00:00", Group = "Jobs" },
            new() { Key = "CustomerI18nJob:EnableAutoRun", Value = "false", Group = "Jobs" },
            new() { Key = "CustomerI18nJob:AllowSourceMutation", Value = "false", Group = "Jobs" },
            new() { Key = "CustomerI18nJob:AllowDocsWrite", Value = "false", Group = "Jobs" },
            new() { Key = "CustomerI18nJob:TriggerBuilderFromScanner", Value = "false", Group = "Jobs" },
            new() { Key = "CustomerI18nJob:ProjectRoot", Value = "", Group = "Jobs" },
            new() { Key = "CustomerI18nJob:DocsPath", Value = "", Group = "Jobs" },
            new() { Key = "CustomerI18nJob:ScheduleTimeZone", Value = "Turkey Standard Time", Group = "Jobs" },
            new() { Key = "CustomerI18nJob:DictionaryBuilderWindowStart", Value = "01:00:00", Group = "Jobs" },
            new() { Key = "CustomerI18nJob:DictionaryBuilderWindowEnd", Value = "07:00:00", Group = "Jobs" },
            new() { Key = "VerificationJob:ApiBaseUrl", Value = "http://localhost:5124", Group = "Jobs" },
            new() { Key = "VerificationJob:ProjectRoot", Value = "", Group = "Jobs" },
            new() { Key = "VerificationJob:LogFilePath", Value = "", Group = "Jobs" },
            new() { Key = "AdminLintAudit:TodoPath", Value = "TODO_PENDING.md", Group = "Jobs" }
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

    private static async Task SeedMailTemplates(ApplicationDbContext db)
    {
        var definitions = GetMailTemplateDefinitions();
        var existing = await db.MailTemplates.Select(t => t.Name).ToHashSetAsync();

        var toAdd = definitions.Where(d => !existing.Contains(d.Name)).ToList();
        if (toAdd.Count == 0) return;

        db.MailTemplates.AddRange(toAdd);
        await db.SaveChangesAsync();
    }

    public static List<MailTemplate> GetMailTemplateDefinitions() =>
    [
        new()
        {
            Name = "OrderConfirmation",
            DisplayName = "Sipariş Onayı",
            Source = "Outbox Consumer",
            SourceDetail = "OrderCreatedConsumer",
            Trigger = "Sipariş oluşturunca otomatik",
            TriggerPath = "Outbox: OrderCreated event → OrderCreatedConsumer",
            Subject = "Siparişiniz Alındı — {{orderNumber}}",
            DefaultBodyHtml = EmailTemplates.OrderConfirmation("{{name}}", "{{orderNumber}}", "{{grandTotal}}"),
            Variables = """["name","orderNumber","grandTotal"]""",
            SampleVariables = """{"name":"Ahmet Yılmaz","orderNumber":"ORD-2026-0001","grandTotal":"₺1.250,00"}""",
        },
        new()
        {
            Name = "PaymentSuccess",
            DisplayName = "Ödeme Onayı",
            Source = "Outbox Consumer",
            SourceDetail = "PaymentCompletedConsumer",
            Trigger = "Ödeme tamamlanınca otomatik",
            TriggerPath = "Outbox: PaymentCompleted event → PaymentCompletedConsumer",
            Subject = "Ödemeniz Onaylandı — {{orderNumber}}",
            DefaultBodyHtml = EmailTemplates.PaymentSuccess("{{name}}", "{{orderNumber}}", "{{grandTotal}}"),
            Variables = """["name","orderNumber","grandTotal"]""",
            SampleVariables = """{"name":"Ahmet Yılmaz","orderNumber":"ORD-2026-0001","grandTotal":"₺1.250,00"}""",
        },
        new()
        {
            Name = "ShippingNotification",
            DisplayName = "Kargo Bildirimi",
            Source = "Command Handler",
            SourceDetail = "CreateShipmentCommand",
            Trigger = "Admin kargo kaydı oluşturduğunda",
            TriggerPath = "POST /api/admin/shipments",
            Subject = "Siparişiniz Kargoya Verildi — {{orderNumber}}",
            DefaultBodyHtml = EmailTemplates.ShippingNotification("{{name}}", "{{orderNumber}}", "{{cargoCompany}}", "{{trackingNumber}}", "{{trackingUrl}}"),
            Variables = """["name","orderNumber","cargoCompany","trackingNumber","trackingUrl"]""",
            SampleVariables = """{"name":"Ahmet Yılmaz","orderNumber":"ORD-2026-0001","cargoCompany":"Yurtiçi Kargo","trackingNumber":"TRK123456","trackingUrl":"https://yurticikargo.com/sorgula/TRK123456"}""",
        },
        new()
        {
            Name = "EmailVerification",
            DisplayName = "E-posta Doğrulama",
            Source = "Command Handler",
            SourceDetail = "RegisterCommand",
            Trigger = "Yeni kullanıcı kaydında",
            TriggerPath = "POST /api/auth/register",
            Subject = "E-posta Doğrulama — Ecom",
            DefaultBodyHtml = EmailTemplates.EmailVerification("{{name}}", "{{code}}"),
            Variables = """["name","code"]""",
            SampleVariables = """{"name":"Ahmet Yılmaz","code":"847291"}""",
        },
        new()
        {
            Name = "VerificationReminder",
            DisplayName = "Doğrulama Hatırlatıcı",
            Source = "Command Handler + Job",
            SourceDetail = "ResendVerificationCommand, VerificationReminderJob",
            Trigger = "Kullanıcı talep edince / 12 saatte bir otomatik (doğrulanmamış hesaplara)",
            TriggerPath = "POST /api/auth/resend-verification  |  Job: her 720 dk",
            Subject = "Hesabınızı Doğrulayın — Ecom",
            DefaultBodyHtml = EmailTemplates.VerificationReminder("{{name}}", "{{code}}"),
            Variables = """["name","code"]""",
            SampleVariables = """{"name":"Ahmet Yılmaz","code":"847291"}""",
        },
        new()
        {
            Name = "PasswordReset",
            DisplayName = "Şifre Sıfırlama",
            Source = "Command Handler",
            SourceDetail = "ForgotPasswordCommand",
            Trigger = "Kullanıcı 'Şifremi Unuttum' talep ettiğinde",
            TriggerPath = "POST /api/auth/forgot-password",
            Subject = "Şifre Sıfırlama — Ecom",
            DefaultBodyHtml = EmailTemplates.PasswordReset("{{name}}", "{{resetUrl}}"),
            Variables = """["name","resetUrl"]""",
            SampleVariables = """{"name":"Ahmet Yılmaz","resetUrl":"http://localhost:3000/sifre-sifirla?token=abc123&email=ahmet@ornek.com"}""",
        },
        new()
        {
            Name = "PasswordReminder",
            DisplayName = "Şifre Güncelleme Hatırlatıcı",
            Source = "Job",
            SourceDetail = "PasswordReminderJob",
            Trigger = "Her 24 saatte otomatik — 60+ gün şifre değiştirmeyenlere",
            TriggerPath = "Job: her 1440 dk",
            Subject = "Şifrenizi Güncelleme Zamanı — Ecom",
            DefaultBodyHtml = EmailTemplates.PasswordReminder("{{name}}", 73),
            Variables = """["name","daysSinceLastChange"]""",
            SampleVariables = """{"name":"Ahmet Yılmaz","daysSinceLastChange":"73"}""",
        },
        new()
        {
            Name = "LowStockAlertBatch",
            DisplayName = "Kritik Stok Uyarısı",
            Source = "Job",
            SourceDetail = "StockAlertJob",
            Trigger = "Her 5 dakikada otomatik — kritik stok altı ürünler varsa",
            TriggerPath = "Job: her 5 dk",
            Subject = "⚠ Kritik Stok Uyarısı — {{count}} ürün",
            DefaultBodyHtml = EmailTemplates.LowStockAlertBatch([
                ("Xiaomi Redmi Note 13", 2, 5),
                ("Samsung Galaxy Buds 2", 0, 3),
                ("Logitech MX Master 3", 1, 5),
            ]),
            Variables = """["count"]""",
            SampleVariables = """{"count":"3"}""",
            IsBodyEditable = false,
        },
        new()
        {
            Name = "ReviewRejection",
            DisplayName = "Yorum Reddi",
            Source = "Command Handler",
            SourceDetail = "ApproveReviewCommand (isApproved=false)",
            Trigger = "Admin yorumu reddettiğinde",
            TriggerPath = "PUT /api/admin/reviews/{id}/approve  (isApproved: false)",
            Subject = "Yorumunuz Hakkında Bilgi — {{productName}}",
            DefaultBodyHtml = EmailTemplates.ReviewRejection("{{toName}}", "{{productName}}", "Yorum içerik politikamızla uyuşmuyor."),
            Variables = """["toName","productName","note"]""",
            SampleVariables = """{"toName":"Ahmet Yılmaz","productName":"Xiaomi Redmi Note 13","note":"Yorum içerik politikamızla uyuşmuyor."}""",
        },
        new()
        {
            Name = "ContactForm",
            DisplayName = "İletişim Formu",
            Source = "Public API",
            SourceDetail = "ContactController",
            Trigger = "Müşteri iletişim formunu gönderdiğinde",
            TriggerPath = "POST /api/contact",
            Subject = "İletişim Formu — {{fromName}}",
            DefaultBodyHtml = EmailTemplates.ContactForm("{{fromName}}", "{{fromEmail}}", "{{message}}"),
            Variables = """["fromName","fromEmail","message"]""",
            SampleVariables = """{"fromName":"Ayşe Kaya","fromEmail":"ayse@ornek.com","message":"Siparişim hakkında bilgi almak istiyorum."}""",
        },
        new()
        {
            Name = "LicenseAssignment",
            DisplayName = "Lisans Ataması",
            Source = "EcomLicence Servis",
            SourceDetail = "LicenseAssignmentsController (dotnet-ecom-licence repo)",
            Trigger = "Admin lisans atadığında / yenilediğinde",
            TriggerPath = "Harici servis: dotnet-ecom-licence  →  /api/license/assignments",
            Subject = "Ecom Platform Lisansınız Hazır",
            DefaultBodyHtml = EmailTemplates.LicenseAssignment("{{name}}", "eyJhbGci...token", "ViewPass123", "{{issuer}}", "{{expiresAt}}"),
            Variables = """["name","licenseToken","viewPassword","issuer","expiresAt"]""",
            SampleVariables = """{"name":"Ahmet Yılmaz","licenseToken":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...","viewPassword":"ViewPass123","issuer":"EcomLicence","expiresAt":"2027-06-13"}""",
        },
        new()
        {
            Name = "TestEmail",
            DisplayName = "SMTP Test Maili",
            Source = "Admin API",
            SourceDetail = "EmailController",
            Trigger = "Admin SMTP bağlantısını test ettiğinde",
            TriggerPath = "POST /api/admin/email/test",
            Subject = "SMTP Test — Ecom",
            DefaultBodyHtml = EmailTemplates.TestEmail(),
            Variables = "[]",
            SampleVariables = "{}",
        },
        new()
        {
            Name = "Alert",
            DisplayName = "Sistem Uyarısı",
            Source = "Job + Admin API",
            SourceDetail = "ModuleHealthCheckJob, SettingsController",
            Trigger = "Her 60 dakikada otomatik (sağlık sorunu) / Admin test uyarısı",
            TriggerPath = "Job: her 60 dk  |  POST /api/admin/settings/test-alert",
            Subject = "(Dinamik — sağlık sorununun açıklaması)",
            DefaultBodyHtml = EmailTemplates.AlertSample(),
            Variables = """["subject","htmlBody"]""",
            SampleVariables = """{"subject":"Sistem Uyarısı: API sürümü beklenenden eski","htmlBody":"<p>Lütfen kontrol edin.</p>"}""",
            IsBodyEditable = false,
        },
        new()
        {
            Name = "LowStockAlert",
            DisplayName = "Kritik Stok Uyarısı (Tekli)",
            Source = "Job",
            SourceDetail = "StockAlertJob (tekil gönderim — eski versiyon, batch tercih edilir)",
            Trigger = "Her 5 dakikada otomatik — tek ürün kritik stok altındaysa",
            TriggerPath = "Job: her 5 dk",
            Subject = "⚠ Kritik Stok Uyarısı: {{productName}}",
            DefaultBodyHtml = EmailTemplates.LowStockAlert("{{productName}}", 2, 5),
            Variables = """["productName","availableStock","criticalLevel"]""",
            SampleVariables = """{"productName":"Xiaomi Redmi Note 13","availableStock":"2","criticalLevel":"5"}""",
        },
    ];
}
