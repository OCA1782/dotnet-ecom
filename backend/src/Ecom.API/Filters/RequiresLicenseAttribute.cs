using Ecom.Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Ecom.API.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class RequiresLicenseAttribute(string module) : Attribute, IFilterFactory
{
    public bool IsReusable => false;

    public IFilterMetadata CreateInstance(IServiceProvider serviceProvider)
    {
        var licenseService = serviceProvider.GetRequiredService<ILicenseService>();
        return new LicenseActionFilter(licenseService, module);
    }
}

internal sealed class LicenseActionFilter(ILicenseService licenseService, string module)
    : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var active = await licenseService.IsModuleActiveAsync(module);
        if (!active)
        {
            context.Result = new ObjectResult(new { error = $"'{module}' modülü için aktif lisans bulunamadı." })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }

        await next();
    }
}
