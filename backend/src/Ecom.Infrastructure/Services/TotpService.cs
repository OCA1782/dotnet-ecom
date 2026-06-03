using Ecom.Application.Common.Interfaces;
using OtpNet;

namespace Ecom.Infrastructure.Services;

public class TotpService : ITotpService
{
    public string GenerateSecret()
    {
        var secretBytes = KeyGeneration.GenerateRandomKey(20);
        return Base32Encoding.ToString(secretBytes);
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
            var secretBytes = Base32Encoding.ToBytes(secret);
            var totp = new Totp(secretBytes);
            return totp.VerifyTotp(code, out _, new VerificationWindow(previous: 1, future: 1));
        }
        catch
        {
            return false;
        }
    }
}
