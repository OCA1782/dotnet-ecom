using ClosedXML.Excel;
using Ecom.Application.Common.Interfaces;
using Ecom.Application.Features.Admin.Commands;
using Ecom.Domain.Entities;
using System.Net.Http.Json;
using System.Text.Json;
using System.Web;

namespace Ecom.Infrastructure.Services;

public class ExternalSourceFetcher(IHttpClientFactory httpClientFactory) : IExternalSourceFetcher
{
    private const int MaxPages = 200;
    private static readonly string[] ArrayCandidates = ["items", "data", "products", "results", "content", "records", "list", "rows", "entries"];

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
        client.Timeout = TimeSpan.FromSeconds(30);
        if (config.Headers != null)
            foreach (var kv in config.Headers)
                client.DefaultRequestHeaders.TryAddWithoutValidation(kv.Key, kv.Value);

        var allRows = new List<Dictionary<string, string>>();
        var columns = new HashSet<string>();
        var page = 1;

        while (true)
        {
            var url = BuildUrl(config.Url, config.Paginate, config.PageSizeParam, config.PageSize, config.PageParam, page);

            HttpResponseMessage response;
            try { response = await client.GetAsync(url, ct); }
            catch (Exception ex) { return new FetchExternalSourceResult([], [], $"Bağlantı hatası: {ex.Message}"); }

            if (!response.IsSuccessStatusCode)
                return new FetchExternalSourceResult([], [], $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}");

            var json = await response.Content.ReadAsStringAsync(ct);
            JsonDocument doc;
            try { doc = JsonDocument.Parse(json); }
            catch { return new FetchExternalSourceResult([], [], "Yanıt geçerli bir JSON değil."); }

            var rootFull = doc.RootElement;

            // Check hasNextPage at root level BEFORE applying dataPath
            bool hasNextPage = false;
            if (config.Paginate && rootFull.ValueKind == JsonValueKind.Object &&
                rootFull.TryGetProperty("hasNextPage", out var hnp) &&
                hnp.ValueKind == JsonValueKind.True)
                hasNextPage = true;

            // Navigate to dataPath
            var dataRoot = rootFull;
            if (!string.IsNullOrWhiteSpace(config.DataPath))
            {
                try
                {
                    foreach (var part in config.DataPath.Split('.'))
                        dataRoot = dataRoot.GetProperty(part);
                }
                catch
                {
                    return new FetchExternalSourceResult([], [], $"DataPath '{config.DataPath}' yanıtta bulunamadı.");
                }
            }

            // Auto-detect common array container keys when DataPath is not set
            if (dataRoot.ValueKind == JsonValueKind.Object && string.IsNullOrWhiteSpace(config.DataPath))
            {
                foreach (var candidate in ArrayCandidates)
                {
                    if (dataRoot.TryGetProperty(candidate, out var arr) && arr.ValueKind == JsonValueKind.Array)
                    {
                        dataRoot = arr;
                        break;
                    }
                }
            }

            if (dataRoot.ValueKind != JsonValueKind.Array)
            {
                var availableKeys = dataRoot.ValueKind == JsonValueKind.Object
                    ? string.Join(", ", dataRoot.EnumerateObject().Select(p => $"\"{p.Name}\"").Take(6))
                    : "";
                var hint = string.IsNullOrEmpty(availableKeys)
                    ? "Yanıt bir JSON dizisi değil. DataPath ayarlayın (örn: \"items\", \"data\")."
                    : $"Yanıt bir JSON dizisi değil. Yanıttaki anahtarlar: {availableKeys}. DataPath alanına uygun anahtarı girin.";
                return new FetchExternalSourceResult([], [], hint);
            }

            foreach (var item in dataRoot.EnumerateArray())
            {
                if (item.ValueKind != JsonValueKind.Object) continue;
                var row = new Dictionary<string, string>();
                foreach (var prop in item.EnumerateObject())
                {
                    columns.Add(prop.Name);
                    row[prop.Name] = prop.Value.ValueKind == JsonValueKind.Null ? "" : prop.Value.ToString();
                }
                allRows.Add(row);
            }

            if (!config.Paginate || !hasNextPage || page >= MaxPages) break;
            page++;
        }

        return new FetchExternalSourceResult(columns.ToList(), allRows);
    }

    private static string BuildUrl(string baseUrl, bool paginate, string? pageSizeParam, int? pageSize, string? pageParam, int page)
    {
        if (!paginate && page == 1) return baseUrl;

        var uriBuilder = new UriBuilder(baseUrl);
        var qs = HttpUtility.ParseQueryString(uriBuilder.Query);

        if (paginate)
        {
            qs[pageParam ?? "page"] = page.ToString();
            if (pageSize.HasValue)
                qs[pageSizeParam ?? "pageSize"] = pageSize.Value.ToString();
        }

        uriBuilder.Query = qs.ToString();
        return uriBuilder.ToString();
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

    private record RestApiConfig(
        string? Url,
        Dictionary<string, string>? Headers,
        string? DataPath,
        bool Paginate = false,
        string? PageParam = null,
        string? PageSizeParam = null,
        int? PageSize = null
    );
}
