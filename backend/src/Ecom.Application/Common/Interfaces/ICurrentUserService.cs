namespace Ecom.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    IEnumerable<string> Roles { get; }
    bool IsAuthenticated { get; }
    bool IsSuperAdmin { get; }
    string? IpAddress { get; }
    string? SessionId { get; }
    string? UserAgent { get; }
}
