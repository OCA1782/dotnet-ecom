using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Auth.Commands;

public record ForgotPasswordCommand(string Email) : IRequest<Result>;

public class ForgotPasswordValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}

public class ForgotPasswordHandler(
    IApplicationDbContext db,
    IEmailService emailService
) : IRequestHandler<ForgotPasswordCommand, Result>
{
    public async Task<Result> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive, cancellationToken);

        // Always return success to avoid user enumeration
        if (user is null)
            return Result.Success();

        user.PasswordResetToken = Guid.NewGuid().ToString("N");
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(24);

        await db.SaveChangesAsync(cancellationToken);

        try
        {
            await emailService.SendPasswordResetAsync(
                user.Email,
                $"{user.Name} {user.Surname}",
                user.PasswordResetToken,
                cancellationToken);
        }
        catch { /* email failure should not expose error */ }

        return Result.Success();
    }
}
