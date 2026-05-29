using System.Security.Cryptography;
using System.Text;

namespace Ecom.Infrastructure.Security;

public static class CryptoHelper
{
    public static string Encrypt(string plaintext, string pepper)
    {
        var key = SHA256.HashData(Encoding.UTF8.GetBytes(pepper));
        using var aes = Aes.Create();
        aes.Key = key;
        aes.GenerateIV();
        using var enc = aes.CreateEncryptor();
        var data = Encoding.UTF8.GetBytes(plaintext);
        var encrypted = enc.TransformFinalBlock(data, 0, data.Length);
        var combined = new byte[aes.IV.Length + encrypted.Length];
        aes.IV.CopyTo(combined, 0);
        encrypted.CopyTo(combined, aes.IV.Length);
        return Convert.ToBase64String(combined);
    }

    public static string? Decrypt(string ciphertext, string pepper)
    {
        try
        {
            var data = Convert.FromBase64String(ciphertext);
            if (data.Length < 17) return null;
            var key = SHA256.HashData(Encoding.UTF8.GetBytes(pepper));
            using var aes = Aes.Create();
            aes.Key = key;
            aes.IV = data[..16];
            using var dec = aes.CreateDecryptor();
            var plain = dec.TransformFinalBlock(data, 16, data.Length - 16);
            return Encoding.UTF8.GetString(plain);
        }
        catch { return null; }
    }

    public static string Hash(string input) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input))).ToLowerInvariant();

    public static string MaskKey(string key)
    {
        if (string.IsNullOrEmpty(key)) return "****";
        if (key.Length <= 8) return new string('*', key.Length);
        return key[..4] + new string('*', key.Length - 8) + key[^4..];
    }
}
