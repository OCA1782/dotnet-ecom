using Ecom.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Users.Queries;

public record GetCurrentUserQuery(Guid UserId) : IRequest<UserProfileDto?>;

public record UserProfileDto(
    Guid Id,
    string Name,
    string Surname,
    string Email,
    string? PhoneNumber,
    string? AvatarUrl,
    bool CommercialConsent,
    DateTime? LastLoginDate,
    bool TwoFactorEnabled
);

public class GetCurrentUserHandler(IApplicationDbContext db)
    : IRequestHandler<GetCurrentUserQuery, UserProfileDto?>
{
    public async Task<UserProfileDto?> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var u = await db.Users
            .Where(x => x.Id == request.UserId && x.IsActive)
            .Select(x => new UserProfileDto(
                x.Id, x.Name, x.Surname, x.Email, x.PhoneNumber,
                x.AvatarUrl, x.CommercialConsent, x.LastLoginDate, x.TwoFactorEnabled))
            .FirstOrDefaultAsync(cancellationToken);
        return u;
    }
}
