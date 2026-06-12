using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Ecom.Infrastructure.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Ecom.Infrastructure.Services;

public class JwtService(IConfiguration configuration, LicenseJwtKey licenseKey) : IJwtService
{
    public string GenerateToken(User user, IEnumerable<string> roles)
    {
        var key         = new SymmetricSecurityKey(licenseKey.Bytes);
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new("userId", user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.GivenName, user.Name),
            new(ClaimTypes.Surname, user.Surname)
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        claims.AddRange(roles.Select(role => new Claim("role", role)));

        if (roles.Any(role => role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase)))
        {
            claims.Add(new Claim("isSuperAdmin", "true"));
        }

        var expireMinutes = int.Parse(configuration["Jwt:ExpireMinutes"] ?? "60");
        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expireMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
