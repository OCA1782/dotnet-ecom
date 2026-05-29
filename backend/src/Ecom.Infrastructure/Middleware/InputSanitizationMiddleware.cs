using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;

namespace Ecom.Infrastructure.Middleware;

public partial class InputSanitizationMiddleware(RequestDelegate next)
{
    [GeneratedRegex(@"<script[^>]*>[\s\S]*?</script>", RegexOptions.IgnoreCase)]
    private static partial Regex ScriptTagRegex();

    [GeneratedRegex(@"<(iframe|object|embed|form|input|button|link|meta)[^>]*>[\s\S]*?(<\/\1>)?", RegexOptions.IgnoreCase)]
    private static partial Regex DangerousTagRegex();

    [GeneratedRegex(@"on\w+\s*=\s*[""'][^""']*[""']", RegexOptions.IgnoreCase)]
    private static partial Regex InlineEventRegex();

    public async Task InvokeAsync(HttpContext context)
    {
        if (ShouldSanitize(context.Request))
        {
            context.Request.EnableBuffering();
            var body = await new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true).ReadToEndAsync();
            context.Request.Body.Position = 0;

            if (!string.IsNullOrWhiteSpace(body))
            {
                try
                {
                    var sanitized = SanitizeJson(body);
                    var bytes = Encoding.UTF8.GetBytes(sanitized);
                    context.Request.Body = new MemoryStream(bytes);
                    context.Request.ContentLength = bytes.Length;
                }
                catch { /* pass through on parse failure */ }
            }
        }

        await next(context);
    }

    private static bool ShouldSanitize(HttpRequest req) =>
        req.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true &&
        (req.Method.Equals("POST", StringComparison.OrdinalIgnoreCase) ||
         req.Method.Equals("PUT", StringComparison.OrdinalIgnoreCase) ||
         req.Method.Equals("PATCH", StringComparison.OrdinalIgnoreCase));

    private static string SanitizeJson(string json)
    {
        using var doc = JsonDocument.Parse(json);
        using var ms = new MemoryStream();
        using var writer = new Utf8JsonWriter(ms);
        WriteElement(doc.RootElement, writer);
        writer.Flush();
        return Encoding.UTF8.GetString(ms.ToArray());
    }

    private static void WriteElement(JsonElement el, Utf8JsonWriter w)
    {
        switch (el.ValueKind)
        {
            case JsonValueKind.Object:
                w.WriteStartObject();
                foreach (var prop in el.EnumerateObject())
                {
                    w.WritePropertyName(prop.Name);
                    WriteElement(prop.Value, w);
                }
                w.WriteEndObject();
                break;
            case JsonValueKind.Array:
                w.WriteStartArray();
                foreach (var item in el.EnumerateArray())
                    WriteElement(item, w);
                w.WriteEndArray();
                break;
            case JsonValueKind.String:
                w.WriteStringValue(Sanitize(el.GetString() ?? ""));
                break;
            default:
                el.WriteTo(w);
                break;
        }
    }

    private static string Sanitize(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return input;
        var s = ScriptTagRegex().Replace(input, "");
        s = DangerousTagRegex().Replace(s, "");
        s = InlineEventRegex().Replace(s, "");
        return s;
    }
}
