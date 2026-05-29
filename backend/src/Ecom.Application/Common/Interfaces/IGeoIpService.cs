namespace Ecom.Application.Common.Interfaces;

public record GeoLocation(string? Country, string? City, double? Lat, double? Lon);

public interface IGeoIpService
{
    Task<GeoLocation?> LookupAsync(string ip, CancellationToken ct = default);
}
