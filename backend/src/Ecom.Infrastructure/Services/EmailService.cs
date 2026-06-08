using Ecom.Application.Common.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Ecom.Infrastructure.Services;

public class EmailService(IConfiguration configuration, ILogger<EmailService> logger) : IEmailService
{
    private readonly string _host = configuration["Email:SmtpHost"] ?? "";
    private readonly int _port = int.TryParse(configuration["Email:SmtpPort"], out var p) ? p : 587;
    private readonly string _username = configuration["Email:Username"] ?? "";
    private readonly string _password = configuration["Email:Password"] ?? "";
    private readonly string _fromAddress = configuration["Email:FromAddress"] ?? "noreply@ecom.com";
    private readonly string _fromName = configuration["Email:FromName"] ?? "Ecom";
    private readonly bool _useSsl = bool.TryParse(configuration["Email:UseSsl"], out var ssl) && ssl;
    private readonly string _resetBaseUrl = configuration["Email:ResetPasswordBaseUrl"] ?? "http://localhost:3000/sifre-sifirla";

    public async Task SendOrderConfirmationAsync(string toEmail, string toName, string orderNumber, decimal grandTotal, CancellationToken ct = default)
    {
        var subject = $"Siparişiniz Alındı — {orderNumber}";
        var body = EmailTemplates.OrderConfirmation(toName, orderNumber, FormatPrice(grandTotal));
        await SendAsync(toEmail, toName, subject, body, ct);
    }

    public async Task SendPaymentSuccessAsync(string toEmail, string toName, string orderNumber, decimal grandTotal, CancellationToken ct = default)
    {
        var subject = $"Ödemeniz Onaylandı — {orderNumber}";
        var body = EmailTemplates.PaymentSuccess(toName, orderNumber, FormatPrice(grandTotal));
        await SendAsync(toEmail, toName, subject, body, ct);
    }

    public async Task SendShippingNotificationAsync(string toEmail, string toName, string orderNumber, string cargoCompany, string trackingNumber, string? trackingUrl, CancellationToken ct = default)
    {
        var subject = $"Siparişiniz Kargoya Verildi — {orderNumber}";
        var body = EmailTemplates.ShippingNotification(toName, orderNumber, cargoCompany, trackingNumber, trackingUrl);
        await SendAsync(toEmail, toName, subject, body, ct);
    }

    public async Task SendEmailVerificationAsync(string toEmail, string toName, string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_host) || _host == "smtp.example.com")
            logger.LogInformation("[EMAIL-DEV] VerificationCode={Code} To={To}", code, toEmail);
        var subject = "E-posta Doğrulama — Ecom";
        var body = EmailTemplates.EmailVerification(toName, code);
        await SendAsync(toEmail, toName, subject, body, ct);
    }

    public async Task SendVerificationReminderAsync(string toEmail, string toName, string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_host) || _host == "smtp.example.com")
            logger.LogInformation("[EMAIL-DEV] VerificationReminder Code={Code} To={To}", code, toEmail);
        var subject = "Hesabınızı Doğrulayın — Ecom";
        var body = EmailTemplates.VerificationReminder(toName, code);
        await SendAsync(toEmail, toName, subject, body, ct);
    }

    public async Task SendPasswordReminderAsync(string toEmail, string toName, int daysSinceLastChange, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_host) || _host == "smtp.example.com")
            logger.LogInformation("[EMAIL-DEV] PasswordReminder Days={Days} To={To}", daysSinceLastChange, toEmail);
        var subject = "Şifrenizi Güncelleme Zamanı — Ecom";
        var body = EmailTemplates.PasswordReminder(toName, daysSinceLastChange);
        await SendAsync(toEmail, toName, subject, body, ct);
    }

    public async Task SendPasswordResetAsync(string toEmail, string toName, string resetToken, CancellationToken ct = default)
    {
        var resetUrl = $"{_resetBaseUrl}?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(toEmail)}";
        var subject = "Şifre Sıfırlama — Ecom";
        var body = EmailTemplates.PasswordReset(toName, resetUrl);
        await SendAsync(toEmail, toName, subject, body, ct);
    }

    public async Task SendLowStockAlertAsync(string toEmail, string productName, int availableStock, int criticalLevel, CancellationToken ct = default)
    {
        var subject = $"⚠ Kritik Stok Uyarısı: {productName}";
        var body = EmailTemplates.LowStockAlert(productName, availableStock, criticalLevel);
        await SendAsync(toEmail, "Yönetici", subject, body, ct);
    }

    public async Task SendLowStockAlertBatchAsync(string toEmail, IReadOnlyList<(string ProductName, int Available, int Critical)> products, CancellationToken ct = default)
    {
        var subject = $"⚠ Kritik Stok Uyarısı — {products.Count} ürün";
        var body = EmailTemplates.LowStockAlertBatch(products);
        await SendAsync(toEmail, "Yönetici", subject, body, ct);
    }

    public async Task SendReviewRejectionAsync(string toEmail, string toName, string productName, string? note, CancellationToken ct = default)
    {
        var subject = $"Yorumunuz Hakkında Bilgi — {productName}";
        var noteSection = string.IsNullOrWhiteSpace(note)
            ? ""
            : $"<div style=\"background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:12px\"><p style=\"margin:0;color:#b91c1c;font-size:13px\"><strong>Yönetici Notu:</strong> {note}</p></div>";
        var body = $"""
            <div style="font-family:sans-serif;max-width:480px;margin:32px auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
              <h2 style="color:#b91c1c">Yorumunuz Yayınlanamadı</h2>
              <p>Merhaba {toName},</p>
              <p><strong>{productName}</strong> ürünü için bıraktığınız yorum, yönetimimiz tarafından incelenerek yayınlanmamasına karar verildi.</p>
              {noteSection}
              <p style="color:#64748b;font-size:13px;margin-top:16px">Sorularınız için destek ekibimize ulaşabilirsiniz.</p>
            </div>
            """;
        await SendAsync(toEmail, toName, subject, body, ct);
    }

    public async Task SendContactFormAsync(string toEmail, string fromName, string fromEmail, string message, CancellationToken ct = default)
    {
        var body = $"""
            <div style="font-family:sans-serif;max-width:560px;margin:32px auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
              <h2 style="color:#0f766e">Yeni İletişim Formu Mesajı</h2>
              <p><strong>Ad Soyad:</strong> {fromName}</p>
              <p><strong>E-posta:</strong> <a href="mailto:{fromEmail}">{fromEmail}</a></p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
              <p style="white-space:pre-wrap">{message}</p>
              <p style="color:#94a3b8;font-size:12px;margin-top:24px">{DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</p>
            </div>
            """;
        await SendAsync(toEmail, "Admin", $"İletişim Formu — {fromName}", body, ct);
    }

    public async Task SendLicenseAssignmentAsync(string toEmail, string toName, string licenseToken, string viewPassword, string issuer, string expiresAt, CancellationToken ct = default)
    {
        var subject = "Ecom Platform Lisansınız Hazır";
        var body = EmailTemplates.LicenseAssignment(toName, licenseToken, viewPassword, issuer, expiresAt);
        await SendAsync(toEmail, toName, subject, body, ct);
    }

    public async Task SendTestEmailAsync(string toEmail, CancellationToken ct = default)
    {
        var body = $"""
            <div style="font-family:sans-serif;max-width:480px;margin:32px auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
              <h2 style="color:#0f766e">SMTP Test E-postası</h2>
              <p>Bu e-posta, SMTP yapılandırmanızın doğru çalıştığını doğrulamak için gönderildi.</p>
              <p style="color:#64748b;font-size:13px">Gönderim zamanı: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
            </div>
            """;
        await SendAsync(toEmail, "Test", "SMTP Test — Ecom", body, ct);
    }

    private async Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_host) || _host == "smtp.example.com")
        {
            logger.LogInformation("[EMAIL-DEV] To={To} Subject={Subject}", toEmail, subject);
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_fromName, _fromAddress));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();
            var sslOption = _useSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
            await client.ConnectAsync(_host, _port, sslOption, ct);
            if (!string.IsNullOrEmpty(_username))
                await client.AuthenticateAsync(_username, _password, ct);
            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);

            logger.LogInformation("[EMAIL] Sent to={To} Subject={Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[EMAIL] Failed to send email to={To} Subject={Subject}", toEmail, subject);
            throw;
        }
    }

    public async Task SendAlertAsync(IEnumerable<string> toEmails, string subject, string htmlBody, CancellationToken ct = default)
    {
        var emails = toEmails.Where(e => !string.IsNullOrWhiteSpace(e)).Distinct().ToList();
        if (emails.Count == 0) return;
        foreach (var email in emails)
            await SendAsync(email, "Admin", subject, htmlBody, ct);
    }

    private static string FormatPrice(decimal amount) =>
        amount.ToString("C", new System.Globalization.CultureInfo("tr-TR"));
}
