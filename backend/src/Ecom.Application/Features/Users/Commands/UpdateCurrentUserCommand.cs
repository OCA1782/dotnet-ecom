using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Users.Commands;

public class UpdateCurrentUserCommand : IRequest<Result>
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool CommercialConsent { get; set; }
    public string? AvatarUrl { get; set; }
}

public class UpdateCurrentUserValidator : AbstractValidator<UpdateCurrentUserCommand>
{
    public UpdateCurrentUserValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Surname).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PhoneNumber).MaximumLength(20).When(x => x.PhoneNumber != null);
    }
}

public class UpdateCurrentUserHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateCurrentUserCommand, Result>
{
    public async Task<Result> Handle(UpdateCurrentUserCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken);

        if (user is null) return Result.Failure("Kullanıcı bulunamadı.");

        user.Name = request.Name;
        user.Surname = request.Surname;
        user.PhoneNumber = request.PhoneNumber;
        user.CommercialConsent = request.CommercialConsent;
        if (request.AvatarUrl is not null)
            user.AvatarUrl = request.AvatarUrl;

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
