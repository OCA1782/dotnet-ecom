using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Auth.Commands;

public record GoogleLoginCommand(string IdToken) : IRequest<Result<LoginResult>>;

public class GoogleLoginCommandValidator : AbstractValidator<GoogleLoginCommand>
{
    public GoogleLoginCommandValidator()
    {
        RuleFor(x => x.IdToken).NotEmpty();
    }
}

public class GoogleLoginCommandHandler(
    IApplicationDbContext db,
    IJwtService jwtService,
    IGoogleAuthService googleAuthService,
    IAuditService auditService
) : IRequestHandler<GoogleLoginCommand, Result<LoginResult>>
{
    public async Task<Result<LoginResult>> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        var googleUser = await googleAuthService.VerifyIdTokenAsync(request.IdToken);
        if (googleUser is null)
            return Result<LoginResult>.Failure("Geçersiz Google kimlik bilgisi.");

        var user = await db.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.GoogleId == googleUser.GoogleId || u.Email == googleUser.Email, cancellationToken);

        if (user is null)
        {
            // Yeni kullanıcı oluştur
            user = new Domain.Entities.User
            {
                Name = googleUser.Name,
                Surname = googleUser.Surname,
                Email = googleUser.Email.ToLowerInvariant(),
                GoogleId = googleUser.GoogleId,
                PasswordHash = Guid.NewGuid().ToString("N"), // Google kullanıcıları şifre ile giriş yapamaz
                IsActive = true,
                EmailConfirmed = true,
                KvkkConsent = true,
                KvkkConsentDate = DateTime.UtcNow,
                AvatarUrl = googleUser.AvatarUrl,
                LastLoginDate = DateTime.UtcNow,
            };
            user.Roles.Add(new Domain.Entities.UserRole { Role = Domain.Enums.UserRole.Customer });
            db.Users.Add(user);
        }
        else
        {
            if (!user.IsActive)
                return Result<LoginResult>.Failure("Hesabınız pasif durumda.");
            if (user.GoogleId is null)
                user.GoogleId = googleUser.GoogleId;
            if (googleUser.AvatarUrl is not null && user.AvatarUrl is null)
                user.AvatarUrl = googleUser.AvatarUrl;
            user.LastLoginDate = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        await auditService.LogAsync("GoogleLogin", "User", user.Id.ToString(), userId: user.Id, cancellationToken: cancellationToken);

        if (user.TwoFactorEnabled)
            return Result<LoginResult>.Success(new LoginResult(
                user.Id, user.Name, user.Surname, user.Email,
                string.Empty, [], null, null, RequiresTwoFactor: true));

        var roles = user.Roles.Select(r => r.Role.ToString()).ToList();
        var token = jwtService.GenerateToken(user, roles);
        return Result<LoginResult>.Success(new LoginResult(user.Id, user.Name, user.Surname, user.Email, token, roles, AvatarUrl: user.AvatarUrl));
    }
}
