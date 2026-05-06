namespace Ecom.Infrastructure.Services;

internal static class EmailTemplates
{
    private static string Wrap(string title, string body) => $"""
        <!DOCTYPE html>
        <html lang="tr">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>{title}</title></head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
            <tr><td align="center">
              <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
                <tr><td style="background:#18181b;padding:24px 32px;">
                  <span style="color:#fff;font-size:20px;font-weight:bold;">Ecom</span>
                </td></tr>
                <tr><td style="padding:32px;">{body}</td></tr>
                <tr><td style="background:#f4f4f5;padding:16px 32px;text-align:center;font-size:12px;color:#71717a;">
                  © 2026 Ecom. Tüm hakları saklıdır.
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """;

    public static string OrderConfirmation(string name, string orderNumber, string grandTotal) =>
        Wrap("Siparişiniz Alındı", $"""
            <h2 style="color:#18181b;margin:0 0 16px;">Merhaba {name},</h2>
            <p style="color:#3f3f46;line-height:1.6;">Siparişiniz başarıyla oluşturuldu. En kısa sürede hazırlanacak.</p>
            <div style="background:#f4f4f5;border-radius:8px;padding:16px 20px;margin:24px 0;">
              <p style="margin:0 0 6px;color:#71717a;font-size:13px;">Sipariş Numarası</p>
              <p style="margin:0;font-size:20px;font-weight:bold;color:#18181b;">{orderNumber}</p>
              <p style="margin:8px 0 0;color:#71717a;font-size:13px;">Toplam Tutar: <strong style="color:#18181b;">{grandTotal}</strong></p>
            </div>
            <p style="color:#3f3f46;line-height:1.6;">Siparişinizi <strong>Hesabım → Siparişlerim</strong> bölümünden takip edebilirsiniz.</p>
        """);

    public static string PaymentSuccess(string name, string orderNumber, string grandTotal) =>
        Wrap("Ödemeniz Onaylandı", $"""
            <h2 style="color:#18181b;margin:0 0 16px;">Merhaba {name},</h2>
            <p style="color:#3f3f46;line-height:1.6;">Ödemeniz başarıyla alındı. Siparişiniz hazırlanmaya başladı.</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:24px 0;">
              <p style="margin:0 0 4px;font-size:13px;color:#16a34a;">✓ Ödeme Onaylandı</p>
              <p style="margin:0;font-size:18px;font-weight:bold;color:#18181b;">{orderNumber}</p>
              <p style="margin:6px 0 0;color:#3f3f46;font-size:13px;">Ödenen Tutar: <strong>{grandTotal}</strong></p>
            </div>
            <p style="color:#3f3f46;line-height:1.6;">Siparişiniz hazırlandıktan sonra kargo bilgileriniz e-posta ile iletilecektir.</p>
        """);

    public static string ShippingNotification(string name, string orderNumber, string cargoCompany, string trackingNumber, string? trackingUrl) =>
        Wrap("Siparişiniz Kargoya Verildi", $"""
            <h2 style="color:#18181b;margin:0 0 16px;">Merhaba {name},</h2>
            <p style="color:#3f3f46;line-height:1.6;">Siparişiniz kargoya verildi! Aşağıdaki bilgilerle takip edebilirsiniz.</p>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin:24px 0;">
              <p style="margin:0 0 8px;color:#1d4ed8;font-size:13px;">📦 Kargo Bilgileri</p>
              <p style="margin:0 0 4px;color:#18181b;font-size:14px;"><strong>Sipariş:</strong> {orderNumber}</p>
              <p style="margin:0 0 4px;color:#18181b;font-size:14px;"><strong>Kargo Firması:</strong> {cargoCompany}</p>
              <p style="margin:0;color:#18181b;font-size:14px;"><strong>Takip No:</strong> {trackingNumber}</p>
            </div>
            {(trackingUrl is not null ? $"<p><a href=\"{trackingUrl}\" style=\"background:#18181b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;\">Kargumu Takip Et</a></p>" : "")}
        """);

    public static string PasswordReset(string name, string resetUrl) =>
        Wrap("Şifre Sıfırlama", $"""
            <h2 style="color:#18181b;margin:0 0 16px;">Merhaba {name},</h2>
            <p style="color:#3f3f46;line-height:1.6;">Şifre sıfırlama talebinizi aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.</p>
            <p style="margin:24px 0;">
              <a href="{resetUrl}" style="background:#18181b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;">Şifremi Sıfırla</a>
            </p>
            <p style="color:#71717a;font-size:13px;line-height:1.6;">Bu bağlantı 24 saat geçerlidir. Eğer bu talebi siz yapmadıysanız bu e-postayı dikkate almayınız.</p>
        """);
}
