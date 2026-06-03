using Ecom.Application.Common.Interfaces;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;

namespace Ecom.Infrastructure.Services;

public class GoogleAuthService(IConfiguration configuration) : IGoogleAuthService
{
    public async Task<GoogleUserInfo?> VerifyIdTokenAsync(string idToken)
    {
        try
        {
            var clientId = configuration["Google:ClientId"];
            var settings = new GoogleJsonWebSignature.ValidationSettings();
            if (!string.IsNullOrEmpty(clientId))
                settings.Audience = [clientId];

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            var nameParts = (payload.Name ?? "").Trim().Split(' ', 2);
            var name = nameParts.Length > 0 ? nameParts[0] : "Google";
            var surname = nameParts.Length > 1 ? nameParts[1] : "Kullanıcı";

            return new GoogleUserInfo(
                GoogleId: payload.Subject,
                Email: payload.Email,
                Name: name,
                Surname: surname,
                AvatarUrl: payload.Picture
            );
        }
        catch
        {
            return null;
        }
    }
}
