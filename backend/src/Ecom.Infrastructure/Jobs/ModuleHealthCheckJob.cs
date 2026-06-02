using Ecom.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ecom.Infrastructure.Jobs;

public class ModuleHealthCheckJob(IServiceScopeFactory scopeFactory) : IJobRunner
{
    public string Name => "ModuleHealthCheckJob";
    public string Description => "Modül sağlık durumlarını kontrol eder, sorun varsa yetkili adreslere uyarı maili gönderir";
    public int IntervalMinutes => 60;

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db    = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var email = scope.ServiceProvider.GetRequiredService<IEmailService>();

        // Uyarı ayarlarını oku
        var settings = await db.SiteSettings
            .Where(s => s.Key == "Alert:Enabled" || s.Key == "Alert:Emails")
            .ToListAsync(ct);

        var enabled = settings.FirstOrDefault(s => s.Key == "Alert:Enabled")?.Value == "true";
        if (!enabled)
        {
            await log("  ℹ Modül sağlık uyarıları devre dışı (Alert:Enabled=false)");
            return;
        }

        var emailsCsv = settings.FirstOrDefault(s => s.Key == "Alert:Emails")?.Value ?? "";
        var alertEmails = emailsCsv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(e => e.Contains('@'))
            .ToList();

        if (alertEmails.Count == 0)
        {
            await log("  ⚠ Uyarı e-postası adresi tanımlanmamış (Alert:Emails)");
            return;
        }

        var now = DateTime.UtcNow;
        var issues = new List<string>();

        // 7 günden fazla bekleyen onaylanmamış yorum
        var oldPendingReviews = await db.ProductReviews
            .CountAsync(r => !r.IsApproved && r.CreatedDate < now.AddDays(-7), ct);
        if (oldPendingReviews > 0)
            issues.Add($"<li><strong>Yorumlar:</strong> {oldPendingReviews} yorum 7+ gündür onay bekliyor</li>");

        // 5 günden fazla bekleyen iade talebi
        var oldRefunds = await db.Orders
            .CountAsync(o => o.Status == OrderStatus.RefundRequested
                          && !o.IsDeleted
                          && o.UpdatedDate < now.AddDays(-5), ct);
        if (oldRefunds > 0)
            issues.Add($"<li><strong>İadeler:</strong> {oldRefunds} iade talebi 5+ gündür işlem bekliyor</li>");

        // Hata durumundaki faturalar
        var errorInvoices = await db.Invoices
            .CountAsync(i => i.Status == InvoiceStatus.Error, ct);
        if (errorInvoices > 0)
            issues.Add($"<li><strong>Faturalar:</strong> {errorInvoices} fatura Error durumunda</li>");

        // Başarısız ödemeler (son 24 saat)
        var failedPayments = await db.Payments
            .CountAsync(p => p.Status == PaymentStatus.Failed && p.CreatedDate >= now.AddHours(-24), ct);
        if (failedPayments > 0)
            issues.Add($"<li><strong>Ödemeler:</strong> Son 24 saatte {failedPayments} başarısız ödeme</li>");

        // Kritik stok altı ürünler
        var criticalStock = await db.Stocks
            .CountAsync(s => (s.Quantity - s.ReservedQuantity) <= s.CriticalStockLevel
                          && s.CriticalStockLevel > 0, ct);
        if (criticalStock > 0)
            issues.Add($"<li><strong>Stok:</strong> {criticalStock} ürün kritik stok altında</li>");

        // Kargo teslimat başarısız
        var failedDeliveries = await db.Shipments
            .CountAsync(s => s.Status == ShipmentStatus.FailedDelivery, ct);
        if (failedDeliveries > 0)
            issues.Add($"<li><strong>Kargo:</strong> {failedDeliveries} teslimat başarısız</li>");

        if (issues.Count == 0)
        {
            await log("  ✓ Tüm modüller sağlıklı — uyarı gönderilmedi");
            return;
        }

        await log($"  ⚠ {issues.Count} sorun tespit edildi, uyarı maili gönderiliyor...");

        var body = $"""
            <div style="font-family:sans-serif;max-width:560px;margin:32px auto;padding:24px;border:1px solid #fca5a5;border-radius:12px;background:#fff">
              <h2 style="color:#dc2626;margin-top:0">⚠ Ecom Platform — Modül Sağlık Uyarısı</h2>
              <p style="color:#374151">Aşağıdaki modüllerde dikkat gerektiren durumlar tespit edildi:</p>
              <ul style="color:#374151;line-height:1.8">
                {string.Join("\n    ", issues)}
              </ul>
              <hr style="border:none;border-top:1px solid #fca5a5;margin:16px 0"/>
              <p style="color:#6b7280;font-size:13px">Kontrol zamanı: {now:yyyy-MM-dd HH:mm} UTC<br/>Bu uyarı ModuleHealthCheckJob tarafından otomatik gönderilmiştir.</p>
            </div>
            """;

        try
        {
            await email.SendAlertAsync(alertEmails, $"[Ecom] Modül Sağlık Uyarısı — {issues.Count} sorun", body, ct);
            await log($"  ✓ Uyarı maili gönderildi → {string.Join(", ", alertEmails)}");
        }
        catch (Exception ex)
        {
            await log($"  ✗ Uyarı maili gönderilemedi: {ex.Message}");
        }
    }
}
