using Ecom.Infrastructure.Jobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/verification")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class VerificationController(IMemoryCache cache, JobScheduler scheduler) : ControllerBase
{
    [HttpGet]
    public IActionResult GetLastResult()
    {
        var snapshot = cache.Get<VerificationSnapshot>(TodoVerificationJob.CacheKey);
        if (snapshot is null)
            return Ok(new { ran = false, message = "Henüz çalıştırılmadı. Admin > Joblar sayfasından TodoVerificationJob'u manuel tetikleyebilirsiniz." });

        return Ok(new
        {
            ran = true,
            checkedAt = snapshot.CheckedAt,
            total = snapshot.Total,
            passed = snapshot.Passed,
            failed = snapshot.Failed,
            passRate = snapshot.Total > 0 ? (snapshot.Passed * 100 / snapshot.Total) : 0,
            items = snapshot.Items.Select(i => new
            {
                category = i.Category,
                name = i.Name,
                passed = i.Passed,
                detail = i.Detail,
                latencyMs = i.LatencyMs
            })
        });
    }

    [HttpPost("run")]
    public async Task<IActionResult> TriggerRun(CancellationToken ct)
    {
        try
        {
            await scheduler.TriggerManualAsync("TodoVerificationJob", ct);
            return Ok(new { message = "TodoVerificationJob tamamlandı." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
