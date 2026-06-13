using Ecom.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/mail-logs")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class MailLogsController(IApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        [FromQuery] string? status = null,
        [FromQuery] string? template = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var q = db.MailLogs.AsQueryable();

        if (status == "success") q = q.Where(l => l.IsSuccess && !l.IsDevMode);
        else if (status == "failed") q = q.Where(l => !l.IsSuccess);
        else if (status == "dev") q = q.Where(l => l.IsDevMode);

        if (!string.IsNullOrWhiteSpace(template))
            q = q.Where(l => l.TemplateName == template);

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(l => l.ToEmail.Contains(search) || l.Subject.Contains(search));

        var total = await q.CountAsync(ct);
        var logs = await q
            .OrderByDescending(l => l.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new
            {
                l.Id, l.SentAt, l.ToEmail, l.ToName,
                l.Subject, l.TemplateName,
                l.IsSuccess, l.IsDevMode, l.ErrorMessage,
            })
            .ToListAsync(ct);

        return Ok(new { total, page, pageSize, logs });
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteAll(CancellationToken ct)
    {
        var count = await db.MailLogs.CountAsync(ct);
        db.MailLogs.RemoveRange(db.MailLogs);
        await db.SaveChangesAsync(ct);
        return Ok(new { deleted = count });
    }
}
