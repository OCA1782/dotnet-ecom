using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Ecom.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/seed")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SeedController(IApplicationDbContext db, IPasswordService passwordService) : ControllerBase
{
    private static readonly Random _rng = new();

    // ── Turkish faker data ────────────────────────────────────────────────

    private static readonly string[] _categoryNames =
    [
        "Elektronik", "Giyim", "Ayakkabı", "Ev & Yaşam", "Spor & Outdoor",
        "Oyuncak & Hobi", "Kitap & Kültür", "Kozmetik & Bakım", "Gıda & İçecek",
        "Araç Gereç", "Bilgisayar & Tablet", "Telefon & Aksesuar",
        "TV & Ses Sistemi", "Beyaz Eşya", "Küçük Ev Aletleri",
        "Çanta & Bavul", "Takı & Mücevher", "Saat", "Bebek & Çocuk",
        "Pet Shop", "Ofis & Kırtasiye", "Müzik Aleti", "Bahçe & Yapı Market",
        "Oto Aksesuar", "Sağlık & Eczane",
    ];

    private static readonly string[] _brandNames =
    [
        "Arçelik", "Vestel", "Beko", "Casper", "Fakir", "Tefal", "Philips",
        "Sony", "Samsung", "Apple", "Xiaomi", "Oppo", "Huawei", "Lenovo",
        "HP", "Dell", "LG", "Bosch", "Siemens", "Moulinex", "Arzum",
        "Profilo", "Regal", "Adidas", "Nike", "Puma", "Reebok", "New Balance",
        "Lacoste", "Tommy Hilfiger", "Mavi", "Koton", "LC Waikiki",
        "Sephora", "Flormar", "Golden Rose", "Dyson", "Karcher", "Makita",
    ];

    private static readonly string[] _adjectives =
        ["Ultra", "Pro", "Max", "Elite", "Smart", "Nano", "Eco", "Premium", "Advanced", "Slim"];

    private static readonly string[] _productNouns =
        ["Monitör", "Laptop", "Telefon", "Tablet", "Kulaklık", "Klavye", "Mouse",
         "Çanta", "Ayakkabı", "Tişört", "Kot Pantolon", "Elbise", "Eşofman",
         "Ceket", "Kazan", "Kıyafet Seti", "Cihaz", "Kit", "Paket", "Koleksiyon"];

    private static readonly string[] _maleNames =
        ["Ahmet", "Mehmet", "Ali", "Mustafa", "Can", "Emre", "Burak", "Serkan",
         "Hakan", "Tolga", "Mert", "Okan", "Cem", "Barış", "Kemal", "Selim", "Umut", "Onur"];

    private static readonly string[] _femaleNames =
        ["Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Selin", "Esra", "Büşra",
         "Neslihan", "Pınar", "Dilek", "Deniz", "Sena", "Tuğçe", "Hazal", "Ceren", "Aslı"];

    private static readonly string[] _surnames =
        ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Öztürk", "Aydın",
         "Koç", "Güneş", "Arslan", "Doğan", "Kılıç", "Çetin", "Polat", "Kurt",
         "Özkan", "Güler", "Aktaş", "Erdoğan", "Karahan", "Şimşek", "Bulut", "Tuncer"];

    private static readonly string[] _reviewBodies =
    [
        "Ürün beklentilerimi karşıladı, gayet memnunum.",
        "Fiyatına göre gerçekten kaliteli bir ürün.",
        "Hızlı kargo, sağlam paket. Teşekkürler.",
        "Kullanımı kolay, tasarımı şık. Tavsiye ederim.",
        "İkinci kez alıyorum, her seferinde memnun oldum.",
        "Görüntüler ve gerçek ürün birebir aynı. Güvenilir.",
        "Dayanıklı malzeme, uzun süre kullanılabilir.",
        "Hediye olarak aldım, çok beğenildi.",
        "Beklediğimden daha iyi çıktı, harika bir alışveriş.",
        "Kargo biraz gecikti ama ürün kusursuz geldi.",
        "Kalite iyi sayılır ancak fiyat biraz yüksek.",
        "Orta kalite, fiyatıyla orantılı.",
    ];

    private static string Slugify(string text)
    {
        var s = text.ToLowerInvariant()
            .Replace("ç", "c").Replace("ğ", "g").Replace("ı", "i")
            .Replace("İ", "i").Replace("ö", "o").Replace("ş", "s").Replace("ü", "u");
        s = Regex.Replace(s, @"[^a-z0-9\s-]", "");
        s = Regex.Replace(s, @"\s+", "-");
        return s.Trim('-');
    }

    private static T Pick<T>(T[] arr) => arr[_rng.Next(arr.Length)];

    // ── Bulk seed endpoint ────────────────────────────────────────────────

    public record BulkSeedRequest(string Entity, int Count);

    [HttpPost("bulk")]
    public async Task<IActionResult> SeedBulk([FromBody] BulkSeedRequest request, CancellationToken ct)
    {
        var count = Math.Clamp(request.Count, 1, 500);
        var entity = request.Entity.ToLowerInvariant();
        var created = new List<object>();
        var now = DateTime.UtcNow;

        switch (entity)
        {
            case "category":
            {
                var existing = await db.Categories.Select(c => c.Slug).ToHashSetAsync(ct);
                for (int i = 0; i < count; i++)
                {
                    var name = $"{Pick(_categoryNames)} {_rng.Next(1000, 9999)}";
                    var slug = Slugify(name);
                    if (existing.Contains(slug)) slug += $"-{_rng.Next(100, 999)}";
                    existing.Add(slug);
                    var cat = new Category { Name = name, Slug = slug, IsActive = true, ShowInMenu = true };
                    db.Categories.Add(cat);
                    created.Add(new { cat.Id, cat.Name, cat.Slug });
                }
                break;
            }

            case "brand":
            {
                var existing = await db.Brands.Select(b => b.Slug).ToHashSetAsync(ct);
                for (int i = 0; i < count; i++)
                {
                    var name = $"{Pick(_brandNames)} {_rng.Next(1000, 9999)}";
                    var slug = Slugify(name);
                    if (existing.Contains(slug)) slug += $"-{_rng.Next(100, 999)}";
                    existing.Add(slug);
                    var brand = new Brand { Name = name, Slug = slug, IsActive = true };
                    db.Brands.Add(brand);
                    created.Add(new { brand.Id, brand.Name, brand.Slug });
                }
                break;
            }

            case "product":
            {
                var categories = await db.Categories.Where(c => c.IsActive).Select(c => c.Id).ToListAsync(ct);
                var brands = await db.Brands.Where(b => b.IsActive).Select(b => b.Id).ToListAsync(ct);
                if (categories.Count == 0)
                    return BadRequest(new { error = "Önce en az 1 kategori oluşturun." });

                var existingSlugs = await db.Products.Select(p => p.Slug).ToHashSetAsync(ct);

                for (int i = 0; i < count; i++)
                {
                    var name = $"{Pick(_adjectives)} {Pick(_productNouns)} {_rng.Next(1000, 9999)}";
                    var slug = Slugify(name);
                    if (existingSlugs.Contains(slug)) slug += $"-{_rng.Next(100, 999)}";
                    existingSlugs.Add(slug);

                    var price = Math.Round((decimal)(_rng.NextDouble() * 4900 + 100), 2);
                    var hasDiscount = _rng.Next(3) == 0;

                    var product = new Product
                    {
                        Name = name,
                        Slug = slug,
                        SKU = $"TST-{_rng.Next(100000, 999999)}",
                        CategoryId = categories[_rng.Next(categories.Count)],
                        BrandId = brands.Count > 0 ? brands[_rng.Next(brands.Count)] : null,
                        Price = price,
                        DiscountPrice = hasDiscount ? Math.Round(price * (decimal)(_rng.NextDouble() * 0.3 + 0.5), 2) : null,
                        TaxRate = Pick(new[] { 1m, 8m, 18m, 20m }),
                        IsActive = true,
                        IsPublished = true,
                        IsFeatured = _rng.Next(5) == 0,
                        Description = $"Bu ürün test amaçlı oluşturulmuştur. {name} detaylı açıklaması.",
                        ShortDescription = $"{name} — test ürünü.",
                    };
                    db.Products.Add(product);

                    var stock = new Stock
                    {
                        ProductId = product.Id,
                        Quantity = _rng.Next(0, 201),
                        CriticalStockLevel = _rng.Next(3, 11),
                    };
                    db.Stocks.Add(stock);

                    created.Add(new { product.Id, product.Name, product.SKU, product.Price });
                }
                break;
            }

            case "user":
            {
                for (int i = 0; i < count; i++)
                {
                    var isMale = _rng.Next(2) == 0;
                    var firstName = Pick(isMale ? _maleNames : _femaleNames);
                    var lastName = Pick(_surnames);
                    var email = $"{Slugify(firstName)}.{Slugify(lastName)}{_rng.Next(1000, 9999)}@testmail.com";

                    if (await db.Users.AnyAsync(u => u.Email == email, ct))
                        email = $"{Slugify(firstName)}.{Slugify(lastName)}{_rng.Next(10000, 99999)}@testmail.com";

                    var user = new User
                    {
                        Name = firstName,
                        Surname = lastName,
                        Email = email,
                        PasswordHash = passwordService.Hash("Test1234!"),
                        IsActive = true,
                        EmailConfirmed = true,
                        KvkkConsent = true,
                        KvkkConsentDate = now,
                        PhoneNumber = $"05{_rng.Next(10, 60):D2}{_rng.Next(1000000, 9999999)}",
                    };
                    user.Roles.Add(new Ecom.Domain.Entities.UserRole { UserId = user.Id, Role = Ecom.Domain.Enums.UserRole.Customer });
                    db.Users.Add(user);
                    created.Add(new { user.Id, user.Name, user.Surname, user.Email });
                }
                break;
            }

            case "order":
            {
                var products = await db.Products.Where(p => p.IsActive).Select(p => new { p.Id, p.Name, p.Price, p.TaxRate }).ToListAsync(ct);
                var users = await db.Users.Where(u => u.IsActive).Select(u => u.Id).ToListAsync(ct);
                if (products.Count == 0) return BadRequest(new { error = "Önce en az 1 ürün oluşturun." });
                if (users.Count == 0) return BadRequest(new { error = "Önce en az 1 kullanıcı oluşturun." });

                var statuses = new[] { OrderStatus.PaymentCompleted, OrderStatus.Preparing, OrderStatus.Shipped, OrderStatus.Delivered, OrderStatus.Completed };
                var addr = """{"addressTitle":"Test Adres","firstName":"Test","lastName":"Kullanıcı","phoneNumber":"05321234567","country":"TR","city":"İstanbul","district":"Kadıköy","neighborhood":"Moda","fullAddress":"Test Sokak No:1","postalCode":"34710"}""";

                for (int i = 0; i < count; i++)
                {
                    var status = Pick(statuses);
                    var product = products[_rng.Next(products.Count)];
                    var qty = _rng.Next(1, 6);
                    var taxAmt = Math.Round(product.Price * qty * (product.TaxRate / 100m), 2);
                    var lineTotal = product.Price * qty;

                    var sequence = await db.Orders.CountAsync(ct) + i + 1;
                    var order = new Order
                    {
                        OrderNumber = $"TST-{now:yyyyMMdd}-{sequence:D6}",
                        UserId = users[_rng.Next(users.Count)],
                        Status = status,
                        PaymentStatus = PaymentStatus.Paid,
                        ShipmentStatus = status >= OrderStatus.Shipped ? ShipmentStatus.InTransit : ShipmentStatus.Preparing,
                        TotalProductAmount = lineTotal,
                        TaxAmount = taxAmt,
                        GrandTotal = lineTotal,
                        ShippingAddressSnapshot = addr,
                        BillingAddressSnapshot = addr,
                        Note = "Test siparişi",
                    };
                    order.Items.Add(new OrderItem
                    {
                        ProductId = product.Id,
                        ProductName = product.Name,
                        SKU = $"TST-{_rng.Next(10000, 99999)}",
                        Quantity = qty,
                        UnitPrice = product.Price,
                        TaxRate = product.TaxRate,
                        TaxAmount = taxAmt,
                        LineTotal = lineTotal,
                    });
                    db.Orders.Add(order);
                    created.Add(new { order.Id, order.OrderNumber, order.Status, order.GrandTotal });
                }
                break;
            }

            case "review":
            {
                var products = await db.Products.Where(p => p.IsActive).Select(p => p.Id).ToListAsync(ct);
                var users = await db.Users.Where(u => u.IsActive).Select(u => u.Id).ToListAsync(ct);
                if (products.Count == 0) return BadRequest(new { error = "Önce en az 1 ürün oluşturun." });
                if (users.Count == 0) return BadRequest(new { error = "Önce en az 1 kullanıcı oluşturun." });

                var ratings = new[] { 3, 4, 4, 5, 5, 5 };
                for (int i = 0; i < count; i++)
                {
                    var review = new ProductReview
                    {
                        ProductId = products[_rng.Next(products.Count)],
                        UserId = users[_rng.Next(users.Count)],
                        Rating = Pick(ratings),
                        Title = $"Test Yorum {_rng.Next(1000, 9999)}",
                        Body = Pick(_reviewBodies),
                        IsVerifiedPurchase = _rng.Next(2) == 0,
                        IsApproved = _rng.Next(3) != 0,
                    };
                    db.ProductReviews.Add(review);
                    created.Add(new { review.Id, review.ProductId, review.Rating, review.IsApproved });
                }
                break;
            }

            case "coupon":
            {
                for (int i = 0; i < count; i++)
                {
                    var isPercent = _rng.Next(2) == 0;
                    var code = $"TEST{_rng.Next(10000, 99999)}";
                    var coupon = new Coupon
                    {
                        Code = code,
                        Type = isPercent ? CouponType.Percentage : CouponType.FixedAmount,
                        Value = isPercent ? _rng.Next(5, 51) : Pick(new[] { 25m, 50m, 100m, 150m, 200m }),
                        MinOrderAmount = _rng.Next(2) == 0 ? _rng.Next(100, 500) : 0,
                        MaxUsageCount = _rng.Next(10, 201),
                        StartDate = now.AddDays(-7),
                        EndDate = now.AddDays(_rng.Next(7, 90)),
                        IsActive = true,
                        Description = $"Test kuponu — {(isPercent ? "%" : "TL")} indirim",
                    };
                    db.Coupons.Add(coupon);
                    created.Add(new { coupon.Id, coupon.Code, coupon.Type, coupon.Value });
                }
                break;
            }

            default:
                return BadRequest(new { error = $"Bilinmeyen varlık tipi: '{request.Entity}'. Geçerli: category, brand, product, user, order, review, coupon" });
        }

        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            entity = request.Entity,
            requested = request.Count,
            created = created.Count,
            items = created,
        });
    }

    [HttpPost("returns")]
    public async Task<IActionResult> SeedReturns(CancellationToken ct)
    {
        var addressSnapshot = """{"addressTitle":"Test Adres","firstName":"Test","lastName":"Müşteri","phoneNumber":"05001234567","country":"TR","city":"İstanbul","district":"Kadıköy","neighborhood":"Moda","fullAddress":"Test Sokak No:1","postalCode":"34710"}""";

        var testOrders = new List<Order>();
        for (int i = 1; i <= 3; i++)
        {
            var order = new Order
            {
                OrderNumber = $"TEST-RET-{DateTime.UtcNow:yyyyMMdd}-{i:D3}",
                Status = OrderStatus.RefundRequested,
                PaymentStatus = PaymentStatus.Paid,
                ShipmentStatus = ShipmentStatus.Delivered,
                TotalProductAmount = 100m * i,
                TaxAmount = 18m * i,
                GrandTotal = 118m * i,
                ShippingAddressSnapshot = addressSnapshot,
                BillingAddressSnapshot = addressSnapshot,
                Note = $"Test iade talebi #{i}",
            };
            order.Items.Add(new OrderItem
            {
                ProductId = Guid.NewGuid(),
                ProductName = $"Test Ürün {i}",
                SKU = $"TEST-{i:D3}",
                Quantity = i,
                UnitPrice = 100m,
                TaxRate = 18m,
                TaxAmount = 18m * i,
                LineTotal = 118m * i,
            });
            testOrders.Add(order);
        }

        db.Orders.AddRange(testOrders);
        await db.SaveChangesAsync(ct);

        return Ok(new { message = $"{testOrders.Count} test iade kaydı oluşturuldu.", ids = testOrders.Select(o => o.Id) });
    }

    [HttpPost("invoices")]
    public async Task<IActionResult> SeedInvoices(CancellationToken ct)
    {
        var addressSnapshot = """{"addressTitle":"Fatura Adresi","firstName":"Test","lastName":"Müşteri","phoneNumber":"05001234567","country":"TR","city":"İstanbul","district":"Şişli","neighborhood":"Nişantaşı","fullAddress":"Test Cad. No:5","postalCode":"34367"}""";

        var testOrders = new List<Order>();
        for (int i = 1; i <= 3; i++)
        {
            var order = new Order
            {
                OrderNumber = $"TEST-INV-{DateTime.UtcNow:yyyyMMdd}-{i:D3}",
                Status = OrderStatus.Completed,
                PaymentStatus = PaymentStatus.Paid,
                ShipmentStatus = ShipmentStatus.Delivered,
                TotalProductAmount = 200m * i,
                TaxAmount = 36m * i,
                GrandTotal = 236m * i,
                ShippingAddressSnapshot = addressSnapshot,
                BillingAddressSnapshot = addressSnapshot,
            };
            order.Items.Add(new OrderItem
            {
                ProductId = Guid.NewGuid(),
                ProductName = $"Fatura Ürünü {i}",
                SKU = $"INV-PRD-{i:D3}",
                Quantity = i,
                UnitPrice = 200m,
                TaxRate = 18m,
                TaxAmount = 36m * i,
                LineTotal = 236m * i,
            });
            testOrders.Add(order);
        }

        db.Orders.AddRange(testOrders);
        await db.SaveChangesAsync(ct);

        var invoices = new List<Invoice>();
        var docTypes = new[] { EInvoiceDocType.eArchive, EInvoiceDocType.eInvoice, EInvoiceDocType.eArchive };
        var statuses = new[] { InvoiceStatus.Draft, InvoiceStatus.Pending, InvoiceStatus.Sent };

        for (int i = 0; i < 3; i++)
        {
            var order = testOrders[i];
            var invoice = new Invoice
            {
                InvoiceNumber = $"FT-{DateTime.UtcNow:yyyyMMdd}-{i + 1:D4}",
                OrderId = order.Id,
                DocType = docTypes[i],
                Status = statuses[i],
                SubTotal = order.TotalProductAmount,
                TaxAmount = order.TaxAmount,
                TotalAmount = order.GrandTotal,
                BillingAddressSnapshot = addressSnapshot,
                SentDate = statuses[i] == InvoiceStatus.Sent ? DateTime.UtcNow.AddDays(-1) : null,
            };
            invoice.Items.Add(new InvoiceItem
            {
                ProductName = $"Fatura Ürünü {i + 1}",
                SKU = $"INV-PRD-{i + 1:D3}",
                Quantity = i + 1,
                UnitPrice = 200m,
                TaxRate = 18m,
                TaxAmount = 36m * (i + 1),
                LineTotal = 236m * (i + 1),
            });
            invoices.Add(invoice);
        }

        db.Invoices.AddRange(invoices);
        await db.SaveChangesAsync(ct);

        return Ok(new { message = $"{invoices.Count} test fatura oluşturuldu.", ids = invoices.Select(inv => inv.Id) });
    }

    [HttpPost("guest-orders")]
    public async Task<IActionResult> SeedGuestOrders(CancellationToken ct)
    {
        var addressSnapshot = """{"addressTitle":"Misafir Adres","firstName":"Misafir","lastName":"Kullanıcı","phoneNumber":"05001234567","country":"TR","city":"İstanbul","district":"Şişli","neighborhood":"Nişantaşı","fullAddress":"Misafir Cad. No:10","postalCode":"34367"}""";

        var guestEmail = $"misafir-test-{DateTime.UtcNow:yyyyMMddHHmm}@test.com";

        var order = new Order
        {
            OrderNumber   = $"GUEST-{DateTime.UtcNow:yyyyMMddHHmm}-001",
            GuestEmail    = guestEmail,
            Status        = OrderStatus.PaymentCompleted,
            PaymentStatus = PaymentStatus.Paid,
            ShipmentStatus = ShipmentStatus.Preparing,
            TotalProductAmount = 299m,
            TaxAmount          = 53.82m,
            GrandTotal         = 299m,
            ShippingAddressSnapshot = addressSnapshot,
            BillingAddressSnapshot  = addressSnapshot,
            Note = "Misafir test siparişi",
        };
        order.Items.Add(new OrderItem
        {
            ProductId   = Guid.NewGuid(),
            ProductName = "Test Ürün (Misafir)",
            SKU         = "GUEST-001",
            Quantity    = 1,
            UnitPrice   = 299m,
            TaxRate     = 18m,
            TaxAmount   = 53.82m,
            LineTotal   = 299m,
        });

        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            message    = "1 misafir siparişi oluşturuldu.",
            id         = order.Id,
            orderNumber = order.OrderNumber,
            guestEmail,
        });
    }
}
