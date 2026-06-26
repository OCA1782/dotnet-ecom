using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using System.Text.Json;

namespace Ecom.Infrastructure.Services;

public class EmailService(IConfiguration configuration, ILogger<EmailService> logger, IApplicationDbContext db, IMemoryCache cache) : IEmailService
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
        await SendAsync(toEmail, toName, subject, body, "OrderConfirmation", ct);
    }

    public async Task SendPaymentSuccessAsync(string toEmail, string toName, string orderNumber, decimal grandTotal, CancellationToken ct = default)
    {
        var subject = $"Ödemeniz Onaylandı — {orderNumber}";
        var body = EmailTemplates.PaymentSuccess(toName, orderNumber, FormatPrice(grandTotal));
        await SendAsync(toEmail, toName, subject, body, "PaymentSuccess", ct);
    }

    public async Task SendShippingNotificationAsync(string toEmail, string toName, string orderNumber, string cargoCompany, string trackingNumber, string? trackingUrl, CancellationToken ct = default)
    {
        var subject = $"Siparişiniz Kargoya Verildi — {orderNumber}";
        var body = EmailTemplates.ShippingNotification(toName, orderNumber, cargoCompany, trackingNumber, trackingUrl);
        await SendAsync(toEmail, toName, subject, body, "ShippingNotification", ct);
    }

    public async Task SendEmailVerificationAsync(string toEmail, string toName, string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_host) || _host == "smtp.example.com")
            logger.LogInformation("[EMAIL-DEV] VerificationCode={Code} To={To}", code, toEmail);
        var subject = "E-posta Doğrulama — Ecom";
        var body = EmailTemplates.EmailVerification(toName, code);
        await SendAsync(toEmail, toName, subject, body, "EmailVerification", ct);
    }

    public async Task SendVerificationReminderAsync(string toEmail, string toName, string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_host) || _host == "smtp.example.com")
            logger.LogInformation("[EMAIL-DEV] VerificationReminder Code={Code} To={To}", code, toEmail);
        var subject = "Hesabınızı Doğrulayın — Ecom";
        var body = EmailTemplates.VerificationReminder(toName, code);
        await SendAsync(toEmail, toName, subject, body, "VerificationReminder", ct);
    }

    public async Task SendPasswordReminderAsync(string toEmail, string toName, int daysSinceLastChange, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_host) || _host == "smtp.example.com")
            logger.LogInformation("[EMAIL-DEV] PasswordReminder Days={Days} To={To}", daysSinceLastChange, toEmail);
        var subject = "Şifrenizi Güncelleme Zamanı — Ecom";
        var body = EmailTemplates.PasswordReminder(toName, daysSinceLastChange);
        await SendAsync(toEmail, toName, subject, body, "PasswordReminder", ct);
    }

    public async Task SendPasswordResetAsync(string toEmail, string toName, string resetToken, CancellationToken ct = default)
    {
        var resetUrl = $"{_resetBaseUrl}?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(toEmail)}";
        var subject = "Şifre Sıfırlama — Ecom";
        var body = EmailTemplates.PasswordReset(toName, resetUrl);
        await SendAsync(toEmail, toName, subject, body, "PasswordReset", ct);
    }

    public async Task SendLowStockAlertAsync(string toEmail, string productName, int availableStock, int criticalLevel, CancellationToken ct = default)
    {
        var subject = $"⚠ Kritik Stok Uyarısı: {productName}";
        var body = EmailTemplates.LowStockAlert(productName, availableStock, criticalLevel);
        await SendAsync(toEmail, "Yönetici", subject, body, "LowStockAlert", ct);
    }

    public async Task SendLowStockAlertBatchAsync(string toEmail, IReadOnlyList<(string ProductName, int Available, int Critical)> products, CancellationToken ct = default)
    {
        var subject = $"⚠ Kritik Stok Uyarısı — {products.Count} ürün";
        var body = EmailTemplates.LowStockAlertBatch(products);
        await SendAsync(toEmail, "Yönetici", subject, body, "LowStockAlertBatch", ct,
            new() { ["count"] = products.Count.ToString() });
    }

    public async Task SendReviewRejectionAsync(string toEmail, string toName, string productName, string? note, CancellationToken ct = default)
    {
        var subject = $"Yorumunuz Hakkında Bilgi — {productName}";
        var body = EmailTemplates.ReviewRejection(toName, productName, note);
        await SendAsync(toEmail, toName, subject, body, "ReviewRejection", ct,
            new() { ["toName"] = toName, ["productName"] = productName, ["note"] = note ?? "" });
    }

    public async Task SendContactFormAsync(string toEmail, string fromName, string fromEmail, string message, CancellationToken ct = default)
    {
        var body = EmailTemplates.ContactForm(fromName, fromEmail, message);
        await SendAsync(toEmail, "Admin", $"İletişim Formu — {fromName}", body, "ContactForm", ct,
            new() { ["fromName"] = fromName, ["fromEmail"] = fromEmail, ["message"] = message });
    }

    public async Task SendLicenseAssignmentAsync(string toEmail, string toName, string licenseToken, string viewPassword, string issuer, string expiresAt, CancellationToken ct = default)
    {
        var subject = "Ecom Platform Lisansınız Hazır";
        var body = EmailTemplates.LicenseAssignment(toName, licenseToken, viewPassword, issuer, expiresAt);
        await SendAsync(toEmail, toName, subject, body, "LicenseAssignment", ct);
    }

    public async Task SendTestEmailAsync(string toEmail, CancellationToken ct = default)
    {
        var body = EmailTemplates.TestEmail();
        await SendAsync(toEmail, "Test", "SMTP Test — Ecom", body, "TestEmail", ct);
    }

    public async Task SendAlertAsync(IEnumerable<string> toEmails, string subject, string htmlBody, CancellationToken ct = default)
    {
        var emails = toEmails.Where(e => !string.IsNullOrWhiteSpace(e)).Distinct().ToList();
        if (emails.Count == 0) return;
        foreach (var email in emails)
            await SendAsync(email, "Admin", subject, htmlBody, "Alert", ct);
    }

    private async Task SendAsync(string toEmail, string toName, string subject, string htmlBody, string templateName, CancellationToken ct, Dictionary<string, string>? vars = null)
    {
        // Apply DB template overrides (from/subject/cc/bcc/body), cached 5 min
        var tpl = await GetTemplateAsync(templateName);
        if (tpl is not null)
        {
            if (!tpl.IsEnabled)
            {
                logger.LogInformation("[EMAIL] Template {Name} disabled — skipped", templateName);
                return;
            }
            var fromName    = string.IsNullOrWhiteSpace(tpl.FromName)    ? _fromName    : tpl.FromName;
            var fromAddress = string.IsNullOrWhiteSpace(tpl.FromAddress) ? _fromAddress : tpl.FromAddress;
            var effectiveSubject = string.IsNullOrWhiteSpace(tpl.Subject) ? subject : tpl.Subject;
            var effectiveBody    = string.IsNullOrWhiteSpace(tpl.BodyHtml) ? htmlBody : tpl.BodyHtml;

            if (vars is not null)
            {
                foreach (var (k, v) in vars)
                {
                    effectiveSubject = effectiveSubject.Replace($"{{{{{k}}}}}", v);
                    effectiveBody    = effectiveBody.Replace($"{{{{{k}}}}}", v);
                }
            }

            await SendCoreAsync(toEmail, toName, effectiveSubject, effectiveBody, templateName, fromName, fromAddress, tpl.CcEmails, tpl.BccEmails, ct);
            return;
        }

        await SendCoreAsync(toEmail, toName, subject, htmlBody, templateName, _fromName, _fromAddress, "", "", ct);
    }

    private async Task<MailTemplate?> GetTemplateAsync(string name)
    {
        var cacheKey = $"mailtemplate:{name}";
        if (cache.TryGetValue(cacheKey, out MailTemplate? cached)) return cached;
        var tpl = await db.MailTemplates.AsNoTracking().FirstOrDefaultAsync(t => t.Name == name);
        cache.Set(cacheKey, tpl, TimeSpan.FromMinutes(5));
        return tpl;
    }

    private async Task SendCoreAsync(string toEmail, string toName, string subject, string htmlBody, string templateName,
        string fromName, string fromAddress, string ccEmails, string bccEmails, CancellationToken ct)
    {
        var isDevMode = string.IsNullOrWhiteSpace(_host) || _host == "smtp.example.com";

        if (isDevMode)
        {
            logger.LogInformation("[EMAIL-DEV] To={To} Subject={Subject}", toEmail, subject);
            await TryLogAsync(toEmail, toName, subject, templateName, true, true, null);
            return;
        }

        bool isSuccess = false;
        string? errorMessage = null;

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromAddress));
            message.To.Add(new MailboxAddress(toName, toEmail));

            foreach (var cc in ccEmails.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                message.Cc.Add(MailboxAddress.Parse(cc));
            foreach (var bcc in bccEmails.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                message.Bcc.Add(MailboxAddress.Parse(bcc));

            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();
            var sslOption = _useSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
            await client.ConnectAsync(_host, _port, sslOption, ct);
            if (!string.IsNullOrEmpty(_username))
                await client.AuthenticateAsync(_username, _password, ct);
            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);

            isSuccess = true;
            logger.LogInformation("[EMAIL] Sent to={To} Subject={Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            errorMessage = ex.Message;
            logger.LogError(ex, "[EMAIL] Failed to send email to={To} Subject={Subject}", toEmail, subject);
            throw;
        }
        finally
        {
            await TryLogAsync(toEmail, toName, subject, templateName, isSuccess, false, errorMessage);
        }
    }

    private async Task TryLogAsync(string toEmail, string toName, string subject, string templateName, bool isSuccess, bool isDevMode, string? errorMessage)
    {
        try
        {
            db.MailLogs.Add(new MailLog
            {
                ToEmail = toEmail,
                ToName = toName,
                Subject = subject,
                TemplateName = templateName,
                IsSuccess = isSuccess,
                IsDevMode = isDevMode,
                ErrorMessage = errorMessage,
            });
            await db.SaveChangesAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[EMAIL-LOG] Failed to save mail log for To={To}", toEmail);
        }
    }

    private static string FormatPrice(decimal amount) =>
        amount.ToString("C", new System.Globalization.CultureInfo("tr-TR"));
}
