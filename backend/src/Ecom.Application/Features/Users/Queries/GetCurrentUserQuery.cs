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
    DateTime? LastLoginDate
);

public class GetCurrentUserHandler(IApplicationDbContext db)
    : IRequestHandler<GetCurrentUserQuery, UserProfileDto?>
{
    public async Task<UserProfileDto?> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var u = await db.Users
            .IgnoreQueryFilters()
            .Where(x => x.Id == request.UserId)
            .Select(x => new UserProfileDto(
                x.Id, x.Name, x.Surname, x.Email, x.PhoneNumber,
                x.AvatarUrl, x.CommercialConsent, x.LastLoginDate))
            .FirstOrDefaultAsync(cancellationToken);
        return u;
    }
}
