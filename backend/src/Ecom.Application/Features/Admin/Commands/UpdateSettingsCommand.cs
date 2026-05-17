using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Application.Features.Admin.Commands;

public record UpdateSettingsCommand(Dictionary<string, string> Settings) : IRequest;

public class UpdateSettingsHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateSettingsCommand>
{
    public async Task Handle(UpdateSettingsCommand request, CancellationToken cancellationToken)
    {
        var existing = await db.SiteSettings.ToListAsync(cancellationToken);

        foreach (var (key, value) in request.Settings)
        {
            var setting = existing.FirstOrDefault(s => s.Key == key);
            if (setting is not null)
                setting.Value = value;
            else
                db.SiteSettings.Add(new SiteSetting { Key = key, Value = value, Group = InferGroup(key) });
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static string InferGroup(string key) => key switch
    {
        "FreeShippingLimit" or "DefaultShippingCost" => "Shipping",
        "MaintenanceMode" or "AdminMenuOrder" => "System",
        "LogoUrl" or "FaviconUrl" or "AdminTitle" => "Appearance",
        "ContactEmail" or "ContactPhone" or "SocialInstagram" or "SocialTwitter" or "SocialFacebook" => "Contact",
        _ => "General",
    };
}
