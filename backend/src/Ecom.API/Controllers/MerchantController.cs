using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Merchant;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Xml;

namespace Ecom.API.Controllers;

[ApiController]
public class MerchantController(IMediator mediator, IApplicationDbContext db) : ControllerBase
{
    // ── XML Feed (AllowAnonymous — Google bunu periyodik olarak ceker) ─────────
    [HttpGet("/api/merchant/feed.xml")]
    [AllowAnonymous]
    public async Task<IActionResult> XmlFeed(CancellationToken ct)
    {
        var (siteUrl, siteName) = await GetSiteInfoAsync(ct);
        var products = await mediator.Send(new GetMerchantFeedQuery(siteUrl), ct);

        var sb = new StringBuilder();
        var settings = new XmlWriterSettings
        {
            Encoding = Encoding.UTF8,
            Indent = false,
            OmitXmlDeclaration = false
        };

        using (var writer = XmlWriter.Create(sb, settings))
        {
            writer.WriteStartDocument();
            writer.WriteStartElement("rss");
            writer.WriteAttributeString("version", "2.0");
            writer.WriteAttributeString("xmlns", "g", null, "http://base.google.com/ns/1.0");

            writer.WriteStartElement("channel");
            writer.WriteElementString("title", siteName);
            writer.WriteElementString("link", siteUrl);
            writer.WriteElementString("description", $"{siteName} - Google Merchant Feed");

            foreach (var p in products)
            {
                writer.WriteStartElement("item");

                WriteG(writer, "id",            p.Id);
                WriteG(writer, "title",         p.Title);
                WriteG(writer, "description",   StripHtml(p.Description ?? p.Title));
                WriteG(writer, "link",          p.Link);
                WriteG(writer, "availability",  p.Availability);
                WriteG(writer, "price",         p.Price);
                WriteG(writer, "condition",     p.Condition);

                if (!string.IsNullOrWhiteSpace(p.ImageLink))
                    WriteG(writer, "image_link", p.ImageLink);

                if (!string.IsNullOrWhiteSpace(p.SalePrice))
                    WriteG(writer, "sale_price", p.SalePrice);

                if (!string.IsNullOrWhiteSpace(p.Brand))
                    WriteG(writer, "brand", p.Brand);

                if (!string.IsNullOrWhiteSpace(p.Gtin))
                    WriteG(writer, "gtin", p.Gtin);

                if (!string.IsNullOrWhiteSpace(p.Mpn))
                    WriteG(writer, "mpn", p.Mpn);

                if (!string.IsNullOrWhiteSpace(p.GoogleProductCategory))
                    WriteG(writer, "google_product_category", p.GoogleProductCategory);

                writer.WriteEndElement(); // item
            }

            writer.WriteEndElement(); // channel
            writer.WriteEndElement(); // rss
            writer.WriteEndDocument();
        }

        return Content(sb.ToString(), "application/rss+xml", Encoding.UTF8);
    }

    // ── CSV Export (Admin auth) ────────────────────────────────────────────────
    [HttpGet("/api/admin/merchant/export.csv")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> ExportCsv(CancellationToken ct)
    {
        var (siteUrl, _) = await GetSiteInfoAsync(ct);
        var products = await mediator.Send(new GetMerchantFeedQuery(siteUrl), ct);

        var sb = new StringBuilder();
        sb.AppendLine("id\ttitle\tdescription\tlink\timage_link\tavailability\tprice\tsale_price\tbrand\tcondition\tgtin\tmpn\tgoogle_product_category");

        foreach (var p in products)
        {
            sb.AppendLine(string.Join("\t", new[]
            {
                Tsv(p.Id),
                Tsv(p.Title),
                Tsv(StripHtml(p.Description ?? p.Title)),
                Tsv(p.Link),
                Tsv(p.ImageLink),
                Tsv(p.Availability),
                Tsv(p.Price),
                Tsv(p.SalePrice),
                Tsv(p.Brand),
                Tsv(p.Condition),
                Tsv(p.Gtin),
                Tsv(p.Mpn),
                Tsv(p.GoogleProductCategory)
            }));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/tab-separated-values; charset=utf-8",
            $"google-merchant-{DateTime.UtcNow:yyyyMMdd}.txt");
    }

    // ── Feed meta bilgisi (ürün sayısı) ───────────────────────────────────────
    [HttpGet("/api/admin/merchant/stats")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Stats(CancellationToken ct)
    {
        var count = await db.Products
            .AsNoTracking()
            .CountAsync(p => !p.IsDeleted && p.IsActive && p.IsPublished, ct);

        var (siteUrl, _) = await GetSiteInfoAsync(ct);

        return Ok(new
        {
            productCount = count,
            feedUrl = $"{Request.Scheme}://{Request.Host}/api/merchant/feed.xml",
            siteUrl
        });
    }

    // ── Yardimcilar ───────────────────────────────────────────────────────────
    private async Task<(string siteUrl, string siteName)> GetSiteInfoAsync(CancellationToken ct)
    {
        var settings = await db.SiteSettings
            .AsNoTracking()
            .Where(s => s.Key == "SiteUrl" || s.Key == "SiteName")
            .ToListAsync(ct);

        var siteUrl  = settings.FirstOrDefault(s => s.Key == "SiteUrl")?.Value
                       ?? "http://localhost:3000";
        var siteName = settings.FirstOrDefault(s => s.Key == "SiteName")?.Value
                       ?? "Mağaza";

        return (siteUrl.TrimEnd('/'), siteName);
    }

    private static void WriteG(XmlWriter writer, string localName, string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return;
        writer.WriteStartElement("g", localName, "http://base.google.com/ns/1.0");
        writer.WriteString(value);
        writer.WriteEndElement();
    }

    private static string Tsv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        return value.Replace("\t", " ").Replace("\n", " ").Replace("\r", "");
    }

    private static string StripHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return "";
        return System.Text.RegularExpressions.Regex
            .Replace(html, "<[^>]*>", " ")
            .Replace("&nbsp;", " ")
            .Replace("&amp;", "&")
            .Replace("&lt;", "<")
            .Replace("&gt;", ">")
            .Replace("&quot;", "\"")
            .Trim();
    }
}
