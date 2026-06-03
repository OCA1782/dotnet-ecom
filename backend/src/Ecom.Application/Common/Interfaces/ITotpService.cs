namespace Ecom.Application.Common.Interfaces;

public interface ITotpService
{
    string GenerateSecret();
    string GetTotpUri(string secret, string email, string issuer);
    bool Verify(string secret, string code);
}
