using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UserRoleEntity = Ecom.Domain.Entities.UserRole;
using UserRoleEnum = Ecom.Domain.Enums.UserRole;

namespace Ecom.Application.Features.Auth.Commands;

public record RegisterCommand(
    string Name,
    string Surname,
    string Email,
    string Password,
    string? PhoneNumber,
    bool KvkkConsent,
    bool CommercialConsent
) : IRequest<Result<RegisterResult>>;

public record RegisterResult(Guid UserId, string Name, string Surname, string Email);

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Surname).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(100);
        RuleFor(x => x.KvkkConsent).Equal(true).WithMessage("KVKK onayı zorunludur.");
    }
}

public class RegisterCommandHandler(
    IApplicationDbContext db,
    IPasswordService passwordService,
    IAuditService auditService,
    IEmailService emailService,
    ITelegramService telegramService
) : IRequestHandler<RegisterCommand, Result<RegisterResult>>
{
    public async Task<Result<RegisterResult>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var emailExists = await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == request.Email.ToLowerInvariant(), cancellationToken);
        if (emailExists)
            return Result<RegisterResult>.Failure("Bu e-posta adresi zaten kayıtlı.");

        var emailCode = GenerateCode();
        var telegramCode = GenerateCode();
        var expiry = DateTime.UtcNow.AddMinutes(10);

        var user = new User
        {
            Name = request.Name,
            Surname = request.Surname,
            Email = request.Email.ToLowerInvariant(),
            PhoneNumber = request.PhoneNumber,
            PasswordHash = passwordService.Hash(request.Password),
            KvkkConsent = request.KvkkConsent,
            CommercialConsent = request.CommercialConsent,
            KvkkConsentDate = request.KvkkConsent ? DateTime.UtcNow : null,
            EmailVerificationCode = emailCode,
            EmailVerificationCodeExpiry = expiry,
            TelegramVerificationCode = telegramCode,
            TelegramVerificationCodeExpiry = expiry
        };

        var customerRole = new UserRoleEntity
        {
            UserId = user.Id,
            Role = UserRoleEnum.Customer
        };
        user.Roles.Add(customerRole);

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync("Register", "User", user.Id.ToString(), userId: user.Id, cancellationToken: cancellationToken);

        try { await emailService.SendEmailVerificationAsync(user.Email, user.Name, emailCode, cancellationToken); } catch { }
        try { await telegramService.SendAsync($"Ecom Doğrulama — Merhaba {user.Name}, Telegram doğrulama kodunuz: {telegramCode} (10 dakika geçerlidir)", cancellationToken); } catch { }

        return Result<RegisterResult>.Success(new RegisterResult(user.Id, user.Name, user.Surname, user.Email));
    }

    private static string GenerateCode() =>
        Random.Shared.Next(100000, 999999).ToString();
}
