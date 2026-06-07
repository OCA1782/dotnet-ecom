using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Auth.Commands;

public record LoginCommand(string Email, string Password, bool RememberMe = false) : IRequest<Result<LoginResult>>;

public record LoginResult(Guid UserId, string Name, string Surname, string Email, string Token, IEnumerable<string> Roles, string? RefreshToken = null, string? AvatarUrl = null, bool RequiresTwoFactor = false);

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginCommandHandler(
    IApplicationDbContext db,
    IPasswordService passwordService,
    IJwtService jwtService,
    IAuditService auditService
) : IRequestHandler<LoginCommand, Result<LoginResult>>
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public async Task<Result<LoginResult>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant(), cancellationToken);

        // Hesap kilitli mi?
        if (user is not null && user.LockoutUntil.HasValue && user.LockoutUntil > DateTime.UtcNow)
        {
            var remaining = (int)Math.Ceiling((user.LockoutUntil.Value - DateTime.UtcNow).TotalMinutes);
            return Result<LoginResult>.Failure($"Hesabınız çok fazla başarısız giriş denemesi nedeniyle {remaining} dakika kilitlendi.");
        }

        if (user is null || !passwordService.Verify(request.Password, user.PasswordHash))
        {
            if (user is not null)
            {
                user.FailedLoginCount++;
                if (user.FailedLoginCount >= MaxFailedAttempts)
                {
                    user.LockoutUntil = DateTime.UtcNow.Add(LockoutDuration);
                    user.FailedLoginCount = 0;
                    await db.SaveChangesAsync(cancellationToken);
                    await auditService.LogAsync("AccountLocked", "User", user.Id.ToString(),
                        newValue: $"Hesap kilitlendi: {MaxFailedAttempts} başarısız deneme",
                        userId: user.Id, cancellationToken: cancellationToken);
                    return Result<LoginResult>.Failure($"Çok fazla başarısız giriş denemesi. Hesabınız {(int)LockoutDuration.TotalMinutes} dakika kilitlendi.");
                }
                await db.SaveChangesAsync(cancellationToken);
            }
            await auditService.LogAsync("LoginFailed", "User",
                entityId: user?.Id.ToString() ?? request.Email,
                newValue: $"Başarısız giriş: {request.Email}",
                userId: user?.Id, cancellationToken: cancellationToken);
            return Result<LoginResult>.Failure("E-posta veya şifre hatalı.");
        }

        if (!user.IsActive)
        {
            await auditService.LogAsync("LoginFailed", "User", user.Id.ToString(),
                newValue: $"Pasif hesap giriş denemesi: {request.Email}",
                userId: user.Id, cancellationToken: cancellationToken);
            return Result<LoginResult>.Failure("Hesabınız pasif durumda. Lütfen destek ile iletişime geçin.");
        }

        // Başarılı giriş — kilitleme sayacını sıfırla
        user.FailedLoginCount = 0;
        user.LockoutUntil = null;

        // 2FA aktifse token vermeden beklet
        if (user.TwoFactorEnabled)
        {
            await db.SaveChangesAsync(cancellationToken);
            return Result<LoginResult>.Success(new LoginResult(
                user.Id, user.Name, user.Surname, user.Email,
                string.Empty, [], null, null, RequiresTwoFactor: true));
        }

        user.LastLoginDate = DateTime.UtcNow;

        string? refreshTokenValue = null;
        if (request.RememberMe)
        {
            var refreshToken = new Domain.Entities.UserRefreshToken
            {
                UserId = user.Id,
                Token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"),
                ExpiresAt = DateTime.UtcNow.AddDays(30),
            };
            db.UserRefreshTokens.Add(refreshToken);
            refreshTokenValue = refreshToken.Token;
        }

        await db.SaveChangesAsync(cancellationToken);

        var roles = user.Roles.Select(r => r.Role.ToString()).ToList();
        await auditService.LogAsync("Login", "User", user.Id.ToString(), userId: user.Id, cancellationToken: cancellationToken);

        var token = jwtService.GenerateToken(user, roles);
        return Result<LoginResult>.Success(new LoginResult(user.Id, user.Name, user.Surname, user.Email, token, roles, refreshTokenValue, user.AvatarUrl));
    }
}
