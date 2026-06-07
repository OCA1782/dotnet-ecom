using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Auth.Commands;

public record ResendVerificationCommand(Guid UserId) : IRequest<Result<ResendVerificationResult>>;
public record ResendVerificationResult(bool EmailSent, bool TelegramSent);

public class ResendVerificationCommandHandler(
    IApplicationDbContext db,
    IEmailService emailService,
    ITelegramService telegramService
) : IRequestHandler<ResendVerificationCommand, Result<ResendVerificationResult>>
{
    public async Task<Result<ResendVerificationResult>> Handle(ResendVerificationCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken);

        if (user is null)
            return Result<ResendVerificationResult>.Failure("Kullanıcı bulunamadı.");

        if (user.EmailConfirmed && user.PhoneConfirmed)
            return Result<ResendVerificationResult>.Failure("Hesabınız zaten doğrulanmış.");

        var now = DateTime.UtcNow;
        bool emailSent = false, telegramSent = false;

        if (!user.EmailConfirmed)
        {
            var code = Random.Shared.Next(100_000, 999_999).ToString();
            user.EmailVerificationCode = code;
            user.EmailVerificationCodeExpiry = now.AddHours(24);

            try
            {
                await emailService.SendVerificationReminderAsync(user.Email, user.Name, code, cancellationToken);
                emailSent = true;
            }
            catch { /* log silently */ }
        }

        if (!user.PhoneConfirmed)
        {
            var code = Random.Shared.Next(100_000, 999_999).ToString();
            user.TelegramVerificationCode = code;
            user.TelegramVerificationCodeExpiry = now.AddHours(24);

            try
            {
                await telegramService.SendAsync(
                    $"📱 Telefon doğrulama kodu\nKullanıcı: {user.Name} {user.Surname} ({user.Email})\nKod: {code}\nGeçerlilik: 24 saat",
                    cancellationToken);
                telegramSent = true;
            }
            catch { /* log silently */ }
        }

        await db.SaveChangesAsync(cancellationToken);

        return Result<ResendVerificationResult>.Success(new ResendVerificationResult(emailSent, telegramSent));
    }
}
