using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Users.Commands;

public class ChangePasswordCommand : IRequest<Result>
{
    public Guid UserId { get; set; }
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class ChangePasswordValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty().WithMessage("Mevcut şifre zorunludur.");
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Yeni şifre zorunludur.")
            .MinimumLength(8).WithMessage("Yeni şifre en az 8 karakter olmalıdır.")
            .Matches("[A-Z]").WithMessage("Yeni şifre en az 1 büyük harf içermelidir.")
            .Matches("[0-9]").WithMessage("Yeni şifre en az 1 rakam içermelidir.");
        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.NewPassword).WithMessage("Şifreler eşleşmiyor.");
    }
}

public class ChangePasswordHandler(IApplicationDbContext db, IPasswordService passwordService)
    : IRequestHandler<ChangePasswordCommand, Result>
{
    public async Task<Result> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken);

        if (user is null) return Result.Failure("Kullanıcı bulunamadı.");

        if (!passwordService.Verify(request.CurrentPassword, user.PasswordHash))
            return Result.Failure("Mevcut şifre yanlış.");

        if (passwordService.Verify(request.NewPassword, user.PasswordHash))
            return Result.Failure("Yeni şifre mevcut şifreyle aynı olamaz.");

        user.PasswordHash = passwordService.Hash(request.NewPassword);
        user.LastPasswordChangeDate = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
