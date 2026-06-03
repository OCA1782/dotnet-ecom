using Ecom.Application.Common.Interfaces;
using System.Security.Cryptography;

namespace Ecom.Infrastructure.Services;

public class TotpService : ITotpService
{
    private const string Base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    public string GenerateSecret()
    {
        var bytes = RandomNumberGenerator.GetBytes(20);
        return ToBase32(bytes);
    }

    public string GetTotpUri(string secret, string email, string issuer)
    {
        var encodedIssuer = Uri.EscapeDataString(issuer);
        var encodedAccount = Uri.EscapeDataString(email);
        return $"otpauth://totp/{encodedIssuer}:{encodedAccount}?secret={secret}&issuer={encodedIssuer}&algorithm=SHA1&digits=6&period=30";
    }

    public bool Verify(string secret, string code)
    {
        try
        {
            var secretBytes = FromBase32(secret);
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            // check current window ± 1 step (30s each)
            for (int delta = -1; delta <= 1; delta++)
            {
                var step = (now / 30) + delta;
                if (ComputeTotp(secretBytes, step) == code) return true;
            }
            return false;
        }
        catch { return false; }
    }

    private static string ComputeTotp(byte[] secret, long step)
    {
        var stepBytes = BitConverter.GetBytes(step);
        if (BitConverter.IsLittleEndian) Array.Reverse(stepBytes);

        using var hmac = new HMACSHA1(secret);
        var hash = hmac.ComputeHash(stepBytes);

        int offset = hash[^1] & 0x0F;
        int code = ((hash[offset] & 0x7F) << 24)
                 | ((hash[offset + 1] & 0xFF) << 16)
                 | ((hash[offset + 2] & 0xFF) << 8)
                 | (hash[offset + 3] & 0xFF);

        return (code % 1_000_000).ToString("D6");
    }

    private static string ToBase32(byte[] data)
    {
        var sb = new System.Text.StringBuilder();
        int buffer = 0, bitsLeft = 0;
        foreach (var b in data)
        {
            buffer = (buffer << 8) | b;
            bitsLeft += 8;
            while (bitsLeft >= 5)
            {
                bitsLeft -= 5;
                sb.Append(Base32Chars[(buffer >> bitsLeft) & 0x1F]);
            }
        }
        if (bitsLeft > 0) sb.Append(Base32Chars[(buffer << (5 - bitsLeft)) & 0x1F]);
        return sb.ToString();
    }

    private static byte[] FromBase32(string input)
    {
        input = input.TrimEnd('=').ToUpperInvariant();
        var output = new byte[input.Length * 5 / 8];
        int buffer = 0, bitsLeft = 0, idx = 0;
        foreach (var c in input)
        {
            int val = Base32Chars.IndexOf(c);
            if (val < 0) throw new FormatException("Invalid base32");
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8)
            {
                bitsLeft -= 8;
                output[idx++] = (byte)((buffer >> bitsLeft) & 0xFF);
            }
        }
        return output;
    }
}
