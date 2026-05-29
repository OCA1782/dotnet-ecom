using Ecom.Application.Common.Interfaces;
using Ecom.Application.Common.Models;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public class UpsertLicenseCommand : IRequest<Result<Guid>>
{
    public Guid? Id { get; set; }          // null → create, set → update
    public string Module { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}

public class UpsertLicenseHandler(IApplicationDbContext db, ILicenseService licenseService)
    : IRequestHandler<UpsertLicenseCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(UpsertLicenseCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Module))
            return Result<Guid>.Failure("Modül adı zorunludur.");

        if (request.Id.HasValue)
        {
            var existing = await db.Licenses
                .FirstOrDefaultAsync(l => l.Id == request.Id.Value && !l.IsDeleted, cancellationToken);
            if (existing is null)
                return Result<Guid>.Failure("Lisans bulunamadı.");

            existing.Module      = request.Module.Trim();
            existing.Description = request.Description;
            existing.ExpiresAt   = request.ExpiresAt;
            existing.IsActive    = request.IsActive;
            existing.Notes       = request.Notes;

            await db.SaveChangesAsync(cancellationToken);
            await licenseService.InvalidateCacheAsync(cancellationToken);
            return Result<Guid>.Success(existing.Id);
        }
        else
        {
            var license = new License
            {
                Module      = request.Module.Trim(),
                LicenseKey  = GenerateKey(),
                Description = request.Description,
                ExpiresAt   = request.ExpiresAt,
                IsActive    = request.IsActive,
                Notes       = request.Notes,
            };
            db.Licenses.Add(license);
            await db.SaveChangesAsync(cancellationToken);
            await licenseService.InvalidateCacheAsync(cancellationToken);
            return Result<Guid>.Success(license.Id);
        }
    }

    private static string GenerateKey()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var rng = System.Security.Cryptography.RandomNumberGenerator.GetBytes(12);
        return new string(rng.Select(b => chars[b % chars.Length]).ToArray());
    }
}
