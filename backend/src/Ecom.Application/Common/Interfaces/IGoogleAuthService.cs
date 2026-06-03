namespace Ecom.Application.Common.Interfaces;

public record GoogleUserInfo(string GoogleId, string Email, string Name, string Surname, string? AvatarUrl);

public interface IGoogleAuthService
{
    Task<GoogleUserInfo?> VerifyIdTokenAsync(string idToken);
}
