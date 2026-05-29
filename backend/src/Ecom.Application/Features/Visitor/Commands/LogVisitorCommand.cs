using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using MediatR;

namespace Ecom.Application.Features.Visitor.Commands;

public record LogVisitorCommand(
    string? Page,
    string? Referrer,
    double? Latitude,
    double? Longitude
) : IRequest<Unit>;

public class LogVisitorCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IGeoIpService geoIp)
    : IRequestHandler<LogVisitorCommand, Unit>
{
    public async Task<Unit> Handle(LogVisitorCommand request, CancellationToken cancellationToken)
    {
        var ip = currentUser.IpAddress;
        var geo = await geoIp.LookupAsync(ip ?? "", cancellationToken);

        var log = new VisitorLog
        {
            SessionId = currentUser.SessionId,
            UserId = currentUser.UserId,
            IpAddress = ip,
            UserAgent = currentUser.UserAgent,
            Page = request.Page,
            Referrer = request.Referrer,
            Country = geo?.Country,
            City = geo?.City,
            // Prefer browser GPS if provided, fall back to IP geo
            Latitude = request.Latitude ?? geo?.Lat,
            Longitude = request.Longitude ?? geo?.Lon,
        };

        db.VisitorLogs.Add(log);
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
