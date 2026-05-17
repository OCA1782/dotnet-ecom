using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Auth.Commands;

public record VerifyEmailCommand(Guid UserId, string Code) : IRequest<Result<VerifyResult>>;

public class VerifyEmailCommandValidator : AbstractValidator<VerifyEmailCommand>
{
    public VerifyEmailCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Code).NotEmpty().Length(6);
    }
}

public class VerifyEmailCommandHandler(
    IApplicationDbContext db,
    IJwtService jwtService,
    IAuditService auditService
) : IRequestHandler<VerifyEmailCommand, Result<VerifyResult>>
{
    public async Task<Result<VerifyResult>> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users.IgnoreQueryFilters()
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null)
            return Result<VerifyResult>.Failure("Kullanıcı bulunamadı.");

        if (user.EmailConfirmed)
            return Result<VerifyResult>.Success(new VerifyResult(true, user.PhoneConfirmed, user.PhoneConfirmed ? jwtService.GenerateToken(user, user.Roles.Select(r => r.Role.ToString()).ToArray()) : null, user.Id, user.Name, user.Surname, user.Email));

        if (user.EmailVerificationCode != request.Code || user.EmailVerificationCodeExpiry < DateTime.UtcNow)
            return Result<VerifyResult>.Failure("Kod geçersiz veya süresi dolmuş.");

        user.EmailConfirmed = true;
        user.EmailVerificationCode = null;
        user.EmailVerificationCodeExpiry = null;

        await db.SaveChangesAsync(cancellationToken);
        await auditService.LogAsync("VerifyEmail", "User", user.Id.ToString(), userId: user.Id, cancellationToken: cancellationToken);

        string? token = null;
        if (user.PhoneConfirmed)
            token = jwtService.GenerateToken(user, user.Roles.Select(r => r.Role.ToString()).ToArray());

        return Result<VerifyResult>.Success(new VerifyResult(true, user.PhoneConfirmed, token, user.Id, user.Name, user.Surname, user.Email));
    }
}
