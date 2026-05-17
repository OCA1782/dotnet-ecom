namespace Ecom.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendOrderConfirmationAsync(string toEmail, string toName, string orderNumber, decimal grandTotal, CancellationToken ct = default);
    Task SendPaymentSuccessAsync(string toEmail, string toName, string orderNumber, decimal grandTotal, CancellationToken ct = default);
    Task SendShippingNotificationAsync(string toEmail, string toName, string orderNumber, string cargoCompany, string trackingNumber, string? trackingUrl, CancellationToken ct = default);
    Task SendPasswordResetAsync(string toEmail, string toName, string resetToken, CancellationToken ct = default);
    Task SendEmailVerificationAsync(string toEmail, string toName, string code, CancellationToken ct = default);
    Task SendTestEmailAsync(string toEmail, CancellationToken ct = default);
}
