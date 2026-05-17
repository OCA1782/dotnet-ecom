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

    public async Task SendPasswordResetAsync(string toEmail, string toName, string resetToken, CancellationToken ct = default)
    {
        var resetUrl = $"{_resetBaseUrl}?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(toEmail)}";
        var subject = "Şifre Sıfırlama — Ecom";
        var body = EmailTemplates.PasswordReset(toName, resetUrl);
        await SendAsync(toEmail, toName, subject, body, ct);
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
            await client.ConnectAsync(_host, _port, SecureSocketOptions.StartTls, ct);
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

    private static string FormatPrice(decimal amount) =>
        amount.ToString("C", new System.Globalization.CultureInfo("tr-TR"));
}
