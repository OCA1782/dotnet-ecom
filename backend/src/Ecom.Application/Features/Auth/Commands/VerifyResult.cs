namespace Ecom.Application.Features.Auth.Commands;

public record VerifyResult(
    bool EmailConfirmed,
    bool PhoneConfirmed,
    string? Token,
    Guid? UserId,
    string? Name,
    string? Surname,
    string? Email
);
