using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/alert-conditions")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AlertConditionsController(IApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var list = await db.AlertConditions
            .Where(a => !a.IsDeleted)
            .OrderBy(a => a.IsBuiltin ? 0 : 1)
            .ThenBy(a => a.CreatedDate)
            .Select(a => new AlertConditionDto(a.Id, a.Key, a.Name, a.Description, a.Icon, a.IsActive, a.IsBuiltin, a.Threshold, a.ThresholdUnit))
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpPut("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id, CancellationToken ct)
    {
        var item = await db.AlertConditions.FindAsync([id], ct);
        if (item is null || item.IsDeleted) return NotFound();
        item.IsActive = !item.IsActive;
        item.UpdatedDate = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(new { item.IsActive });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AlertConditionRequest req, CancellationToken ct)
    {
        var item = new AlertCondition
        {
            Key = $"custom_{Guid.NewGuid():N}",
            Name = req.Name.Trim(),
            Description = req.Description?.Trim(),
            Icon = string.IsNullOrWhiteSpace(req.Icon) ? "⚠️" : req.Icon.Trim(),
            IsActive = req.IsActive,
            IsBuiltin = false,
            Threshold = req.Threshold,
            ThresholdUnit = req.ThresholdUnit?.Trim(),
        };
        db.AlertConditions.Add(item);
        await db.SaveChangesAsync(ct);
        return Ok(new AlertConditionDto(item.Id, item.Key, item.Name, item.Description, item.Icon, item.IsActive, item.IsBuiltin, item.Threshold, item.ThresholdUnit));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AlertConditionRequest req, CancellationToken ct)
    {
        var item = await db.AlertConditions.FindAsync([id], ct);
        if (item is null || item.IsDeleted) return NotFound();
        item.Name = req.Name.Trim();
        item.Description = req.Description?.Trim();
        item.Icon = string.IsNullOrWhiteSpace(req.Icon) ? "⚠️" : req.Icon.Trim();
        item.IsActive = req.IsActive;
        item.Threshold = req.Threshold;
        item.ThresholdUnit = req.ThresholdUnit?.Trim();
        item.UpdatedDate = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var item = await db.AlertConditions.FindAsync([id], ct);
        if (item is null || item.IsDeleted) return NotFound();
        if (item.IsBuiltin) return BadRequest(new { error = "Yerleşik koşullar silinemez." });
        item.IsDeleted = true;
        item.UpdatedDate = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok();
    }
}

public record AlertConditionDto(Guid Id, string Key, string Name, string? Description, string Icon, bool IsActive, bool IsBuiltin, int? Threshold, string? ThresholdUnit);

public class AlertConditionRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = "⚠️";
    public bool IsActive { get; set; } = true;
    public int? Threshold { get; set; }
    public string? ThresholdUnit { get; set; }
}
