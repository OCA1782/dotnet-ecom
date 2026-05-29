using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/settings")]
[AllowAnonymous]
public class PublicSettingsController(IMediator mediator) : ControllerBase
{
    private static readonly string[] ThemeKeys =
    [
        "PrimaryColor", "AccentColor", "AdminSidebarColor",
        "CustomerFontFamily", "AdminFontFamily",
        "SiteName", "LogoUrl", "FaviconUrl",
    ];

    [HttpGet("theme")]
    public async Task<IActionResult> GetTheme(CancellationToken ct)
    {
        var all = await mediator.Send(new GetSettingsQuery(), ct);
        var theme = all
            .Where(kv => ThemeKeys.Contains(kv.Key) && !string.IsNullOrEmpty(kv.Value))
            .ToDictionary(kv => kv.Key, kv => kv.Value);
        return Ok(theme);
    }
}
