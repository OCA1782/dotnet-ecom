using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Ecom.Infrastructure.Security;

public sealed record LicenseInfo(
    string AppId,
    string Issuer,
    DateOnly NotBefore,
    DateOnly ExpiresAt,
    string? Host,
    string PayloadRaw
);

public static class LicenseValidator
{
    private const string JwtSalt = "ecom-jwt-signing-salt-v1-2026";

    // Public key ortam değişkeninden okunur — kaynak kodda saklanmaz.
    // ECOM_PUBLIC_KEY: RSA-2048 SPKI DER base64 formatı (PEM başlıkları olmadan).
    private static string GetPublicKey() =>
        Environment.GetEnvironmentVariable("ECOM_PUBLIC_KEY")
        ?? throw new LicenseException(
            "ECOM_PUBLIC_KEY ortam değişkeni tanımlı değil. " +
            "Lisans public anahtarı olmadan uygulama başlatılamaz.");

    public static LicenseInfo Validate(string licenseToken)
    {
        if (string.IsNullOrWhiteSpace(licenseToken))
            throw new LicenseException("Lisans anahtarı eksik.");

        var parts = licenseToken.Trim().Split('.');
        if (parts.Length != 2)
            throw new LicenseException("Lisans formatı geçersiz.");

        byte[] payloadBytes, signatureBytes;
        try
        {
            payloadBytes   = FromBase64Url(parts[0]);
            signatureBytes = FromBase64Url(parts[1]);
        }
        catch
        {
            throw new LicenseException("Lisans kodu çözümlenemedi.");
        }

        using var rsa = RSA.Create();
        try
        {
            rsa.ImportSubjectPublicKeyInfo(Convert.FromBase64String(GetPublicKey()), out _);
        }
        catch (LicenseException) { throw; }
        catch
        {
            throw new LicenseException("ECOM_PUBLIC_KEY geçersiz formatta. SPKI DER base64 olmalıdır.");
        }

        bool valid = rsa.VerifyData(payloadBytes, signatureBytes,
            HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

        if (!valid)
            throw new LicenseException("Lisans imzası doğrulanamadı. Geçersiz veya değiştirilmiş lisans.");

        string payloadJson;
        try { payloadJson = Encoding.UTF8.GetString(payloadBytes); }
        catch { throw new LicenseException("Lisans içeriği okunamadı."); }

        JsonElement root;
        try { root = JsonDocument.Parse(payloadJson).RootElement; }
        catch { throw new LicenseException("Lisans içeriği JSON formatında değil."); }

        var app    = root.GetProperty("app").GetString() ?? "";
        var iss    = root.GetProperty("iss").GetString() ?? "";
        var nbfStr = root.GetProperty("nbf").GetString() ?? "";
        var expStr = root.GetProperty("exp").GetString() ?? "";

        if (app != "Ecom")
            throw new LicenseException($"Lisans bu uygulamaya ait değil (app={app}).");

        DateOnly nbf, exp;
        try { nbf = DateOnly.Parse(nbfStr); exp = DateOnly.Parse(expStr); }
        catch { throw new LicenseException("Lisans tarih alanları geçersiz."); }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (today < nbf)
            throw new LicenseException($"Lisans henüz geçerli değil. Başlangıç: {nbf:yyyy-MM-dd}");

        if (today > exp)
            throw new LicenseException($"Lisans süresi dolmuş ({exp:yyyy-MM-dd}). Yenileme için geliştirici ile iletişime geçin.");

        // ── Host doğrulama ────────────────────────────────────────────────────
        // Lisans payload'ında "host" alanı varsa, bu sunucuda çalışıp çalışmadığı kontrol edilir.
        string? licHost = null;
        if (root.TryGetProperty("host", out var hostEl))
            licHost = hostEl.GetString();

        if (!string.IsNullOrWhiteSpace(licHost))
        {
            var currentHostname = Dns.GetHostName();
            var currentIps = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            try
            {
                foreach (var ip in Dns.GetHostAddresses(currentHostname))
                    currentIps.Add(ip.ToString());
            }
            catch { /* DNS çözümlenemezse IP listesi boş kalır */ }

            bool hostMatch =
                string.Equals(licHost, currentHostname, StringComparison.OrdinalIgnoreCase) ||
                currentIps.Contains(licHost) ||
                licHost is "localhost" or "127.0.0.1" or "::1";

            if (!hostMatch)
                throw new LicenseException(
                    $"Lisans bu sunucuya ait değil. " +
                    $"Beklenen host: '{licHost}', Mevcut: '{currentHostname}'. " +
                    $"Bu sunucu için yeni lisans üretilmesi gerekir.");
        }
        // ─────────────────────────────────────────────────────────────────────

        return new LicenseInfo(app, iss, nbf, exp, licHost, payloadJson);
    }

    public static byte[] DeriveJwtKey(LicenseInfo license)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(JwtSalt));
        return hmac.ComputeHash(Encoding.UTF8.GetBytes(license.PayloadRaw));
    }

    // Aktivasyon sunucusuna gönderilen hash — token'ın kendisi değil, SHA-256'sı iletilir.
    public static string ComputeActivationHash(string licenseToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(licenseToken.Trim()));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static string MaskToken(string token)
    {
        if (string.IsNullOrEmpty(token)) return "****";
        var dotIdx = token.IndexOf('.');
        if (dotIdx < 0) return token.Length <= 12 ? new string('*', token.Length) : token[..6] + "···";
        var header = token[..dotIdx];
        return header.Length <= 12 ? header + ".***" : header[..10] + "···" + ".***";
    }

    private static byte[] FromBase64Url(string s)
    {
        s = s.Replace('-', '+').Replace('_', '/');
        switch (s.Length % 4) {
            case 2: s += "=="; break;
            case 3: s += "=";  break;
        }
        return Convert.FromBase64String(s);
    }
}

public sealed class LicenseException(string message) : Exception(message);
