namespace Ecom.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendOrderConfirmationAsync(string toEmail, string toName, string orderNumber, decimal grandTotal, CancellationToken ct = default);
    Task SendPaymentSuccessAsync(string toEmail, string toName, string orderNumber, decimal grandTotal, CancellationToken ct = default);
    Task SendShippingNotificationAsync(string toEmail, string toName, string orderNumber, string cargoCompany, string trackingNumber, string? trackingUrl, CancellationToken ct = default);
    Task SendPasswordResetAsync(string toEmail, string toName, string resetToken, CancellationToken ct = default);
    Task SendEmailVerificationAsync(string toEmail, string toName, string code, CancellationToken ct = default);
    Task SendTestEmailAsync(string toEmail, CancellationToken ct = default);
    Task SendLowStockAlertAsync(string toEmail, string productName, int availableStock, int criticalLevel, CancellationToken ct = default);
    Task SendLowStockAlertBatchAsync(string toEmail, IReadOnlyList<(string ProductName, int Available, int Critical)> products, CancellationToken ct = default);
    Task SendReviewRejectionAsync(string toEmail, string toName, string productName, string? note, CancellationToken ct = default);
    Task SendContactFormAsync(string toEmail, string fromName, string fromEmail, string message, CancellationToken ct = default);
    Task SendAlertAsync(IEnumerable<string> toEmails, string subject, string htmlBody, CancellationToken ct = default);
    Task SendLicenseAssignmentAsync(string toEmail, string toName, string licenseToken, string viewPassword, string issuer, string expiresAt, CancellationToken ct = default);
    Task SendVerificationReminderAsync(string toEmail, string toName, string code, CancellationToken ct = default);
    Task SendPasswordReminderAsync(string toEmail, string toName, int daysSinceLastChange, CancellationToken ct = default);
}
