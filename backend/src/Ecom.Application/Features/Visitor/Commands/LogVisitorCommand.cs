using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using MediatR;

namespace Ecom.Application.Features.Visitor.Commands;

public record LogVisitorCommand(
    string? Page,
    string? Referrer,
    double? Latitude,
    double? Longitude,
    string? IpAddress = null,
    string? UserAgent = null,
    string? SessionId = null,
    Guid? UserId = null
) : IRequest<Unit>;

public class LogVisitorCommandHandler(IApplicationDbContext db, IGeoIpService geoIp)
    : IRequestHandler<LogVisitorCommand, Unit>
{
    public async Task<Unit> Handle(LogVisitorCommand request, CancellationToken cancellationToken)
    {
        var geo = await geoIp.LookupAsync(request.IpAddress ?? "", cancellationToken);

        db.VisitorLogs.Add(new VisitorLog
        {
            SessionId = request.SessionId,
            UserId = request.UserId,
            IpAddress = request.IpAddress,
            UserAgent = request.UserAgent,
            Page = request.Page,
            Referrer = request.Referrer,
            Country = geo?.Country,
            City = geo?.City,
            Latitude = request.Latitude ?? geo?.Lat,
            Longitude = request.Longitude ?? geo?.Lon,
        });

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
