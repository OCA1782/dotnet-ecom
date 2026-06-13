using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Ecom.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/mail-templates")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class MailTemplatesController(IApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var templates = await db.MailTemplates
            .OrderBy(t => t.DisplayName)
            .Select(t => new
            {
                t.Id, t.Name, t.DisplayName, t.Source, t.SourceDetail,
                t.Trigger, t.TriggerPath, t.Subject,
                t.FromName, t.FromAddress, t.CcEmails, t.BccEmails,
                t.Variables, t.SampleVariables, t.IsBodyEditable, t.IsEnabled,
                t.UpdatedAt,
                HasBodyOverride = t.BodyHtml != "",
            })
            .ToListAsync(ct);
        return Ok(templates);
    }

    [HttpGet("{name}")]
    public async Task<IActionResult> GetByName(string name, CancellationToken ct)
    {
        var t = await db.MailTemplates.FirstOrDefaultAsync(x => x.Name == name, ct);
        if (t is null) return NotFound();
        return Ok(new
        {
            t.Id, t.Name, t.DisplayName, t.Source, t.SourceDetail,
            t.Trigger, t.TriggerPath, t.Subject,
            t.BodyHtml, t.DefaultBodyHtml,
            t.FromName, t.FromAddress, t.CcEmails, t.BccEmails,
            t.Variables, t.SampleVariables, t.IsBodyEditable, t.IsEnabled,
            t.UpdatedAt,
        });
    }

    [HttpPut("{name}")]
    public async Task<IActionResult> Update(string name, [FromBody] UpdateMailTemplateRequest req, CancellationToken ct)
    {
        var t = await db.MailTemplates.FirstOrDefaultAsync(x => x.Name == name, ct);
        if (t is null) return NotFound();

        t.DisplayName  = req.DisplayName ?? t.DisplayName;
        t.Subject      = req.Subject ?? t.Subject;
        t.BodyHtml     = req.BodyHtml ?? t.BodyHtml;
        t.FromName     = req.FromName ?? t.FromName;
        t.FromAddress  = req.FromAddress ?? t.FromAddress;
        t.CcEmails     = req.CcEmails ?? t.CcEmails;
        t.BccEmails    = req.BccEmails ?? t.BccEmails;
        t.IsEnabled    = req.IsEnabled ?? t.IsEnabled;
        t.UpdatedAt    = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Ok(new { t.Name, t.UpdatedAt });
    }

    [HttpPost("{name}/reset")]
    public async Task<IActionResult> Reset(string name, CancellationToken ct)
    {
        var t = await db.MailTemplates.FirstOrDefaultAsync(x => x.Name == name, ct);
        if (t is null) return NotFound();

        // Restore from built-in definitions
        var def = Infrastructure.Persistence.DbInitializer.GetMailTemplateDefinitions()
            .FirstOrDefault(d => d.Name == name);
        if (def is not null)
        {
            t.Subject         = def.Subject;
            t.BodyHtml        = "";
            t.DefaultBodyHtml = def.DefaultBodyHtml;
            t.FromName        = "";
            t.FromAddress     = "";
            t.CcEmails        = "";
            t.BccEmails       = "";
            t.IsEnabled       = true;
        }
        else
        {
            t.BodyHtml = "";
        }
        t.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(new { reset = true });
    }

    [HttpPost("{name}/preview")]
    public async Task<IActionResult> Preview(string name, [FromBody] Dictionary<string, string>? vars, CancellationToken ct)
    {
        var t = await db.MailTemplates.FirstOrDefaultAsync(x => x.Name == name, ct);
        if (t is null) return NotFound();

        Dictionary<string, string> sampleVars;
        try { sampleVars = JsonSerializer.Deserialize<Dictionary<string, string>>(t.SampleVariables) ?? []; }
        catch { sampleVars = []; }

        // Merge provided vars over sample vars
        if (vars is not null)
            foreach (var (k, v) in vars) sampleVars[k] = v;

        var body = string.IsNullOrWhiteSpace(t.BodyHtml) ? t.DefaultBodyHtml : t.BodyHtml;
        var subject = t.Subject;

        foreach (var (k, v) in sampleVars)
        {
            body    = body.Replace($"{{{{{k}}}}}", v);
            subject = subject.Replace($"{{{{{k}}}}}", v);
        }

        return Ok(new { subject, bodyHtml = body });
    }

    public record UpdateMailTemplateRequest(
        string? DisplayName,
        string? Subject,
        string? BodyHtml,
        string? FromName,
        string? FromAddress,
        string? CcEmails,
        string? BccEmails,
        bool? IsEnabled);
}
