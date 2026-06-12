using System.Text;
using System.Text.RegularExpressions;
using Ecom.Application.Common.Interfaces;
using Ecom.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Ecom.Infrastructure.Jobs;

public class CustomerI18nDictionaryBuilderJob(
    IServiceScopeFactory scopeFactory,
    IWebHostEnvironment env,
    IConfiguration config,
    IMemoryCache cache) : IJobRunner
{
    public string Name => "CustomerI18nDictionaryBuilderJob";
    public string Description => "Customer .tsx sayfalarını tarar, güvenli modda i18n anahtar önerileri üretir";
	public int IntervalMinutes => 30;

    private static readonly Regex TurkishCharPattern = new(
        "[ğüşıöçİĞÜŞÖÇ]", RegexOptions.Compiled);

    private static readonly Regex TurkishStringLiteral = new(
        "\"([^\"\\n\\\\]*[ğüşıöçİĞÜŞÖÇ][^\"\\n\\\\]*)\"",
        RegexOptions.Compiled);

    private static readonly Regex TCallPattern = new(
        @"\bt\s*\(", RegexOptions.Compiled);

    private static readonly Regex KeyValueLine = new(
        "\"([^\"]+)\"\\s*:\\s*\"([^\"]*)\"",
        RegexOptions.Compiled);

    private static readonly Dictionary<string, (string en, string de, string es)> KnownTranslations =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Kaydet"] = ("Save", "Speichern", "Guardar"),
            ["Vazgeç"] = ("Cancel", "Abbrechen", "Cancelar"),
            ["İptal"] = ("Cancel", "Abbrechen", "Cancelar"),
            ["Sil"] = ("Delete", "Löschen", "Eliminar"),
            ["Düzenle"] = ("Edit", "Bearbeiten", "Editar"),
            ["Ekle"] = ("Add", "Hinzufügen", "Agregar"),
            ["Yeni"] = ("New", "Neu", "Nuevo"),
            ["Oluştur"] = ("Create", "Erstellen", "Crear"),
            ["Güncelle"] = ("Update", "Aktualisieren", "Actualizar"),
            ["Filtrele"] = ("Filter", "Filtern", "Filtrar"),
            ["Ara"] = ("Search", "Suchen", "Buscar"),
            ["Ara..."] = ("Search...", "Suchen...", "Buscar..."),
            ["Dışa Aktar"] = ("Export", "Exportieren", "Exportar"),
            ["İçe Aktar"] = ("Import", "Importieren", "Importar"),
            ["Yenile"] = ("Refresh", "Aktualisieren", "Actualizar"),
            ["Geri"] = ("Back", "Zurück", "Atrás"),
            ["Kapat"] = ("Close", "Schließen", "Cerrar"),
            ["Görüntüle"] = ("View", "Ansehen", "Ver"),
            ["İndir"] = ("Download", "Herunterladen", "Descargar"),
            ["Yükle"] = ("Upload", "Hochladen", "Subir"),
            ["Uygula"] = ("Apply", "Anwenden", "Aplicar"),
            ["Sıfırla"] = ("Reset", "Zurücksetzen", "Restablecer"),
            ["Onayla"] = ("Approve", "Genehmigen", "Aprobar"),
            ["Reddet"] = ("Reject", "Ablehnen", "Rechazar"),
            ["Yayınla"] = ("Publish", "Veröffentlichen", "Publicar"),
            ["Aktif"] = ("Active", "Aktiv", "Activo"),
            ["Pasif"] = ("Inactive", "Inaktiv", "Inactivo"),
            ["Başarılı"] = ("Success", "Erfolgreich", "Exitoso"),
            ["Hata"] = ("Error", "Fehler", "Error"),
            ["Uyarı"] = ("Warning", "Warnung", "Advertencia"),
            ["Yükleniyor"] = ("Loading", "Wird geladen", "Cargando"),
            ["Yükleniyor..."] = ("Loading...", "Wird geladen...", "Cargando..."),
            ["Kaydediliyor..."] = ("Saving...", "Wird gespeichert...", "Guardando..."),
            ["Siliniyor..."] = ("Deleting...", "Wird gelöscht...", "Eliminando..."),
            ["Toplam"] = ("Total", "Gesamt", "Total"),
            ["Tüm"] = ("All", "Alle", "Todos"),
            ["Kayıt bulunamadı"] = ("No records found", "Keine Einträge", "Sin registros"),
            ["Sonuç bulunamadı"] = ("No results found", "Keine Ergebnisse", "Sin resultados"),
            ["Tarih"] = ("Date", "Datum", "Fecha"),
            ["Ad"] = ("Name", "Name", "Nombre"),
            ["E-posta"] = ("Email", "E-Mail", "Correo"),
            ["Telefon"] = ("Phone", "Telefon", "Teléfono"),
            ["Durum"] = ("Status", "Status", "Estado"),
            ["İşlemler"] = ("Actions", "Aktionen", "Acciones"),
            ["Açıklama"] = ("Description", "Beschreibung", "Descripción"),
            ["Fiyat"] = ("Price", "Preis", "Precio"),
            ["Adet"] = ("Qty", "Menge", "Cant."),
            ["Evet"] = ("Yes", "Ja", "Sí"),
            ["Hayır"] = ("No", "Nein", "No"),
            ["Tamam"] = ("OK", "OK", "Aceptar"),
            ["Detaylar"] = ("Details", "Details", "Detalles"),
            ["Geçmiş"] = ("History", "Verlauf", "Historial"),
            ["İstatistikler"] = ("Statistics", "Statistiken", "Estadísticas"),
            ["Önizleme"] = ("Preview", "Vorschau", "Vista previa"),
            ["Ayarlar"] = ("Settings", "Einstellungen", "Configuración"),
            ["Çalıştır"] = ("Run", "Ausführen", "Ejecutar"),
            ["Durdur"] = ("Stop", "Stoppen", "Detener"),
            ["Yeniden Dene"] = ("Retry", "Wiederholen", "Reintentar"),
            ["Kopyala"] = ("Copy", "Kopieren", "Copiar"),
            ["Görsel Yükle"] = ("Upload Image", "Bild hochladen", "Subir imagen"),
            ["Dosya Yükle"] = ("Upload File", "Datei hochladen", "Subir archivo"),
            ["Henüz veri yok"] = ("No data yet", "Noch keine Daten", "Aún no hay datos"),
            ["Bekleyen"] = ("Pending", "Ausstehend", "Pendiente"),
            ["Tamamlandı"] = ("Completed", "Abgeschlossen", "Completado"),
            ["İşleniyor"] = ("Processing", "Wird verarbeitet", "Procesando"),
            ["Gönderildi"] = ("Shipped", "Versandt", "Enviado"),
            ["Teslim Edildi"] = ("Delivered", "Zugestellt", "Entregado"),
            ["İade Edildi"] = ("Returned", "Zurückgegeben", "Devuelto"),
        };

    public async Task RunAsync(Func<string, Task> log, CancellationToken ct)
    {
        var siteSettings = await LoadSiteSettingsAsync(ct);
        await log("Customer i18n Dictionary Builder başlıyor...");
        await log($"  Mod: kaynak yazımı={(AllowSourceMutation(siteSettings) ? "açık" : "kapalı")}, docs yazımı={(AllowDocsWrite(siteSettings) ? "açık" : "kapalı")}");

        var projectRoot = ResolveProjectRoot(siteSettings);
        if (projectRoot is null)
        {
            await log("  ⚠ Proje kök dizini bulunamadı");
            return;
        }

        var i18nPath = Path.Combine(projectRoot, "frontend", "customer", "src", "lib", "i18n.ts");
        if (!File.Exists(i18nPath))
        {
            await log($"  ⚠ i18n.ts bulunamadı: {i18nPath}");
            return;
        }
        await log($"  Proje kökü: {projectRoot}");

        var customerSrcDir = Path.Combine(projectRoot, "frontend", "customer", "src");
        var scanRoots = new[]
        {
            Path.Combine(customerSrcDir, "app"),
            Path.Combine(customerSrcDir, "components"),
        }.Where(Directory.Exists).ToArray();

        if (scanRoots.Length == 0)
        {
            await log("  ⚠ Customer sayfaları dizini bulunamadı");
            return;
        }

        var i18nContent = await File.ReadAllTextAsync(i18nPath, Encoding.UTF8, ct);
        var existingTrValues = ExtractExistingTrValues(i18nContent);
        var existingKeys = ExtractAllKeys(i18nContent);
        await log($"  ✓ i18n.ts okundu — {existingKeys.Count} mevcut anahtar, {existingTrValues.Count} TR değeri");

        var tsxFiles = scanRoots
            .SelectMany(dir => Directory.GetFiles(dir, "*.tsx", SearchOption.AllDirectories))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(p => p, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        await log($"  ✓ {tsxFiles.Length} .tsx dosyası taranıyor...");

        var newStrings = new HashSet<string>(StringComparer.Ordinal);
        var fileHits = new Dictionary<string, int>();

        foreach (var file in tsxFiles)
        {
            ct.ThrowIfCancellationRequested();
            var lines = await File.ReadAllLinesAsync(file, Encoding.UTF8, ct);
            var found = 0;

            foreach (var line in lines)
            {
                var trimmed = line.TrimStart();
                if (trimmed.StartsWith("//") || trimmed.StartsWith("*") || trimmed.StartsWith("/*") || trimmed.StartsWith("import "))
                    continue;
                if (!TurkishCharPattern.IsMatch(line)) continue;
                if (TCallPattern.IsMatch(line)) continue;

                foreach (Match m in TurkishStringLiteral.Matches(line))
                {
                    var str = m.Groups[1].Value.Trim();
                    if (str.Length < 2 || str.Length > 80) continue;
                    if (!existingTrValues.Contains(str))
                    {
                        newStrings.Add(str);
                        found++;
                    }
                }
            }

            if (found > 0)
            {
                var rel = Path.GetRelativePath(customerSrcDir, file).Replace("\\", "/");
                fileHits[rel] = found;
            }
        }

        if (newStrings.Count == 0)
        {
            await log("  ✓ Yeni string bulunamadı — i18n.ts güncel");
            cache.Set("customer:i18n:builder:lastResult", "no-new-strings", TimeSpan.FromHours(13));
            await UpdateStatusDoc(projectRoot, siteSettings, existingKeys.Count, 0, [], log, ct);
            return;
        }

        await log($"  → {newStrings.Count} yeni string ({fileHits.Count} dosyada)");

        var newEntries = new List<(string key, string tr, string en, string de, string es)>();
        foreach (var str in newStrings.OrderBy(s => s))
        {
            var key = GenerateKey(str, existingKeys);
            existingKeys.Add(key);
            var (en, de, es) = LookupTranslation(str);
            newEntries.Add((key, str, en, de, es));
        }

        cache.Set("customer:i18n:builder:lastAdded", newEntries.Count, TimeSpan.FromHours(13));
        cache.Set("customer:i18n:builder:lastResult", $"added-{newEntries.Count}", TimeSpan.FromHours(13));

        if (AllowSourceMutation(siteSettings))
        {
            var updated = InsertNewEntries(i18nContent, newEntries);
            await File.WriteAllTextAsync(i18nPath, updated, Encoding.UTF8, ct);
            await log($"  ✅ i18n.ts güncellendi — {newEntries.Count} yeni anahtar eklendi:");
        }
        else
        {
            await log($"  ℹ Öneri modu — {newEntries.Count} yeni anahtar bulundu, i18n.ts yazılmadı");
            await log("  ℹ Kaynak yazımı için CustomerI18nJob:AllowSourceMutation=true gerekir");
        }

        foreach (var (key, tr, _, _, _) in newEntries.Take(20))
            await log($"    + \"{key}\": \"{tr}\"");
        if (newEntries.Count > 20)
            await log($"    ... ve {newEntries.Count - 20} daha");

        foreach (var (f, n) in fileHits.OrderByDescending(x => x.Value).Take(10))
            await log($"    • {f}: {n} string");

        await UpdateStatusDoc(projectRoot, siteSettings, existingKeys.Count, newEntries.Count, fileHits, log, ct);
    }

    private async Task UpdateStatusDoc(
        string projectRoot,
        IReadOnlyDictionary<string, string> siteSettings,
        int totalKeys,
        int addedCount,
        Dictionary<string, int> fileHits,
        Func<string, Task> log,
        CancellationToken ct)
    {
        var docsPath = ResolveDocsPath(projectRoot, siteSettings);
        if (docsPath is null) return;
        if (!AllowDocsWrite(siteSettings))
        {
            await log("  ℹ Docs yazımı kapalı — CustomerI18nJob:AllowDocsWrite=true olmadan CUSTOMER_I18N_STATUS.md güncellenmedi");
            return;
        }

        var statusFile = Path.Combine(docsPath, "CUSTOMER_I18N_STATUS.md");
        var sb = new StringBuilder();

        string existing = "";
        if (File.Exists(statusFile))
            existing = await File.ReadAllTextAsync(statusFile, Encoding.UTF8, ct);

        sb.AppendLine("# Customer i18n Durum Raporu");
        sb.AppendLine();
        sb.AppendLine($"> Son güncelleme: {DateTime.UtcNow:dd.MM.yyyy HH:mm} UTC (CustomerI18nDictionaryBuilderJob otomatik)");
        sb.AppendLine();
        sb.AppendLine("## Sözlük Durumu");
        sb.AppendLine();
        sb.AppendLine($"| Metrik | Değer |");
        sb.AppendLine($"|--------|-------|");
        sb.AppendLine($"| Toplam Anahtar | {totalKeys} |");
        sb.AppendLine($"| Son Çalışmada Eklenen | {addedCount} |");
        sb.AppendLine($"| Son Güncelleme | {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC |");
        sb.AppendLine($"| Diller | TR / EN / DE / ES |");
        sb.AppendLine();

        if (addedCount > 0)
        {
            sb.AppendLine("## Son Eklenen Dosyalar");
            sb.AppendLine();
            foreach (var (f, n) in fileHits.OrderByDescending(x => x.Value))
                sb.AppendLine($"- `{f}`: {n} yeni string");
            sb.AppendLine();
        }

        var historyIdx = existing.IndexOf("## Geçmiş", StringComparison.Ordinal);
        if (historyIdx >= 0)
            sb.Append(existing[historyIdx..]);
        else
        {
            sb.AppendLine("## Geçmiş");
            sb.AppendLine();
        }

        sb.AppendLine($"- **{DateTime.UtcNow:yyyy-MM-dd HH:mm}**: {(addedCount > 0 ? $"{addedCount} yeni anahtar eklendi ({fileHits.Count} dosyadan)" : "Güncelleme yok — sözlük güncel")}");

        await File.WriteAllTextAsync(statusFile, sb.ToString(), Encoding.UTF8, ct);
        await log($"  ✓ CUSTOMER_I18N_STATUS.md güncellendi");
    }

    private static HashSet<string> ExtractExistingTrValues(string content)
    {
        var values = new HashSet<string>(StringComparer.Ordinal);
        var trStart = content.IndexOf("const TR: Dict = {", StringComparison.Ordinal);
        var enStart = content.IndexOf("const EN: Dict = {", StringComparison.Ordinal);
        if (trStart < 0 || enStart < 0) return values;

        var trSection = content[trStart..enStart];
        foreach (Match m in KeyValueLine.Matches(trSection))
            values.Add(m.Groups[2].Value);

        return values;
    }

    private static HashSet<string> ExtractAllKeys(string content)
    {
        var keys = new HashSet<string>(StringComparer.Ordinal);
        foreach (Match m in KeyValueLine.Matches(content))
            keys.Add(m.Groups[1].Value);
        return keys;
    }

    private static string GenerateKey(string trValue, HashSet<string> existingKeys)
    {
        var slug = trValue
            .Replace('ğ', 'g').Replace('Ğ', 'G')
            .Replace('ü', 'u').Replace('Ü', 'U')
            .Replace('ş', 's').Replace('Ş', 'S')
            .Replace('ı', 'i').Replace('İ', 'I')
            .Replace('ö', 'o').Replace('Ö', 'O')
            .Replace('ç', 'c').Replace('Ç', 'C');

        var words = slug.Split([' ', '-', '_', '.', '/', '\\', '(', ')', ',', '!', '?', ':', ';'],
            StringSplitOptions.RemoveEmptyEntries);

        var camel = string.Concat(
            words.Select((w, i) => i == 0
                ? w[..1].ToLower() + (w.Length > 1 ? w[1..].ToLower() : "")
                : char.ToUpper(w[0]) + (w.Length > 1 ? w[1..].ToLower() : ""))
        );

        if (camel.Length > 32) camel = camel[..32];
        camel = new string(camel.Where(char.IsLetterOrDigit).ToArray());
        if (string.IsNullOrEmpty(camel)) camel = "item";

        var key = $"auto.{camel}";
        if (!existingKeys.Contains(key)) return key;

        for (var i = 2; i < 100; i++)
        {
            var candidate = $"auto.{camel}{i}";
            if (!existingKeys.Contains(candidate)) return candidate;
        }

        return $"auto.{camel}_{Guid.NewGuid():N}"[..40];
    }

    private static (string en, string de, string es) LookupTranslation(string trValue)
    {
        if (KnownTranslations.TryGetValue(trValue, out var known))
            return known;
        var placeholder = $"[TR:{EscapeStr(trValue)}]";
        return (placeholder, placeholder, placeholder);
    }

    private static string InsertNewEntries(string content,
        List<(string key, string tr, string en, string de, string es)> entries)
    {
        if (entries.Count == 0) return content;

        var date = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var header = $"\n\n  // ── Auto-generated {date} ({entries.Count} keys) ─────────────────────────────────────────────────────────";

        var trLines = header + "\n" + string.Join("\n", entries.Select(e => $"  \"{e.key}\": \"{EscapeStr(e.tr)}\","));
        var enLines = header + "\n" + string.Join("\n", entries.Select(e => $"  \"{e.key}\": \"{EscapeStr(e.en)}\","));
        var deLines = header + "\n" + string.Join("\n", entries.Select(e => $"  \"{e.key}\": \"{EscapeStr(e.de)}\","));
        var esLines = header + "\n" + string.Join("\n", entries.Select(e => $"  \"{e.key}\": \"{EscapeStr(e.es)}\","));

        content = InsertBeforeDictClose(content, "const TR: Dict = {", "const EN: Dict = {", trLines);
        content = InsertBeforeDictClose(content, "const EN: Dict = {", "const DE: Dict = {", enLines);
        content = InsertBeforeDictClose(content, "const DE: Dict = {", "const ES: Dict = {", deLines);
        content = InsertBeforeDictClose(content, "const ES: Dict = {", "export const translations", esLines);

        return content;
    }

    private static string InsertBeforeDictClose(string content, string dictHeader, string nextMarker, string newLines)
    {
        var nextIdx = content.IndexOf(nextMarker, StringComparison.Ordinal);
        if (nextIdx < 0) return content;
        var closeIdx = content.LastIndexOf("\n};", nextIdx, StringComparison.Ordinal);
        if (closeIdx < 0) return content;
        return content[..closeIdx] + "\n" + newLines + content[closeIdx..];
    }

    private static string EscapeStr(string s) =>
        s.Replace("\\", "\\\\").Replace("\"", "\\\"");

    private async Task<Dictionary<string, string>> LoadSiteSettingsAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        return await db.SiteSettings.ToDictionaryAsync(s => s.Key, s => s.Value, ct);
    }

    private string? ResolveDocsPath(string projectRoot, IReadOnlyDictionary<string, string> siteSettings)
    {
        var configured = ResolveSetting(siteSettings, "CustomerI18nJob:DocsPath");
        if (!string.IsNullOrEmpty(configured) && Directory.Exists(configured))
            return configured;
        var parent = Directory.GetParent(projectRoot)?.FullName;
        if (parent is null) return null;
        foreach (var name in new[] { "dotnet-ecom-docs", "dotnet_ecom_docs", "ecom-docs" })
        {
            var p = Path.Combine(parent, name);
            if (Directory.Exists(p)) return p;
        }
        return null;
    }

    private bool AllowSourceMutation(IReadOnlyDictionary<string, string> siteSettings) =>
        ResolveBoolSetting(siteSettings, "CustomerI18nJob:AllowSourceMutation", false);

    private bool AllowDocsWrite(IReadOnlyDictionary<string, string> siteSettings) =>
        ResolveBoolSetting(siteSettings, "CustomerI18nJob:AllowDocsWrite", false);

    private string? ResolveProjectRoot(IReadOnlyDictionary<string, string> siteSettings)
    {
        var configured = ResolveSetting(siteSettings, "CustomerI18nJob:ProjectRoot");
        if (!string.IsNullOrEmpty(configured) && Directory.Exists(configured))
            return configured;
        var dir = env.ContentRootPath;
        for (var i = 0; i < 8; i++)
        {
            if (Directory.Exists(Path.Combine(dir, "backend")) &&
                Directory.Exists(Path.Combine(dir, "frontend")))
                return dir;
            var parent = Directory.GetParent(dir)?.FullName;
            if (parent is null || parent == dir) break;
            dir = parent;
        }
        return null;
    }

    private string? ResolveSetting(IReadOnlyDictionary<string, string> siteSettings, string key) =>
        siteSettings.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : config[key];

    private static bool ResolveBoolSetting(IReadOnlyDictionary<string, string> siteSettings, string key, bool fallback)
    {
        if (siteSettings.TryGetValue(key, out var value) && bool.TryParse(value, out var parsed))
            return parsed;
        return fallback;
    }
}
