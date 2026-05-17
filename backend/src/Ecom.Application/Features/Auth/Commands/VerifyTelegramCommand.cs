using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Auth.Commands;

public record VerifyTelegramCommand(Guid UserId, string Code) : IRequest<Result<VerifyResult>>;

public class VerifyTelegramCommandValidator : AbstractValidator<VerifyTelegramCommand>
{
    public VerifyTelegramCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Code).NotEmpty().Length(6);
    }
}

public class VerifyTelegramCommandHandler(
    IApplicationDbContext db,
    IJwtService jwtService,
    IAuditService auditService
) : IRequestHandler<VerifyTelegramCommand, Result<VerifyResult>>
{
    public async Task<Result<VerifyResult>> Handle(VerifyTelegramCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users.IgnoreQueryFilters()
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null)
            return Result<VerifyResult>.Failure("Kullanıcı bulunamadı.");

        if (user.PhoneConfirmed)
            return Result<VerifyResult>.Success(new VerifyResult(user.EmailConfirmed, true, user.EmailConfirmed ? jwtService.GenerateToken(user, user.Roles.Select(r => r.Role.ToString()).ToArray()) : null, user.Id, user.Name, user.Surname, user.Email));

        if (user.TelegramVerificationCode != request.Code || user.TelegramVerificationCodeExpiry < DateTime.UtcNow)
            return Result<VerifyResult>.Failure("Kod geçersiz veya süresi dolmuş.");

        user.PhoneConfirmed = true;
        user.TelegramVerificationCode = null;
        user.TelegramVerificationCodeExpiry = null;

        await db.SaveChangesAsync(cancellationToken);
        await auditService.LogAsync("VerifyTelegram", "User", user.Id.ToString(), userId: user.Id, cancellationToken: cancellationToken);

        string? token = null;
        if (user.EmailConfirmed)
            token = jwtService.GenerateToken(user, user.Roles.Select(r => r.Role.ToString()).ToArray());

        return Result<VerifyResult>.Success(new VerifyResult(user.EmailConfirmed, true, token, user.Id, user.Name, user.Surname, user.Email));
    }
}
