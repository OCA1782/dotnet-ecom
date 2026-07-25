using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Ecom.API.Controllers;

[ApiController]
[Route("api/stock-notifications")]
public class StockNotificationsController(IApplicationDbContext db) : ControllerBase
{
    public record RegisterRequest(
        [Required] Guid ProductId,
        Guid? VariantId,
        [Required, EmailAddress] string Email
    );

    [HttpPost]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        var product = await db.Products
            .AsNoTracking()
            .Where(p => p.Id == req.ProductId && !p.IsDeleted && p.IsActive)
            .Select(p => new { p.Id })
            .FirstOrDefaultAsync(ct);

        if (product is null) return NotFound();

        var already = await db.StockNotifications
            .AnyAsync(n => n.ProductId == req.ProductId
                        && n.VariantId == req.VariantId
                        && n.Email == req.Email
                        && !n.IsNotified, ct);

        if (already) return Ok(new { message = "already_registered" });

        db.StockNotifications.Add(new StockNotification
        {
            ProductId = req.ProductId,
            VariantId = req.VariantId,
            Email = req.Email.Trim().ToLowerInvariant(),
        });

        await db.SaveChangesAsync(ct);
        return Ok(new { message = "registered" });
    }
}
