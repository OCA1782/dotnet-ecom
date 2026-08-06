using System.Security.Cryptography;
using System.Text;
using System.Threading.RateLimiting;
using CloudinaryDotNet;
using Serilog;
using Ecom.Infrastructure.Security;
using Ecom.Application;
using Ecom.Infrastructure;
using Ecom.Infrastructure.Persistence;
using Ecom.API.Middleware;
using Ecom.API.Filters;
using Ecom.API.Services;
using Ecom.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

// PostgreSQL: DateTime.Kind=Unspecified parametrelerini UTC olarak kabul et
// (SQL Server'dan geçişte tüm DateTime'ları tek tek düzeltmeyi önler)
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ── Lisans doğrulama & JWT anahtar türetme ─────────────────────────────────
// Lisans private key olmadan taklit edilemez (RSA-2048).
// JWT imzalama anahtarı lisanstan türetilir: lisans geçersizse auth da çalışmaz.
var licenseToken = builder.Configuration["License"]
    ?? Environment.GetEnvironmentVariable("ECOM_LICENSE") ?? "";

byte[] jwtKeyBytes;
try
{
    var licInfo = LicenseValidator.Validate(licenseToken);
    jwtKeyBytes = LicenseValidator.DeriveJwtKey(licInfo);
}
catch
{
    // Geçersiz lisans: rastgele anahtar → tüm auth işlemleri başarısız olur.
    // Hard-fail startup scope'da gerçekleşir (aşağıda).
    jwtKeyBytes = RandomNumberGenerator.GetBytes(32);
}

builder.Services.AddSingleton(new LicenseJwtKey(jwtKeyBytes));
// ──────────────────────────────────────────────────────────────────────────

// ── Serilog merkezi loglama ────────────────────────────────────────────────
var seqUrl = builder.Configuration["Seq:Url"];
var loggerConfig = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}");
if (!string.IsNullOrWhiteSpace(seqUrl))
    loggerConfig = loggerConfig.WriteTo.Seq(seqUrl);
Log.Logger = loggerConfig.CreateLogger();
builder.Host.UseSerilog();
// ──────────────────────────────────────────────────────────────────────────

builder.Services.AddHttpClient();
builder.Services.AddHttpClient("ImageProxy", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (compatible; EcomBot/1.0)");
    client.DefaultRequestHeaders.Add("Accept", "image/*,*/*");
});
builder.Services.AddScoped<AuditFilter>();
builder.Services.AddControllers(options =>
{
    options.Filters.AddService<AuditFilter>();
    options.Filters.Add<ValidationExceptionFilter>();
});
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();
builder.Services.AddMemoryCache();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHttpContextAccessor();

// ── Storage: R2 → Cloudinary → Local (öncelik sırası) ─────────────────────
var r2AccountId  = builder.Configuration["R2:AccountId"];
var r2AccessKey  = builder.Configuration["R2:AccessKeyId"];
var r2SecretKey  = builder.Configuration["R2:SecretAccessKey"];
var cloudinaryUrl = builder.Configuration["Cloudinary:Url"];

if (!string.IsNullOrWhiteSpace(r2AccountId) && !string.IsNullOrWhiteSpace(r2AccessKey))
{
    var s3Config = new Amazon.S3.AmazonS3Config
    {
        ServiceURL    = $"https://{r2AccountId}.r2.cloudflarestorage.com",
        ForcePathStyle = true,
    };
    builder.Services.AddSingleton<Amazon.S3.IAmazonS3>(
        _ => new Amazon.S3.AmazonS3Client(r2AccessKey, r2SecretKey, s3Config));
    builder.Services.AddScoped<IStorageService, R2StorageService>();
}
else if (!string.IsNullOrWhiteSpace(cloudinaryUrl))
{
    builder.Services.AddSingleton(new Cloudinary(cloudinaryUrl) { Api = { Secure = true } });
    builder.Services.AddScoped<IStorageService, CloudinaryStorageService>();
}
else
{
    builder.Services.AddScoped<IStorageService, LocalStorageService>();
}
// ──────────────────────────────────────────────────────────────────────────

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(jwtKeyBytes),
            NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(opt =>
{
    opt.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Return structured JSON on rejection so frontends can show a user-friendly message.
    opt.OnRejected = async (ctx, ct) =>
    {
        ctx.HttpContext.Response.ContentType = "application/json";
        ctx.HttpContext.Response.StatusCode  = StatusCodes.Status429TooManyRequests;
        await ctx.HttpContext.Response.WriteAsync(
            "{\"error\":\"rate_limited\",\"message\":\"Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.\"}",
            ct);
    };

    // Auth endpoint'leri: IP başına 30 istek/dakika (brute-force koruması)
    opt.AddFixedWindowLimiter("auth", o =>
    {
        o.PermitLimit = 30;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 0;
    });

    // Genel API: global 600 istek/dakika (10/sn) — bot ve scraper koruması.
    // Admin panel 240s aralıklarla istek atar; meşru kullanım bu limiti dolduramaz.
    opt.AddFixedWindowLimiter("api", o =>
    {
        o.PermitLimit = 600;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 10;
    });

    // Upload endpoint'i: 20 istek/dakika
    opt.AddFixedWindowLimiter("upload", o =>
    {
        o.PermitLimit = 20;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 0;
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("EcomCors", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:3000", "http://localhost:3001"];
        var isDev = builder.Environment.IsDevelopment();

        policy.SetIsOriginAllowed(origin =>
            {
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                if (isDev && uri.Host == "localhost") return true;
                return allowedOrigins.Contains(origin);
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Seed database and validate license
using (var scope = app.Services.CreateScope())
{
    var db     = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    await DbInitializer.SeedAsync(db, config, app.Environment.ContentRootPath);

    // ── RSA Lisans Doğrulama ──────────────────────────────────────────────
    // Lisans RSA-2048 imzasıyla korunur. Private key olmadan geçerli lisans
    // üretilemez. JWT anahtarı lisanstan türetildiğinden startup check
    // kaldırılsa bile auth çalışmaz — bypass için her iki kontrolün de
    // kaldırılması ve JWT anahtarının ayrıca hardcode edilmesi gerekir.
    var token = config["License"] ?? Environment.GetEnvironmentVariable("ECOM_LICENSE") ?? "";
    try
    {
        LicenseValidator.Validate(token);
    }
    catch (LicenseException ex)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.Error.WriteLine("──────────────────────────────────────────────────────");
        Console.Error.WriteLine($"  HATA: {ex.Message}");
        Console.Error.WriteLine("  ECOM_LICENSE  : lisans token");
        Console.Error.WriteLine("  ECOM_PUBLIC_KEY: RSA public key (SPKI DER base64)");
        Console.Error.WriteLine("──────────────────────────────────────────────────────");
        Console.ResetColor();
        Environment.Exit(1);
    }

    // ── Online Aktivasyon (startup) ───────────────────────────────────────
    var activationUrl = config["License:ActivationUrl"]
        ?? Environment.GetEnvironmentVariable("LICENSE_ACTIVATION_URL");

    if (!string.IsNullOrWhiteSpace(activationUrl))
    {
        try
        {
            var licToken  = config["License"] ?? Environment.GetEnvironmentVariable("ECOM_LICENSE") ?? "";
            var hash      = LicenseValidator.ComputeActivationHash(licToken);
            var hostname  = System.Net.Dns.GetHostName();
            var body      = System.Text.Json.JsonSerializer.Serialize(new { hash, hostname });

            using var httpClient = new System.Net.Http.HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            var response = await httpClient.PostAsync(
                activationUrl,
                new System.Net.Http.StringContent(body, System.Text.Encoding.UTF8, "application/json"));

            if (!response.IsSuccessStatusCode)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.Error.WriteLine("──────────────────────────────────────────────────────");
                Console.Error.WriteLine($"  HATA: Online aktivasyon başarısız (HTTP {(int)response.StatusCode}).");
                Console.Error.WriteLine("  Bu lisans bu sunucu için yetkili değil.");
                Console.Error.WriteLine("──────────────────────────────────────────────────────");
                Console.ResetColor();
                Environment.Exit(1);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.Error.WriteLine("──────────────────────────────────────────────────────");
            Console.Error.WriteLine($"  HATA: Aktivasyon sunucusuna ulaşılamadı: {ex.Message}");
            Console.Error.WriteLine("──────────────────────────────────────────────────────");
            Console.ResetColor();
            Environment.Exit(1);
        }
    }
    // ─────────────────────────────────────────────────────────────────────
}

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<InputSanitizationMiddleware>();
app.UseMiddleware<ValidationExceptionMiddleware>();
app.UseMiddleware<Ecom.Infrastructure.Middleware.IpWhitelistMiddleware>();
app.UseCors("EcomCors");
app.UseMiddleware<LicenseMiddleware>();
app.UseMiddleware<ErrorLoggingMiddleware>();

var webRootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRootPath, "uploads"));
var noImageSrc = Path.Combine(app.Environment.ContentRootPath, "Assets", "autoforcepart-no-image.png");
var noImageDst = Path.Combine(webRootPath, "uploads", "autoforcepart-no-image.png");
if (File.Exists(noImageSrc) && !File.Exists(noImageDst))
    File.Copy(noImageSrc, noImageDst);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(webRootPath),
    RequestPath = ""
});
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
if (!app.Environment.IsDevelopment()) app.UseHttpsRedirection();
app.MapControllers().RequireRateLimiting("api");
app.MapHealthChecks("/health");

app.Run();
