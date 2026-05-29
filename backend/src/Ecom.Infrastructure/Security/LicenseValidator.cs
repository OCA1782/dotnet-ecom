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
        "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnClJAldgT5qV3bN0IXgi" +
        "V/4hNZULZWb7ZxFX2hlpb05CDAejtq9ey+lkyjT0RmFgB653Ts4j5Y2NlwfMyFMI" +
        "Rx2SD039ZC67gIIqc8YAfKEKPzXAjdXP0Hj6eEci2Ilsvsxv86mR2x2TsfO8LZnB" +
        "hr7cVhmB2+0GGBxMilD4st7jW2Ph5AJI3tJrho55TQDkeW8ZdmEq1K25BSbuDA3K" +
        "J0WmV3s/Q77RK52g+9yJXRL4HOyuedNGBAu3/lSJwvYR7tpxlKuuMyaJMLe2fpUp" +
        "Gy4OCRJFXLG/2f3wyR9uGXH3CDMLNFHTN487x5PdnypA9Y48G+euBXruG11/6wua" +
        "+QIDAQAB";

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
