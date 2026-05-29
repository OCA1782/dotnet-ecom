using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Auth.Commands;

public record RefreshTokenCommand(string RefreshToken) : IRequest<Result<LoginResult>>;

public class RefreshTokenHandler(
    IApplicationDbContext db,
    IJwtService jwtService,
    IAuditService auditService
) : IRequestHandler<RefreshTokenCommand, Result<LoginResult>>
{
    public async Task<Result<LoginResult>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        var stored = await db.UserRefreshTokens
            .Include(t => t.User).ThenInclude(u => u.Roles)
            .FirstOrDefaultAsync(t => t.Token == request.RefreshToken && !t.IsRevoked, ct);

        if (stored == null || stored.ExpiresAt < DateTime.UtcNow)
            return Result<LoginResult>.Failure("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");

        if (!stored.User.IsActive)
            return Result<LoginResult>.Failure("Hesabınız pasif durumda.");

        // Revoke old token and issue new one
        stored.IsRevoked = true;

        var newToken = new Domain.Entities.UserRefreshToken
        {
            UserId = stored.UserId,
            Token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"),
            ExpiresAt = DateTime.UtcNow.AddDays(30),
        };
        db.UserRefreshTokens.Add(newToken);
        await db.SaveChangesAsync(ct);

        await auditService.LogAsync("TokenRefreshed", "UserRefreshToken", stored.UserId.ToString(),
            newValue: "Oturum yenileme tokeni döndürüldü",
            userId: stored.UserId, cancellationToken: ct);

        var roles = stored.User.Roles.Select(r => r.Role.ToString()).ToList();
        var accessToken = jwtService.GenerateToken(stored.User, roles);

        return Result<LoginResult>.Success(new LoginResult(
            stored.User.Id, stored.User.Name, stored.User.Surname, stored.User.Email,
            accessToken, roles, newToken.Token));
    }
}
