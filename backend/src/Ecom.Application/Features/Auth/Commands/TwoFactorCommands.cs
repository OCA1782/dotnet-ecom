using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Auth.Commands;

// ── Setup: Secret üret, QR URI döndür ───────────────────────────────────────

public record Setup2FACommand : IRequest<Result<Setup2FAResult>>;
public record Setup2FAResult(string Secret, string TotpUri);

public class Setup2FACommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITotpService totpService
) : IRequestHandler<Setup2FACommand, Result<Setup2FAResult>>
{
    public async Task<Result<Setup2FAResult>> Handle(Setup2FACommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users.FindAsync([currentUser.UserId!.Value], cancellationToken);
        if (user is null) return Result<Setup2FAResult>.Failure("Kullanıcı bulunamadı.");

        var secret = totpService.GenerateSecret();
        user.TwoFactorSecret = secret;
        await db.SaveChangesAsync(cancellationToken);

        var totpUri = totpService.GetTotpUri(secret, user.Email, "Ecom");
        return Result<Setup2FAResult>.Success(new Setup2FAResult(secret, totpUri));
    }
}

// ── Enable: Kodu doğrula ve 2FA'yı etkinleştir ──────────────────────────────

public record Enable2FACommand(string Code) : IRequest<Result<bool>>;

public class Enable2FACommandValidator : AbstractValidator<Enable2FACommand>
{
    public Enable2FACommandValidator()
    {
        RuleFor(x => x.Code).NotEmpty().Length(6).Matches(@"^\d{6}$");
    }
}

public class Enable2FACommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITotpService totpService,
    IAuditService auditService
) : IRequestHandler<Enable2FACommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(Enable2FACommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users.FindAsync([currentUser.UserId!.Value], cancellationToken);
        if (user is null) return Result<bool>.Failure("Kullanıcı bulunamadı.");
        if (string.IsNullOrEmpty(user.TwoFactorSecret))
            return Result<bool>.Failure("Önce 2FA kurulumunu başlatın.");

        if (!totpService.Verify(user.TwoFactorSecret, request.Code))
            return Result<bool>.Failure("Geçersiz doğrulama kodu. Lütfen tekrar deneyin.");

        user.TwoFactorEnabled = true;
        await db.SaveChangesAsync(cancellationToken);
        await auditService.LogAsync("2FAEnabled", "User", user.Id.ToString(), userId: user.Id, cancellationToken: cancellationToken);
        return Result<bool>.Success(true);
    }
}

// ── Disable: Kodu doğrula ve 2FA'yı devre dışı bırak ───────────────────────

public record Disable2FACommand(string Code) : IRequest<Result<bool>>;

public class Disable2FACommandValidator : AbstractValidator<Disable2FACommand>
{
    public Disable2FACommandValidator()
    {
        RuleFor(x => x.Code).NotEmpty().Length(6).Matches(@"^\d{6}$");
    }
}

public class Disable2FACommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITotpService totpService,
    IAuditService auditService
) : IRequestHandler<Disable2FACommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(Disable2FACommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users.FindAsync([currentUser.UserId!.Value], cancellationToken);
        if (user is null) return Result<bool>.Failure("Kullanıcı bulunamadı.");
        if (!user.TwoFactorEnabled)
            return Result<bool>.Failure("2FA zaten devre dışı.");
        if (!totpService.Verify(user.TwoFactorSecret!, request.Code))
            return Result<bool>.Failure("Geçersiz doğrulama kodu.");

        user.TwoFactorEnabled = false;
        user.TwoFactorSecret = null;
        await db.SaveChangesAsync(cancellationToken);
        await auditService.LogAsync("2FADisabled", "User", user.Id.ToString(), userId: user.Id, cancellationToken: cancellationToken);
        return Result<bool>.Success(true);
    }
}

// ── Login step 2: TOTP kodu doğrula, JWT ver ────────────────────────────────

public record TwoFactorLoginCommand(Guid UserId, string Code, bool RememberMe = false) : IRequest<Result<LoginResult>>;

public class TwoFactorLoginCommandValidator : AbstractValidator<TwoFactorLoginCommand>
{
    public TwoFactorLoginCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Code).NotEmpty().Length(6).Matches(@"^\d{6}$");
    }
}

public class TwoFactorLoginCommandHandler(
    IApplicationDbContext db,
    IJwtService jwtService,
    ITotpService totpService,
    IAuditService auditService
) : IRequestHandler<TwoFactorLoginCommand, Result<LoginResult>>
{
    public async Task<Result<LoginResult>> Handle(TwoFactorLoginCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null || !user.TwoFactorEnabled || string.IsNullOrEmpty(user.TwoFactorSecret))
            return Result<LoginResult>.Failure("Geçersiz istek.");

        if (!totpService.Verify(user.TwoFactorSecret, request.Code))
        {
            await auditService.LogAsync("2FAFailed", "User", user.Id.ToString(), userId: user.Id, cancellationToken: cancellationToken);
            return Result<LoginResult>.Failure("Geçersiz doğrulama kodu.");
        }

        string? refreshTokenValue = null;
        if (request.RememberMe)
        {
            var rt = new Domain.Entities.UserRefreshToken
            {
                UserId = user.Id,
                Token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"),
                ExpiresAt = DateTime.UtcNow.AddDays(30),
            };
            db.UserRefreshTokens.Add(rt);
            refreshTokenValue = rt.Token;
        }

        user.LastLoginDate = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await auditService.LogAsync("2FALogin", "User", user.Id.ToString(), userId: user.Id, cancellationToken: cancellationToken);

        var roles = user.Roles.Select(r => r.Role.ToString()).ToList();
        var token = jwtService.GenerateToken(user, roles);
        return Result<LoginResult>.Success(new LoginResult(user.Id, user.Name, user.Surname, user.Email, token, roles, refreshTokenValue, user.AvatarUrl));
    }
}
