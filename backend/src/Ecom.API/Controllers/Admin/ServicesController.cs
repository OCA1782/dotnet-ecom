using Ecom.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/services")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class ServicesController(IServiceStateManager serviceManager) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll()
    {
        var services = serviceManager.GetAll().Select(s => new
        {
            s.Name,
            s.Description,
            s.Type,
            s.IsPaused,
            s.IsRunning,
            s.LastRunAt,
            s.LastRunResult,
            s.LastRunSuccess,
            s.RunCount,
            UptimeSeconds = (int)(DateTime.UtcNow - s.StartedAt).TotalSeconds,
        });
        return Ok(services);
    }

    [HttpPost("{name}/pause")]
    public IActionResult Pause(string name)
    {
        serviceManager.SetPaused(name, true);
        return Ok(new { message = $"{name} duraklatıldı." });
    }

    [HttpPost("{name}/resume")]
    public IActionResult Resume(string name)
    {
        serviceManager.SetPaused(name, false);
        return Ok(new { message = $"{name} devam ettirildi." });
    }

    [HttpPost("{name}/trigger")]
    public IActionResult Trigger(string name)
    {
        serviceManager.Trigger(name);
        return Ok(new { message = $"{name} manuel tetiklendi." });
    }
}
