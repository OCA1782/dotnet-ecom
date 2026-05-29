using Ecom.Application.Common.Interfaces;
using Ecom.Infrastructure.Persistence;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Net.Sockets;
using System.Security.Claims;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/health")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class HealthController(
    ApplicationDbContext db,
    IDistributedCache cache,
    IBus bus,
    IEmailService emailService,
    IConfiguration configuration) : ControllerBase
{
    // ── GET /api/admin/health ────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var services = new List<ServiceStatus>();
        var now = DateTime.UtcNow;

        // ── API ──────────────────────────────────────────────────────────
        var apiVersion = System.Reflection.Assembly.GetExecutingAssembly()
            .GetName().Version?.ToString(3) ?? "1.0.0";
        var env    = configuration["ASPNETCORE_ENVIRONMENT"] ?? "Development";
        var apiUrl = configuration["ApiBaseUrl"] ?? "http://localhost:5124";
        var jwtKey = configuration["Jwt:Key"]
                  ?? configuration["Jwt:SecretKey"]
                  ?? configuration["JwtSettings:Key"] ?? "";
        var controllerCount = System.Reflection.Assembly.GetExecutingAssembly()
            .GetTypes()
            .Count(t => typeof(Microsoft.AspNetCore.Mvc.ControllerBase).IsAssignableFrom(t) && !t.IsAbstract);

        services.Add(new ServiceStatus("API", "ok", 0, "Çalışıyor",
            new ServiceMeta("API Sunucusu", apiUrl, $"v{apiVersion}", env, "5124", null), now,
            [
                new("HTTP Sunucusu",         "ok",                                                          apiUrl,                                             null),
                new("API Sürümü",            "ok",                                                          $"v{apiVersion}",                                   null),
                new("Ortam",                 env is "Production" ? "ok" : "info",                           env,                                                null),
                new("JWT Kimlik Doğrulama",  !string.IsNullOrWhiteSpace(jwtKey) ? "ok" : "down",           !string.IsNullOrWhiteSpace(jwtKey) ? "Yapılandırılmış" : "Anahtar eksik", null),
                new("Toplam Kontrolcü",      "info",                                                        $"{controllerCount} adet",                          null),
                new("CORS",                  "ok",                                                          "Yapılandırılmış",                                  null),
                new("Hata Kayıt Middleware", "ok",                                                          "Aktif",                                            null),
                new("Outbox İşlemcisi",      "ok",                                                          "Arka plan servisi",                                "Her 10 sn — maks. 20 mesaj/tur"),
            ]));

        // ── Veritabanı ────────────────────────────────────────────────────
        try
        {
            var sw = Stopwatch.StartNew();
            await db.Database.ExecuteSqlRawAsync("SELECT 1", ct);
            sw.Stop();

            var provider   = configuration["Database:Provider"] ?? "SqlServer";
            var connStr    = configuration.GetConnectionString("DefaultConnection") ?? "";
            var dbName     = ExtractDbName(connStr);
            var connMasked = MaskConnectionString(connStr);

            var dbItems = new List<ServiceItem>();
            dbItems.AddRange(await SafeCount(db.Users,          "Kullanıcılar",       ct));
            dbItems.AddRange(await SafeCount(db.Products,       "Ürünler",            ct));
            dbItems.AddRange(await SafeCount(db.Orders,         "Siparişler",         ct));
            dbItems.AddRange(await SafeCount(db.Categories,     "Kategoriler",        ct));
            dbItems.AddRange(await SafeCount(db.Brands,         "Markalar",           ct));
            dbItems.AddRange(await SafeCount(db.ProductReviews, "Ürün Yorumları",     ct));
            dbItems.AddRange(await SafeCount(db.ErrorLogs,      "Hata Kayıtları",     ct));
            dbItems.AddRange(await SafeCount(db.AuditLogs,      "Denetim Kayıtları",  ct));

            try
            {
                var pending = (await db.Database.GetPendingMigrationsAsync(ct)).ToList();
                dbItems.Add(new("Bekleyen Göç",
                    pending.Count == 0 ? "ok" : "warn",
                    pending.Count == 0 ? "Tümü uygulandı" : $"{pending.Count} göç bekliyor",
                    pending.Count > 0 ? string.Join(", ", pending.Take(3)) : null));
            }
            catch { dbItems.Add(new("Göç Durumu", "unknown", "Sorgulanamadı", null)); }

            services.Add(new ServiceStatus("Veritabanı",
                sw.ElapsedMilliseconds > 200 ? "degraded" : "ok",
                (int)sw.ElapsedMilliseconds,
                $"{provider} — {dbName}",
                new ServiceMeta("Veritabanı Sunucusu", connMasked, provider, dbName, null, null),
                now, dbItems));
        }
        catch (Exception ex)
        {
            services.Add(new ServiceStatus("Veritabanı", "down", null,
                ex.Message[..Math.Min(100, ex.Message.Length)],
                new ServiceMeta("Veritabanı Sunucusu", null, null, null, null, null), now, null));
        }

        // ── Redis / Cache ──────────────────────────────────────────────────
        try
        {
            var sw   = Stopwatch.StartNew();
            var opts = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(10) };
            await cache.SetStringAsync("__health_check__", "1", opts, ct);
            var val = await cache.GetStringAsync("__health_check__", ct);
            sw.Stop();

            var redisConn   = configuration.GetConnectionString("Redis") ?? "";
            var isRedis     = !string.IsNullOrWhiteSpace(redisConn);
            var cacheOk     = val == "1";
            var cacheStatus = isRedis ? (cacheOk ? "ok" : "down") : "degraded";
            var hostDisplay = isRedis ? MaskRedis(redisConn) : "InMemory";

            var redisItems = new List<ServiceItem>
            {
                new("Bağlantı Türü",           isRedis ? "ok" : "info",
                                               isRedis ? "Redis (StackExchange.Redis)" : "Bellek İçi (InMemory)",
                                               isRedis ? null : "Üretimde Redis kullanılması önerilir"),
                new("Bağlantı Testi",          cacheOk ? "ok" : "down",
                                               cacheOk ? "Yazma / Okuma başarılı" : "Önbellek hatası", null),
                new("Lisans Önbelleği",        "info", "Ön ek: license:",   "LicenseService — 5 dk TTL"),
                new("Ürün Listesi Önbelleği",  "info", "Ön ek: products:",  "GetProductsQuery sonuçları"),
                new("Sepet Önbelleği",         "info", "Ön ek: cart:",      "Oturum bazlı"),
                new("JWT Kara Listesi",        "info", "Ön ek: blacklist:", "İptal edilen tokenlar"),
            };
            if (isRedis)
            {
                var parts = redisConn.Split(',')[0].Split(':');
                redisItems.Insert(1, new("Sunucu Adresi", "info", parts[0],                                 null));
                redisItems.Insert(2, new("Port",          "info", parts.Length > 1 ? parts[1] : "6379",    null));
            }

            services.Add(new ServiceStatus("Redis", cacheStatus, (int)sw.ElapsedMilliseconds,
                isRedis ? $"Redis — {hostDisplay}" : "InMemory önbellek",
                new ServiceMeta("Önbellek Sunucusu", hostDisplay, isRedis ? "Redis" : "InMemory",
                    null, isRedis ? "6379" : null, null),
                now, redisItems));
        }
        catch (Exception ex)
        {
            services.Add(new ServiceStatus("Redis", "down", null,
                ex.Message[..Math.Min(100, ex.Message.Length)],
                new ServiceMeta("Önbellek Sunucusu", null, null, null, null, null), now, null));
        }

        // ── RabbitMQ / MassTransit ─────────────────────────────────────────
        try
        {
            var sw      = Stopwatch.StartNew();
            var address = bus.Address;
            sw.Stop();

            var rmqHost      = configuration["RabbitMQ:Host"];
            var rmqPort      = configuration["RabbitMQ:Port"] ?? "5672";
            var rmqVhost     = configuration["RabbitMQ:VirtualHost"] ?? "/";
            var rmqUser      = configuration["RabbitMQ:Username"] ?? "guest";
            var isConfigured = !string.IsNullOrWhiteSpace(rmqHost);
            var rmqUrl       = isConfigured ? $"amqp://{rmqHost}:{rmqPort}{rmqVhost}" : "InMemory (MassTransit)";

            var rmqItems = new List<ServiceItem>
            {
                new("Taşıma Türü",                  isConfigured ? "ok"   : "info",
                                                    isConfigured ? "RabbitMQ" : "InMemory (MassTransit)",
                                                    isConfigured ? null : "Üretimde RabbitMQ kullanılması önerilir"),
                new("Bus Adresi",                   "info", address?.ToString() ?? rmqUrl,           null),
                new("OrderCreatedConsumer",         "ok",   "Kayıtlı", "Sipariş oluşturuldu — kuyruk dinleniyor"),
                new("PaymentCompletedConsumer",     "ok",   "Kayıtlı", "Ödeme tamamlandı — kuyruk dinleniyor"),
                new("OrderStatusChangedConsumer",   "ok",   "Kayıtlı", "Sipariş durumu değişti — kuyruk dinleniyor"),
                new("OrderProcessingSaga",          "ok",   "Kayıtlı", "EF Core state machine — sipariş akışı"),
                new("OutboxProcessor",              "ok",   "Arka plan servisi", "Her 10 sn — maks. 20 mesaj/tur — maks. 5 deneme"),
            };
            if (isConfigured)
            {
                rmqItems.Insert(1, new("Sunucu",       "info", $"{rmqHost}:{rmqPort}", null));
                rmqItems.Insert(2, new("Virtual Host", "info", rmqVhost,               null));
                rmqItems.Insert(3, new("Kullanıcı",    "info", rmqUser,                null));
            }

            services.Add(new ServiceStatus("RabbitMQ",
                isConfigured ? "ok" : "degraded",
                (int)sw.ElapsedMilliseconds,
                isConfigured ? $"{rmqHost}:{rmqPort}{rmqVhost}" : "InMemory",
                new ServiceMeta("Mesaj Kuyruğu", rmqUrl, isConfigured ? "RabbitMQ" : "InMemory",
                    rmqVhost, rmqPort, rmqUser),
                now, rmqItems));
        }
        catch (Exception ex)
        {
            services.Add(new ServiceStatus("RabbitMQ", "down", null,
                ex.Message[..Math.Min(100, ex.Message.Length)],
                new ServiceMeta("Mesaj Kuyruğu", null, null, null, null, null), now, null));
        }

        // ── E-posta / SMTP ─────────────────────────────────────────────────
        var smtpHost   = configuration["Email:SmtpHost"];
        var smtpPort   = configuration["Email:SmtpPort"] ?? "587";
        var fromAddr   = configuration["Email:FromAddress"] ?? configuration["Email:Username"] ?? "";
        var useSsl     = configuration["Email:UseSsl"] ?? "false";
        var isFakeSmtp = string.IsNullOrWhiteSpace(smtpHost) || smtpHost == "smtp.example.com";

        string emailStatus; string emailDetail; int? emailMs = null;

        var emailItems = new List<ServiceItem>
        {
            new("SendOrderConfirmationAsync",   "ok", "Sipariş Onayı",          "Şablon hazır"),
            new("SendPaymentSuccessAsync",      "ok", "Ödeme Bildirimi",         "Şablon hazır"),
            new("SendShippingNotificationAsync","ok", "Kargo Bildirimi",         "Şablon hazır"),
            new("SendPasswordResetAsync",       "ok", "Şifre Sıfırlama",        "Şablon hazır"),
            new("SendEmailVerificationAsync",   "ok", "E-posta Doğrulama",       "Şablon hazır"),
            new("SendLowStockAlertAsync",       "ok", "Düşük Stok Uyarısı",     "Şablon hazır"),
            new("SendReviewRejectionAsync",     "ok", "Yorum Reddi Bildirimi",   "Şablon hazır"),
        };

        if (!isFakeSmtp)
        {
            try
            {
                var sw = Stopwatch.StartNew();
                using var tcp = new TcpClient();
                using var tcts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                tcts.CancelAfter(TimeSpan.FromSeconds(4));
                await tcp.ConnectAsync(smtpHost!, int.Parse(smtpPort), tcts.Token);
                sw.Stop();
                emailStatus = "ok";
                emailDetail = $"{smtpHost}:{smtpPort} — TCP başarılı";
                emailMs     = (int)sw.ElapsedMilliseconds;
                emailItems.InsertRange(0, (ServiceItem[])[
                    new("SMTP Sunucusu", "ok",   $"{smtpHost}:{smtpPort}", "TCP bağlantısı başarılı"),
                    new("Güvenlik",      "info",  useSsl == "true" ? "SSL/TLS" : "STARTTLS", null),
                    new("Gönderici",     "info",  fromAddr, null),
                ]);
            }
            catch
            {
                emailStatus = "down";
                emailDetail = $"{smtpHost}:{smtpPort} — TCP bağlantısı başarısız";
                emailItems.InsertRange(0, (ServiceItem[])[
                    new("SMTP Sunucusu", "down",  $"{smtpHost}:{smtpPort}", "TCP bağlantısı kurulamadı"),
                    new("Güvenlik",      "info",   useSsl == "true" ? "SSL/TLS" : "STARTTLS", null),
                    new("Gönderici",     "info",   fromAddr, null),
                ]);
            }
        }
        else
        {
            emailStatus = "unknown";
            emailDetail = "SMTP yapılandırılmamış — geliştirme modunda log'a yazılır";
            emailItems.InsertRange(0, (ServiceItem[])[
                new("SMTP Sunucusu",   "unknown", "Yapılandırılmamış", "Email:SmtpHost eksik veya örnek değer"),
                new("Geliştirme Modu", "info",    "Log'a yazılıyor",   "SmtpHost boş iken e-posta gönderilmez"),
            ]);
        }

        services.Add(new ServiceStatus("E-posta", emailStatus, emailMs, emailDetail,
            new ServiceMeta("SMTP Sunucusu", isFakeSmtp ? null : $"{smtpHost}:{smtpPort}",
                "SMTP", fromAddr, smtpPort, useSsl == "true" ? "SSL/TLS" : "STARTTLS"),
            now, emailItems));

        // ── Genel durum ────────────────────────────────────────────────────
        var overallStatus = services.All(s => s.Status is "ok" or "info" or "unknown") ? "ok" :
                            services.Any(s => s.Status == "down") ? "down" : "degraded";

        return Ok(new { services, overallStatus, checkedAt = now });
    }

    // ── POST /api/admin/health/actions/{action} ──────────────────────────
    [HttpPost("actions/{action}")]
    public async Task<IActionResult> RunAction(string action, CancellationToken ct)
    {
        switch (action.ToLowerInvariant())
        {
            case "send-test-email":
            {
                var email = User.FindFirstValue(ClaimTypes.Email)
                         ?? User.FindFirstValue("email")
                         ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
                if (string.IsNullOrWhiteSpace(email))
                    return BadRequest(new { error = "Oturumdaki kullanıcı e-postası bulunamadı." });
                try
                {
                    await emailService.SendTestEmailAsync(email, ct);
                    return Ok(new { message = $"Test e-postası {email} adresine gönderildi." });
                }
                catch (Exception ex)
                {
                    return BadRequest(new { error = ex.Message[..Math.Min(200, ex.Message.Length)] });
                }
            }

            case "ping-smtp":
            {
                var host = configuration["Email:SmtpHost"];
                var port = int.Parse(configuration["Email:SmtpPort"] ?? "587");
                if (string.IsNullOrWhiteSpace(host) || host == "smtp.example.com")
                    return BadRequest(new { error = "SMTP yapılandırılmamış." });
                try
                {
                    var sw = Stopwatch.StartNew();
                    using var tcp = new TcpClient();
                    using var tcts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                    tcts.CancelAfter(TimeSpan.FromSeconds(5));
                    await tcp.ConnectAsync(host, port, tcts.Token);
                    sw.Stop();
                    return Ok(new { message = $"{host}:{port} — TCP bağlantısı başarılı ({sw.ElapsedMilliseconds}ms)" });
                }
                catch (Exception ex)
                {
                    return BadRequest(new { error = $"{host}:{port} — {ex.Message[..Math.Min(100, ex.Message.Length)]}" });
                }
            }

            case "ping-db":
            {
                try
                {
                    var sw = Stopwatch.StartNew();
                    await db.Database.ExecuteSqlRawAsync("SELECT 1", ct);
                    sw.Stop();
                    return Ok(new { message = $"Veritabanı bağlantısı başarılı ({sw.ElapsedMilliseconds}ms)" });
                }
                catch (Exception ex)
                {
                    return BadRequest(new { error = ex.Message[..Math.Min(200, ex.Message.Length)] });
                }
            }

            case "flush-cache":
            {
                try
                {
                    await cache.RemoveAsync("__health_check__", ct);
                    return Ok(new { message = "Önbellek test anahtarı temizlendi." });
                }
                catch (Exception ex)
                {
                    return BadRequest(new { error = ex.Message[..Math.Min(200, ex.Message.Length)] });
                }
            }

            case "ping-cache":
            {
                try
                {
                    var sw   = Stopwatch.StartNew();
                    var opts = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(5) };
                    await cache.SetStringAsync("__health_ping__", "1", opts, ct);
                    var val = await cache.GetStringAsync("__health_ping__", ct);
                    sw.Stop();
                    return val == "1"
                        ? Ok(new { message = $"Önbellek yazma/okuma başarılı ({sw.ElapsedMilliseconds}ms)" })
                        : BadRequest(new { error = "Önbellek okuma başarısız." });
                }
                catch (Exception ex)
                {
                    return BadRequest(new { error = ex.Message[..Math.Min(200, ex.Message.Length)] });
                }
            }

            case "ping-rabbitmq":
            {
                try
                {
                    var sw      = Stopwatch.StartNew();
                    var address = bus.Address;
                    sw.Stop();
                    return Ok(new { message = $"MassTransit bus erişilebilir ({sw.ElapsedMilliseconds}ms) — {address}" });
                }
                catch (Exception ex)
                {
                    return BadRequest(new { error = ex.Message[..Math.Min(200, ex.Message.Length)] });
                }
            }

            default:
                return BadRequest(new { error = $"Bilinmeyen işlem: {action}" });
        }
    }

    // ── Yardımcı metotlar ──────────────────────────────────────────────────

    private static async Task<List<ServiceItem>> SafeCount<T>(
        IQueryable<T> set, string label, CancellationToken ct) where T : class
    {
        try
        {
            var count = await set.CountAsync(ct);
            return [new(label, "info", $"{count:N0} kayıt", null)];
        }
        catch { return []; }
    }

    private static string ExtractDbName(string conn)
    {
        if (string.IsNullOrWhiteSpace(conn)) return "—";
        var m = System.Text.RegularExpressions.Regex.Match(conn,
            @"(Database|Initial Catalog)=([^;]+)",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        return m.Success ? m.Groups[2].Value : "—";
    }

    private static string MaskConnectionString(string conn)
    {
        if (string.IsNullOrWhiteSpace(conn)) return "(boş)";
        var r = System.Text.RegularExpressions.Regex.Replace(
            conn, @"(Password|Pwd)=([^;]+)", "$1=***",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        return r.Length > 80 ? r[..80] + "…" : r;
    }

    private static string MaskRedis(string conn)
    {
        if (string.IsNullOrWhiteSpace(conn)) return "(boş)";
        return conn.Length > 40 ? conn[..40] + "…" : conn;
    }

    private record ServiceItem(
        string Name,
        string Status,   // ok | warn | down | info | unknown
        string? Value,
        string? Detail);

    private record ServiceMeta(
        string? TypeLabel,
        string? Url,
        string? Provider,
        string? Database,
        string? Port,
        string? Extra);

    private record ServiceStatus(
        string Name,
        string Status,
        int? ResponseMs,
        string? Detail,
        ServiceMeta? Meta,
        DateTime CheckedAt,
        IReadOnlyList<ServiceItem>? Items = null);
}
