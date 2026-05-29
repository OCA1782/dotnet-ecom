using ClosedXML.Excel;
using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin.Commands;
using Ecom.Domain.Entities;
using System.Net.Http.Json;
using System.Text.Json;

namespace Ecom.Infrastructure.Services;

public class ExternalSourceFetcher(IHttpClientFactory httpClientFactory) : IExternalSourceFetcher
{
    public async Task<FetchExternalSourceResult> FetchAsync(ExternalSource source, CancellationToken cancellationToken = default)
    {
        return source.Type switch
        {
            "RestApi" => await FetchRestApiAsync(source, cancellationToken),
            _ => new FetchExternalSourceResult([], [], "Excel kaynakları doğrudan yükleme ile aktarılır. 'Veri Çek' yerine dosya yükleyin.")
        };
    }

    private async Task<FetchExternalSourceResult> FetchRestApiAsync(ExternalSource source, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(source.Config))
            return new FetchExternalSourceResult([], [], "REST API yapılandırması eksik.");

        var config = JsonSerializer.Deserialize<RestApiConfig>(source.Config,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (config?.Url is null)
            return new FetchExternalSourceResult([], [], "Config'de 'url' alanı bulunamadı.");

        var client = httpClientFactory.CreateClient();
        if (config.Headers != null)
            foreach (var kv in config.Headers)
                client.DefaultRequestHeaders.TryAddWithoutValidation(kv.Key, kv.Value);

        var response = await client.GetAsync(config.Url, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        var doc = JsonDocument.Parse(json);

        var root = doc.RootElement;
        if (!string.IsNullOrWhiteSpace(config.DataPath))
        {
            foreach (var part in config.DataPath.Split('.'))
                root = root.GetProperty(part);
        }

        if (root.ValueKind != JsonValueKind.Array)
            return new FetchExternalSourceResult([], [], "Yanıt bir JSON dizisi değil. DataPath ayarlayın.");

        var rows = new List<Dictionary<string, string>>();
        var columns = new HashSet<string>();

        foreach (var item in root.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object) continue;
            var row = new Dictionary<string, string>();
            foreach (var prop in item.EnumerateObject())
            {
                columns.Add(prop.Name);
                row[prop.Name] = prop.Value.ValueKind == JsonValueKind.Null ? "" : prop.Value.ToString();
            }
            rows.Add(row);
        }

        return new FetchExternalSourceResult(columns.ToList(), rows);
    }

    public static FetchExternalSourceResult ParseExcel(Stream stream)
    {
        using var wb = new XLWorkbook(stream);
        var ws = wb.Worksheets.First();

        var headerRow = ws.Row(1);
        var columns = new List<string>();
        int lastCol = ws.LastColumnUsed()?.ColumnNumber() ?? 0;

        for (int c = 1; c <= lastCol; c++)
        {
            var val = headerRow.Cell(c).GetValue<string>()?.Trim();
            columns.Add(string.IsNullOrWhiteSpace(val) ? $"Sütun{c}" : val);
        }

        var rows = new List<Dictionary<string, string>>();
        int lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;

        for (int r = 2; r <= lastRow; r++)
        {
            var row = new Dictionary<string, string>();
            for (int c = 0; c < columns.Count; c++)
                row[columns[c]] = ws.Cell(r, c + 1).GetValue<string>()?.Trim() ?? "";
            rows.Add(row);
        }

        return new FetchExternalSourceResult(columns, rows);
    }

    private record RestApiConfig(string? Url, Dictionary<string, string>? Headers, string? DataPath);
}
