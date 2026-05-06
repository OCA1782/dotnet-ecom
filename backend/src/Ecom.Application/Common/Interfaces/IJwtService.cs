using Ecom.Domain.Entities;

namespace Ecom.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user, IEnumerable<string> roles);
}
