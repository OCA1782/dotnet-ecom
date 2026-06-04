using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Ecom.Infrastructure.Security;

public sealed record LicenseInfo(
    string AppId,
    string Issuer,
    DateOnly NotBefore,
    DateOnly ExpiresAt,
    string PayloadRaw
);

public static class LicenseValidator
{
    // RSA-2048 public key — lisans bu anahtara karşılık gelen private key ile imzalanmıştır.
    // Private key olmadan geçerli lisans üretilemez.
    private const string PublicKeyBase64 =
        "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsRnyTFkxwKHQgrj4FU+e" +
        "dm7kPDRAS6QLAkJcw1ntnsc7CCudPJlsqaJ8+xgi5j69VEENsArVHUq2KSyyDF4y" +
        "8c8xTC8sWKIV5vrwv0NyO8qXK1sEGj8tckMqzb2kMvghbrYXj8B45qSAWbbGeSRR" +
        "AVNiYZRdohnhNQ03a//ome2rfOLH468v/HsV7Dslns8cx5hxQHpxIYy7wY5wZhHt" +
        "no8CGDXRZeNgMt7tQzhtrJRxWDArNiIhKl8/dC+6eDxWj2c7ujKupzcYak2/EAAp" +
        "EgmY1yPc7/ACA+VHo6qKXG7mH6d9bvi+2dYnfcJjRSTgC4v0B9RpYzBSzXB55lfN" +
        "qQIDAQAB";

    private const string JwtSalt = "ecom-jwt-signing-salt-v1-2026";

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
        rsa.ImportSubjectPublicKeyInfo(Convert.FromBase64String(PublicKeyBase64), out _);

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

        return new LicenseInfo(app, iss, nbf, exp, payloadJson);
    }

    public static byte[] DeriveJwtKey(LicenseInfo license)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(JwtSalt));
        return hmac.ComputeHash(Encoding.UTF8.GetBytes(license.PayloadRaw));
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
