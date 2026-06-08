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

    public static string EmailVerification(string name, string code) =>
        Wrap("E-posta Doğrulama", $"""
            <h2 style="color:#18181b;margin:0 0 16px;">Merhaba {name},</h2>
            <p style="color:#3f3f46;line-height:1.6;">Hesabınızı doğrulamak için aşağıdaki kodu kullanın. Kod 10 dakika geçerlidir.</p>
            <div style="background:#f4f4f5;border-radius:8px;padding:28px;margin:24px 0;text-align:center;">
              <p style="margin:0 0 10px;color:#71717a;font-size:13px;">E-posta Doğrulama Kodunuz</p>
              <p style="margin:0;font-size:40px;font-weight:bold;color:#18181b;letter-spacing:10px;">{code}</p>
            </div>
            <p style="color:#71717a;font-size:13px;">Bu kodu siz talep etmediyseniz bu e-postayı görmezden gelebilirsiniz.</p>
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

    public static string VerificationReminder(string name, string code) =>
        Wrap("Hesabınızı Doğrulayın", $"""
            <h2 style="color:#18181b;margin:0 0 16px;">Merhaba {name},</h2>
            <p style="color:#3f3f46;line-height:1.6;">Henüz e-posta adresinizi doğrulamadınız. Aşağıdaki kodu kullanarak hesabınızı doğrulayabilirsiniz.</p>
            <div style="background:#f4f4f5;border-radius:8px;padding:28px;margin:24px 0;text-align:center;">
              <p style="margin:0 0 10px;color:#71717a;font-size:13px;">E-posta Doğrulama Kodunuz</p>
              <p style="margin:0;font-size:40px;font-weight:bold;color:#18181b;letter-spacing:10px;">{code}</p>
              <p style="margin:12px 0 0;color:#71717a;font-size:12px;">Kod 24 saat geçerlidir.</p>
            </div>
            <p style="color:#3f3f46;line-height:1.6;">Hesabım → Hesap Doğrulama bölümünden bu kodu girerek doğrulama yapabilirsiniz.</p>
            <p style="color:#71717a;font-size:13px;">Bu e-postayı beklemiyorsanız dikkate almayınız.</p>
        """);

    public static string LowStockAlertBatch(IReadOnlyList<(string ProductName, int Available, int Critical)> products)
    {
        var rows = string.Join("\n", products.Select((p, i) => $"""
              <tr style="background:{(i % 2 == 0 ? "#fff" : "#fafafa")};">
                <td style="padding:10px 14px;font-size:13px;color:#18181b;border-bottom:1px solid #f0f0f0;">{System.Net.WebUtility.HtmlEncode(p.ProductName)}</td>
                <td style="padding:10px 14px;text-align:center;font-size:13px;font-weight:bold;color:#b91c1c;border-bottom:1px solid #f0f0f0;">{p.Available}</td>
                <td style="padding:10px 14px;text-align:center;font-size:13px;color:#71717a;border-bottom:1px solid #f0f0f0;">{p.Critical}</td>
              </tr>
            """));

        return Wrap("Kritik Stok Uyarısı", $"""
            <h2 style="color:#b91c1c;margin:0 0 8px;">⚠ Kritik Stok Uyarısı</h2>
            <p style="color:#3f3f46;line-height:1.6;margin:0 0 20px;">
              Aşağıdaki <strong>{products.Count}</strong> ürünün stoku kritik eşiğin altına düştü.
              Lütfen stok yenileme işlemini gerçekleştirin.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;font-size:13px;">
              <thead>
                <tr style="background:#fef2f2;">
                  <th style="padding:10px 14px;text-align:left;font-size:12px;color:#71717a;font-weight:600;border-bottom:1px solid #e4e4e7;">ÜRÜN ADI</th>
                  <th style="padding:10px 14px;text-align:center;font-size:12px;color:#71717a;font-weight:600;border-bottom:1px solid #e4e4e7;">MEVCUT STOK</th>
                  <th style="padding:10px 14px;text-align:center;font-size:12px;color:#71717a;font-weight:600;border-bottom:1px solid #e4e4e7;">KRİTİK EŞİK</th>
                </tr>
              </thead>
              <tbody>
            {rows}
              </tbody>
            </table>
            <p style="color:#71717a;font-size:12px;margin:16px 0 0;">
              Bu uyarı otomatik olarak oluşturulmuştur. Yeni ürünler kritik eşiği aştığında tekrar bildirim alacaksınız.
            </p>
            """);
    }

    public static string LowStockAlert(string productName, int availableStock, int criticalLevel) =>
        Wrap("Kritik Stok Uyarısı", $"""
            <h2 style="color:#b91c1c;margin:0 0 16px;">⚠ Kritik Stok Uyarısı</h2>
            <p style="color:#3f3f46;line-height:1.6;">Aşağıdaki ürünün stoku kritik eşiğin altına düştü.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
              <tr style="background:#fef2f2;">
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 6px;font-size:13px;color:#71717a;">Ürün</p>
                  <p style="margin:0;font-size:16px;font-weight:bold;color:#18181b;">{productName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <table width="100%">
                    <tr>
                      <td style="text-align:center;padding:8px;">
                        <p style="margin:0 0 4px;font-size:12px;color:#71717a;">Mevcut Stok</p>
                        <p style="margin:0;font-size:28px;font-weight:bold;color:#b91c1c;">{availableStock}</p>
                      </td>
                      <td style="text-align:center;padding:8px;">
                        <p style="margin:0 0 4px;font-size:12px;color:#71717a;">Kritik Eşik</p>
                        <p style="margin:0;font-size:28px;font-weight:bold;color:#71717a;">{criticalLevel}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <p style="color:#3f3f46;font-size:14px;">Stok yönetimi panelinden yeni stok girişi yapabilirsiniz.</p>
        """);

    public static string LicenseAssignment(string name, string licenseToken, string viewPassword, string issuer, string expiresAt) =>
        Wrap("Lisans Anahtarınız Hazır", $"""
            <h2 style="color:#18181b;margin:0 0 8px;">Merhaba {name},</h2>
            <p style="color:#3f3f46;line-height:1.6;margin:0 0 24px;">
              Size bir Ecom platform lisansı atandı. Aşağıdaki bilgileri güvenli bir yerde saklayın.
            </p>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin:0 0 20px;">
              <p style="margin:0 0 6px;font-size:12px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">✓ Lisans Bilgileri</p>
              <table width="100%" style="font-size:13px;">
                <tr><td style="padding:4px 0;color:#71717a;width:140px;">Yayıncı (Issuer)</td><td style="color:#18181b;font-weight:600;">{issuer}</td></tr>
                <tr><td style="padding:4px 0;color:#71717a;">Son Geçerlilik</td><td style="color:#18181b;font-weight:600;">{expiresAt}</td></tr>
              </table>
            </div>

            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px 24px;margin:0 0 20px;">
              <p style="margin:0 0 10px;font-size:12px;color:#c2410c;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">🔑 Görüntüleme Şifresi</p>
              <p style="margin:0;font-family:monospace;font-size:22px;font-weight:bold;color:#18181b;letter-spacing:.1em;">{viewPassword}</p>
              <p style="margin:8px 0 0;font-size:12px;color:#9a3412;">
                Bu şifreyi Admin Paneli → Yönetim → Lisans sekmesindeki "Aktivasyon" alanında kullanın.
              </p>
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:0 0 24px;">
              <p style="margin:0 0 8px;font-size:12px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">📋 Lisans Token</p>
              <p style="margin:0;font-family:monospace;font-size:11px;color:#0f172a;word-break:break-all;line-height:1.6;">{licenseToken}</p>
            </div>

            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;">
              <p style="margin:0;font-size:12px;color:#b91c1c;line-height:1.6;">
                ⚠ <strong>Güvenlik Uyarısı:</strong> Bu e-postayı üçüncü şahıslarla paylaşmayın.
                Görüntüleme şifrenizi başkasına vermeyin. Token, deployment'ınızda
                <code style="background:#fee2e2;padding:1px 4px;border-radius:3px;">ECOM_LICENSE</code> ortam değişkeni olarak kullanılır.
              </p>
            </div>
        """);

    public static string PasswordReminder(string name, int daysSinceLastChange) =>
        Wrap("Şifrenizi Değiştirme Zamanı", $"""
            <h2 style="color:#18181b;margin:0 0 16px;">Merhaba {name},</h2>
            <p style="color:#3f3f46;line-height:1.6;">
              Hesap güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi öneririz.
              Şifreniz <strong>{daysSinceLastChange} gün</strong> önce belirlendi ve güncelleme zamanı geldi.
            </p>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin:24px 0;">
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                🔐 Şifrenizi değiştirmek için <strong>Hesabım → Güvenlik → Şifremi Değiştir</strong> bölümüne gidin.
              </p>
            </div>
            <p style="color:#71717a;font-size:13px;line-height:1.6;">
              Bu hatırlatma otomatik olarak gönderilmiştir. Şifrenizi zaten değiştirdiyseniz bu e-postayı dikkate almayınız.
            </p>
        """);
}
