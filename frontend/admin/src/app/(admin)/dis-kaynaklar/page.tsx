"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import {
  Plus, Pencil, Trash2, RefreshCw, Upload, Download, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, History, Database, FileSpreadsheet, Clock, Zap,
  CheckCircle, AlertCircle, X,
} from "lucide-react";
import { exportToExcel, readExcelFile } from "@/lib/excel";

interface ExternalSource {
  id: string;
  name: string;
  type: string;
  description?: string;
  config?: string;
  isActive: boolean;
  lastFetchedAt?: string;
  lastFetchedCount?: number;
  fetchSchedule: string;
  autoImportTarget?: string;
  nextScheduledFetchAt?: string;
  lastAutoImportAt?: string;
  createdDate: string;
  hasActiveJob: boolean;
  hasExcelFile: boolean;
}

interface ImportLog {
  id: string;
  targetEntity: string;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorMessage?: string;
  importedByUserEmail?: string;
  createdDate: string;
  totalRows: number;
  conflictStrategy: string;
  isJob: boolean;
  jobStatus?: string;   // Queued | Processing
  processedRows?: number;
  skipDiagnosticsJson?: string;
}

interface PreviewData {
  columns: string[];
  rows: Record<string, string>[];
  error?: string;
}

interface Toast { id: number; ok: boolean; text: string; }

interface ImportProgress {
  processed: number;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  mode: "chunked" | "async";
  jobId?: string;
  jobStatus?: string; // Queued | Processing | Completed | Failed
  skipReasons?: Record<string, number>;
  error?: string;
}

const PAGE_SIZE = 50;
const CHUNK_SIZE = 500;
const ASYNC_THRESHOLD = 5000; // rows above this go to RabbitMQ background job

const TARGET_ENTITIES = ["Product", "Category", "Brand", "Stock"];
const TARGET_LABELS: Record<string, string> = {
  Product: "Ürünler", Category: "Kategoriler", Brand: "Markalar", Stock: "Stok",
};

const SCHEDULE_LABELS: Record<string, string> = {
  None: "Zamanlanmış yok", Hourly: "Her saat", Daily: "Her gün", Weekly: "Her hafta",
};

const FIELD_SYNONYMS: Record<string, Record<string, string[]>> = {
  Product:  { Name: ["name","ad","urun adi","urun adı","ürün adi","ürün adı","urun"], SKU: ["sku","kod","barkod","urun kodu","ürün kodu","urun kod","ürün kod"], Price: ["price","fiyat","tutar","birim fiyat"], Description: ["description","açıklama"], Category: ["category","kategori"], Brand: ["brand","marka"] },
  Category: { Name: ["name","ad","kategori"], Slug: ["slug"], Description: ["description","açıklama"] },
  Brand:    { Name: ["name","ad","marka"], Description: ["description","açıklama"] },
  Stock:    { SKU: ["sku","kod","barkod","urun kodu","ürün kodu"], Quantity: ["quantity","adet","stok","miktar"] },
};

function normalizeTr(s: string): string {
  return s
    .replace(/İ/g, 'i').replace(/I/g, 'i')
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ç/g, 'c');
}

function autoMap(target: string, columns: string[]): Record<string, string> {
  const synonyms = FIELD_SYNONYMS[target] ?? {};
  const result: Record<string, string> = {};
  const colForms = columns.map(col => {
    const n = normalizeTr(col);
    return [n, n.replace(/_/g, ' '), n.replace(/_/g, '')];
  });
  for (const [field, variants] of Object.entries(synonyms)) {
    const normVariants = variants.map(normalizeTr);
    for (let i = 0; i < columns.length; i++) {
      if (normVariants.some(v => colForms[i].includes(v))) {
        result[field] = columns[i];
        break;
      }
    }
  }
  return result;
}

const EXCEL_TEMPLATES: Record<string, Record<string, string>[]> = {
  Product:  [{ Name: "Örnek Ürün 1", SKU: "PRD-001", Price: "149.90", Description: "Ürün açıklaması", Category: "Elektronik", Brand: "Apple", TaxRate: "20", IsActive: "true" }],
  Category: [{ Name: "Elektronik", Slug: "elektronik", Description: "Elektronik ürünler", ParentCategory: "" }],
  Brand:    [{ Name: "Apple", Description: "Apple marka ürünleri", WebsiteUrl: "https://apple.com" }],
  Stock:    [{ SKU: "PRD-001", Quantity: "50", CriticalThreshold: "5", Location: "A-01" }],
};

function downloadTemplate(entity: string) {
  exportToExcel(EXCEL_TEMPLATES[entity] ?? [], `sablon-${entity.toLowerCase()}`, `${entity} Şablonu`);
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatNextFetch(d?: string) {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  if (diff < 0) return "Yakında";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)} gün sonra`;
  if (h > 0) return `${h}s ${m}dk sonra`;
  return `${m} dk sonra`;
}

const CONFLICT_LABELS: Record<string, string> = {
  skip: "Mevcut atla", update: "Mevcut güncelle",
};

type FixType = "strategy_update" | "check_mapping" | "refetch" | "edit_source" | "none";
interface ErrorAnalysis { title: string; detail: string; fixType: FixType; fixLabel: string; }

function getSuggestion(error: string): ErrorAnalysis {
  const e = error.toLowerCase();
  if (e.includes("duplicate") || e.includes("unique") || e.includes("ix_") || e.includes("slug"))
    return {
      title: "Tekrar eden kayıt",
      detail: "Aynı isim veya slug'a sahip bir kayıt zaten mevcut. Çakışma stratejisi 'Mevcut olanı güncelle' olarak değiştirilirse var olan kayıtlar güncellenecek.",
      fixType: "strategy_update", fixLabel: "Stratejiyi 'Güncelle' Yap",
    };
  if (e.includes("foreign key") || e.includes("reference") || e.includes("constraint"))
    return {
      title: "İlişkili veri eksik",
      detail: "Bağımlı veriler (kategori, marka) henüz içe aktarılmamış. Önce bu tablolar aktarılmalı, ardından tekrar deneyin.",
      fixType: "check_mapping", fixLabel: "Alan Eşlemesini Kontrol Et",
    };
  if (e.includes("timeout") || e.includes("connection") || e.includes("bağlantı"))
    return {
      title: "Bağlantı hatası",
      detail: "API sunucusuna ulaşılamadı. İnternet bağlantınızı ve API URL'ini kontrol edin, ardından tekrar deneyin.",
      fixType: "refetch", fixLabel: "Tekrar Bağlan",
    };
  if (e.includes("unauthorized") || e.includes("403") || e.includes("401"))
    return {
      title: "Yetkilendirme hatası",
      detail: "API kimlik bilgileri (API key, Bearer token) hatalı veya süresi dolmuş. Kaynağı düzenleyip güncelleyin.",
      fixType: "edit_source", fixLabel: "Kaynağı Düzenle",
    };
  return {
    title: "Beklenmeyen hata",
    detail: "Aktarma parametrelerini ve alan eşlemesini kontrol edin. Sorun devam ederse sistem yöneticisiyle iletişime geçin.",
    fixType: "check_mapping", fixLabel: "Aktarma Sekmesine Git",
  };
}

interface SkipDiagnosticEntry { reason: string; count: number; suggestion: string; severity: "warn" | "info"; }

function analyzeSkipReasons(json: string | undefined): SkipDiagnosticEntry[] {
  if (!json) return [];
  let reasons: Record<string, number>;
  try { reasons = JSON.parse(json); } catch { return []; }
  return Object.entries(reasons).map(([reason, count]) => {
    const r = reason.toLowerCase();
    if (r.includes("kategori bulunamadı") || r.includes("kategori eksik") || r.includes("kategori alanı"))
      return { reason, count, severity: "warn",
        suggestion: "Önce Kategoriler hedefiyle bir aktarım yapın, ardından ürünleri tekrar aktarın." };
    if (r.includes("fiyat"))
      return { reason, count, severity: "warn",
        suggestion: "Fiyat sütununda virgül yerine nokta kullanın (örn: 99.90). Boş veya metin içeren hücreler atlanır." };
    if (r.includes("isim boş"))
      return { reason, count, severity: "warn",
        suggestion: "İsim alanı zorunludur. Kaynak veride boş ad satırlarını temizleyin veya 'Ad' sütununu doğru eşleyin." };
    if (r.includes("sku") || r.includes("ürün bulunamadı"))
      return { reason, count, severity: "warn",
        suggestion: "Stok aktarmadan önce ürünlerin sisteme eklenmiş olması gerekir. SKU sütununu doğru eşlediğinizden emin olun." };
    if (r.includes("adet"))
      return { reason, count, severity: "warn",
        suggestion: "Adet sütununda tam sayı olmalıdır. Boş veya ondalıklı değerler geçersizdir." };
    if (r.includes("çakışma"))
      return { reason, count, severity: "info",
        suggestion: "Mevcut kayıtları güncellemek için çakışma stratejisini 'Mevcut olanı güncelle' olarak değiştirin." };
    return { reason, count, severity: "info", suggestion: "Alan eşlemesini gözden geçirin." };
  });
}

function SkipDiagnosticsPanel({
  diagnostics,
  onDismiss,
}: {
  diagnostics: SkipDiagnosticEntry[];
  onSwitchToMapping: () => void;
  onDismiss: () => void;
}) {
  if (!diagnostics.length) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
          <AlertCircle size={12} /> Atlanan satır tanılama
        </span>
        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 transition" title="Kapat">
          <X size={13} />
        </button>
      </div>
      <div className="space-y-2">
        {diagnostics.map((d, i) => (
          <div key={i} className={`rounded-lg border px-3 py-2 text-[11px] ${
            d.severity === "warn"
              ? "bg-white border-amber-200"
              : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="font-semibold text-slate-800">{d.reason}</span>
              {d.count > 0 && (
                <span className={`shrink-0 font-bold px-1.5 py-0.5 rounded-full text-[10px] ${
                  d.severity === "warn" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                }`}>{d.count} satır</span>
              )}
            </div>
            <p className="text-slate-500 leading-relaxed">{d.suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const defaultConfig = (type: string) =>
  type === "RestApi" ? JSON.stringify({ url: "", headers: {}, dataPath: "" }, null, 2) : "";

export default function DisKaynaklarPage() {
  const { t } = useI18n();
  const [sources, setSources] = useState<ExternalSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editSource, setEditSource] = useState<ExternalSource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExternalSource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logsMap, setLogsMap] = useState<Record<string, ImportLog[]>>({});
  const [previewMap, setPreviewMap] = useState<Record<string, PreviewData>>({});
  const [fetching, setFetching] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<Record<string, ImportProgress>>({});
  const [cancellingJob, setCancellingJob] = useState<string | null>(null);
  const pollTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const logPollTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [mappingState, setMappingState] = useState<Record<string, Record<string, string>>>({});
  const [targetMap, setTargetMap] = useState<Record<string, string>>({});
  const [conflictMap, setConflictMap] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<Record<string, Set<number>>>({});
  const [selectedCols, setSelectedCols] = useState<Record<string, Set<string>>>({});
  const [tablePage, setTablePage] = useState<Record<string, number>>({});
  const [filterText, setFilterText] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<Record<string, "preview" | "history">>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((ok: boolean, text: string) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, ok, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<ExternalSource[]>("/api/admin/external-sources");
      setSources(data);
      // Auto-start polling for any source that still has an active job (survives page refresh)
      for (const src of data) {
        if (src.hasActiveJob) loadLogs(src.id);
      }
    } catch { setSources([]); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    return () => {
      Object.values(pollTimers.current).forEach(clearInterval);
      Object.values(logPollTimers.current).forEach(clearTimeout);
    };
  }, []);

  async function loadLogs(id: string) {
    try {
      const logs = await api.get<ImportLog[]>(`/api/admin/external-sources/${id}/logs`);
      setLogsMap(prev => ({ ...prev, [id]: logs }));

      // If there are active jobs, keep polling every 3s until they complete
      const hasActive = logs.some(l => l.isJob && (l.jobStatus === "Queued" || l.jobStatus === "Processing"));
      if (logPollTimers.current[id]) clearTimeout(logPollTimers.current[id]);
      if (hasActive) {
        logPollTimers.current[id] = setTimeout(() => loadLogs(id), 3000);
      } else {
        delete logPollTimers.current[id];
      }
    } catch { setLogsMap(prev => ({ ...prev, [id]: [] })); }
  }

  async function loadServerPreview(source: ExternalSource) {
    if (previewMap[source.id]) return; // already in memory
    if (!source.lastFetchedAt) return; // never had data
    setFetching(source.id);
    try {
      const data = await api.get<PreviewData>(`/api/admin/external-sources/${source.id}/preview`);
      if (data && !data.error) applyPreview(source.id, data, targetMap[source.id] || "Product");
      else if (data?.error) setPreviewMap(prev => ({ ...prev, [source.id]: data }));
    } catch { /* silent — user will see empty state */ }
    setFetching(null);
  }

  function switchTab(id: string, tab: "preview" | "history") {
    setActiveTab(prev => ({ ...prev, [id]: tab }));
    setExpandedId(id);
    if (tab === "history") loadLogs(id);
  }

  function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    loadLogs(id);
    const source = sources.find(s => s.id === id);
    // If a live job is running, default to history tab so user can track progress
    const hasLiveJob = source?.hasActiveJob || logsMap[id]?.some(l => l.isJob && (l.jobStatus === "Queued" || l.jobStatus === "Processing"));
    setActiveTab(prev => ({ ...prev, [id]: prev[id] ?? (hasLiveJob ? "history" : "preview") }));
    // Restore preview from server if not in memory (handles page refresh)
    if (source) loadServerPreview(source);
  }

  function applyPreview(id: string, data: PreviewData, defaultTarget = "Product") {
    setPreviewMap(prev => ({ ...prev, [id]: data }));
    const target = targetMap[id] || defaultTarget;
    if (!targetMap[id]) setTargetMap(prev => ({ ...prev, [id]: target }));
    // Start with no rows selected — user must explicitly choose
    setSelectedRows(prev => ({ ...prev, [id]: new Set<number>() }));
    setSelectedCols(prev => ({ ...prev, [id]: new Set(data.columns) }));
    setTablePage(prev => ({ ...prev, [id]: 0 }));
    const auto = autoMap(target, data.columns);
    if (Object.keys(auto).length > 0)
      setMappingState(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...auto } }));
    // Auto-expand to preview tab
    setExpandedId(id);
    setActiveTab(prev => ({ ...prev, [id]: "preview" }));
    loadLogs(id);
  }

  async function handleFetch(source: ExternalSource) {
    setFetching(source.id);
    try {
      const data = await api.post<PreviewData>(`/api/admin/external-sources/${source.id}/fetch`, {});
      applyPreview(source.id, data);
      if (!data.error) toast(true, `${data.rows.length} satır çekildi.`);
    } catch (e: unknown) {
      applyPreview(source.id, { columns: [], rows: [], error: e instanceof Error ? e.message : "Hata oluştu" });
    }
    setFetching(null);
  }

  async function handleImport(sourceId: string, importAll = false) {
    const preview = previewMap[sourceId];
    if (!preview?.rows.length) return;
    const target = targetMap[sourceId] || "Product";
    const mapping = mappingState[sourceId] || {};
    const conflict = conflictMap[sourceId] || "skip";
    const selCols = selectedCols[sourceId] ?? new Set(preview.columns);

    const sourceRows = importAll
      ? preview.rows
      : preview.rows.filter((_, i) => (selectedRows[sourceId] ?? new Set<number>()).has(i));

    if (!sourceRows.length) {
      toast(false, importAll ? "Aktarılacak veri yok." : "Önce aktarmak istediğiniz satırları seçin.");
      return;
    }

    const rowsToImport = sourceRows.map(row => {
      const filtered: Record<string, string> = {};
      for (const col of Array.from(selCols)) {
        if (row[col] !== undefined) filtered[col] = row[col];
      }
      return filtered;
    });

    setImporting(sourceId);

    if (rowsToImport.length > ASYNC_THRESHOLD) {
      await handleAsyncImport(sourceId, rowsToImport, target, mapping, conflict);
    } else {
      await handleChunkedImport(sourceId, rowsToImport, target, mapping, conflict);
    }

    setImporting(null);
  }

  async function handleChunkedImport(
    sourceId: string,
    rows: Record<string, string>[],
    target: string,
    mapping: Record<string, string>,
    conflict: string,
  ) {
    const chunks: Record<string, string>[][] = [];
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) chunks.push(rows.slice(i, i + CHUNK_SIZE));

    let totalIns = 0, totalUpd = 0, totalSkip = 0;
    let mergedSkipReasons: Record<string, number> = {};

    setImportProgress(prev => ({
      ...prev,
      [sourceId]: { processed: 0, total: rows.length, inserted: 0, updated: 0, skipped: 0, mode: "chunked" },
    }));

    try {
      for (let i = 0; i < chunks.length; i++) {
        const result = await api.post<{ insertedCount: number; updatedCount: number; skippedCount: number; error?: string; skipReasons?: Record<string, number> }>(
          `/api/admin/external-sources/${sourceId}/import`,
          { targetEntity: target, rows: chunks[i], fieldMapping: mapping, conflictStrategy: conflict }
        );
        if (result.error) {
          setImportProgress(prev => ({
            ...prev,
            [sourceId]: {
              processed: Math.min((i + 1) * CHUNK_SIZE, rows.length),
              total: rows.length,
              inserted: totalIns, updated: totalUpd, skipped: totalSkip,
              mode: "chunked", error: result.error,
              skipReasons: mergedSkipReasons,
            },
          }));
          toast(false, `Aktarım hatası (parça ${i + 1}/${chunks.length}): ${result.error}`);
          break;
        }
        totalIns += result.insertedCount;
        totalUpd += result.updatedCount;
        totalSkip += result.skippedCount;
        if (result.skipReasons) {
          for (const [k, v] of Object.entries(result.skipReasons))
            mergedSkipReasons[k] = (mergedSkipReasons[k] ?? 0) + v;
        }
        setImportProgress(prev => ({
          ...prev,
          [sourceId]: {
            processed: Math.min((i + 1) * CHUNK_SIZE, rows.length),
            total: rows.length,
            inserted: totalIns, updated: totalUpd, skipped: totalSkip,
            mode: "chunked", skipReasons: mergedSkipReasons,
          },
        }));
      }
      // Leave progress visible with diagnostics; it's cleared when user dismisses or re-imports
      if (totalSkip === 0 && !Object.keys(mergedSkipReasons).length)
        toast(true, `Aktarıldı — +${totalIns} eklendi, ~${totalUpd} güncellendi`);
      else
        toast(true, `Aktarım tamamlandı — +${totalIns} eklendi, ~${totalUpd} güncellendi, ⊘${totalSkip} atlandı`);
      loadLogs(sourceId);
      load();
    } catch (e: unknown) {
      toast(false, e instanceof Error ? e.message : "İçe aktarma hatası");
      setImportProgress(prev => { const n = { ...prev }; delete n[sourceId]; return n; });
    }
  }

  async function handleAsyncImport(
    sourceId: string,
    rows: Record<string, string>[],
    target: string,
    mapping: Record<string, string>,
    conflict: string,
  ) {
    try {
      const { jobId } = await api.post<{ jobId: string }>(
        `/api/admin/external-sources/${sourceId}/import-async`,
        { targetEntity: target, rows, fieldMapping: mapping, conflictStrategy: conflict }
      );

      setImportProgress(prev => ({
        ...prev,
        [sourceId]: { processed: 0, total: rows.length, inserted: 0, updated: 0, skipped: 0, mode: "async", jobId, jobStatus: "Queued" },
      }));
      toast(true, `${rows.length.toLocaleString("tr-TR")} satır kuyruğa alındı. Arka planda işleniyor...`);

      // Poll for progress every 2 seconds
      const timer = setInterval(async () => {
        try {
          const status = await api.get<{
            status: string; totalRows: number; processedRows: number;
            insertedCount: number; updatedCount: number; skippedCount: number; errorMessage?: string;
          }>(`/api/admin/external-sources/import-jobs/${jobId}`);

          setImportProgress(prev => ({
            ...prev,
            [sourceId]: {
              processed: status.processedRows,
              total: status.totalRows,
              inserted: status.insertedCount,
              updated: status.updatedCount,
              skipped: status.skippedCount,
              mode: "async",
              jobId,
              jobStatus: status.status,
            },
          }));

          if (status.status === "Completed" || status.status === "Failed") {
            clearInterval(timer);
            delete pollTimers.current[sourceId];
            if (status.status === "Completed") {
              toast(true, `Tamamlandı — +${status.insertedCount} eklendi, ~${status.updatedCount} güncellendi, ⊘${status.skippedCount} atlandı`);
            } else {
              toast(false, `Hata: ${status.errorMessage ?? "Bilinmeyen hata"}`);
            }
            setImportProgress(prev => { const n = { ...prev }; delete n[sourceId]; return n; });
            loadLogs(sourceId);
            load();
          }
        } catch {
          // polling failure — keep trying
        }
      }, 2000);

      pollTimers.current[sourceId] = timer;
    } catch (e: unknown) {
      toast(false, e instanceof Error ? e.message : "Kuyruğa alma hatası");
      setImportProgress(prev => { const n = { ...prev }; delete n[sourceId]; return n; });
    }
  }

  function toggleRow(sourceId: string, idx: number) {
    setSelectedRows(prev => {
      const s = new Set(prev[sourceId] ?? []);
      if (s.has(idx)) s.delete(idx); else s.add(idx);
      return { ...prev, [sourceId]: s };
    });
  }

  function toggleCol(sourceId: string, col: string, preview: PreviewData) {
    setSelectedCols(prev => {
      const s = new Set(prev[sourceId] ?? preview.columns);
      if (s.has(col)) s.delete(col); else s.add(col);
      return { ...prev, [sourceId]: s };
    });
  }

  function togglePageRows(sourceId: string, pageIdxs: number[], allSelected: boolean) {
    setSelectedRows(prev => {
      const s = new Set(prev[sourceId] ?? []);
      if (allSelected) pageIdxs.forEach(i => s.delete(i));
      else pageIdxs.forEach(i => s.add(i));
      return { ...prev, [sourceId]: s };
    });
  }

  function selectAllRows(sourceId: string, count: number) {
    setSelectedRows(prev => ({ ...prev, [sourceId]: new Set(Array.from({ length: count }, (_, i) => i)) }));
  }

  function selectFilteredRows(sourceId: string, idxs: number[]) {
    // Replace entire selection with filtered rows only
    setSelectedRows(prev => ({ ...prev, [sourceId]: new Set(idxs) }));
  }

  function deselectAllRows(sourceId: string) {
    setSelectedRows(prev => ({ ...prev, [sourceId]: new Set<number>() }));
  }

  function setMapping(sourceId: string, ourField: string, sourceCol: string) {
    setMappingState(prev => ({ ...prev, [sourceId]: { ...(prev[sourceId] ?? {}), [ourField]: sourceCol } }));
  }

  function handleTargetChange(sourceId: string, newTarget: string) {
    setTargetMap(prev => ({ ...prev, [sourceId]: newTarget }));
    const preview = previewMap[sourceId];
    if (preview) {
      const auto = autoMap(newTarget, preview.columns);
      setMappingState(prev => ({ ...prev, [sourceId]: auto }));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/external-sources/${deleteTarget.id}`);
      toast(true, `"${deleteTarget.name}" silindi.`);
      setDeleteTarget(null);
      load();
    } catch (e: unknown) {
      toast(false, e instanceof Error ? e.message : "Silme hatası");
    }
    setDeleting(false);
  }

  async function cancelJob(jobId: string, sourceId: string) {
    setCancellingJob(jobId);
    try {
      await api.post(`/api/admin/external-sources/import-jobs/${jobId}/cancel`);
      toast(true, "Kuyruk iptal edildi.");
      await loadLogs(sourceId);
    } catch (e: unknown) {
      toast(false, e instanceof Error ? e.message : "İptal hatası");
    }
    setCancellingJob(null);
  }

  const fields = (target: string) => Object.keys(FIELD_SYNONYMS[target] ?? {});

  return (
    <div className="space-y-5">
      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-white pointer-events-auto max-w-sm ${t.ok ? "bg-teal-600" : "bg-red-500"}`}>
            {t.ok ? <CheckCircle size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav./dis-kaynaklar", "Dış Kaynaklar")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Excel veya REST API üzerinden veri içe aktarın</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowHelp(v => !v)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border transition ${
              showHelp ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current shrink-0">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 11.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm.75-3.25a.75.75 0 0 1-1.5 0V5.75a.75.75 0 0 1 1.5 0v3.5z"/>
            </svg>
            Nasıl Kullanılır?
          </button>
          <div className="relative">
            <button onClick={() => setShowTemplateMenu(v => !v)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
              <FileSpreadsheet size={15} /> Şablon İndir <ChevronDown size={13} />
            </button>
            {showTemplateMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 min-w-[160px] overflow-hidden">
                {TARGET_ENTITIES.map(e => (
                  <button key={e} onClick={() => { downloadTemplate(e); setShowTemplateMenu(false); }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition">
                    <Download size={13} className="text-emerald-600" /> {TARGET_LABELS[e]} Şablonu
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setEditSource(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Plus size={15} /> Yeni Kaynak
          </button>
        </div>
      </div>

      {/* Help panel */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-blue-900 text-sm">Dış Kaynaklar Kullanım Kılavuzu</h3>
            <button onClick={() => setShowHelp(false)} className="text-blue-400 hover:text-blue-700 shrink-0"><X size={15} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-blue-800">
            {/* Excel flow */}
            <div className="bg-white/70 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-amber-700 mb-1">
                <FileSpreadsheet size={14} /> Excel ile İçe Aktarma
              </div>
              {[
                ["1", "Şablon İndir butonuyla aktarmak istediğiniz tür için şablonu indirin (Ürünler, Kategoriler vb.)"],
                ["2", "Şablonu doldurup kaydedin; sütun adlarını değiştirmeyin"],
                ["3", "Yeni Kaynak → Excel seçin, dosyayı yükleyin — önizleme anında görünür. Düzenlemede mevcut dosyayı İndir butonu ile indirebilirsiniz"],
                ["4", "Hedefi (Ürünler/Kategoriler…) ve alan eşlemesini onaylayın; otomatik eşleme devrede"],
                ["5", "Aktarmak istediğiniz satır ve sütunları işaretleyip Aktar'a tıklayın"],
              ].map(([n, text]) => (
                <div key={n} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center shrink-0 text-[10px]">{n}</span>
                  <p className="leading-snug">{text}</p>
                </div>
              ))}
            </div>
            {/* REST flow */}
            <div className="bg-white/70 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-violet-700 mb-1">
                <RefreshCw size={14} /> REST API ile İçe Aktarma
              </div>
              {[
                ["1", "Yeni Kaynak → REST API seçin, endpoint URL'ini girin"],
                ["2", "Gerekiyorsa Veri Yolu girin (örn: data.items) ve API key başlığı ekleyin"],
                ["3", "Veri Çek & Önizle butonuna tıklayın (kaydolmadan önce de test edilebilir) — sütunlar ve ilk satırlar modal'da görünür"],
                ["4", "Kaydedin; kaynağı açıp sütun/satır seçimi yapın, alan eşlemesini kontrol edin"],
                ["5", "Gelişmiş ayarlardan otomatik zamanlanmış çekim ve aktarma tanımlayabilirsiniz"],
              ].map(([n, text]) => (
                <div key={n} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center shrink-0 text-[10px]">{n}</span>
                  <p className="leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-blue-700 border-t border-blue-200 pt-3">
            <span className="flex items-center gap-1"><CheckCircle size={11} className="text-teal-600" /> <strong>Ürünler aktarmadan önce</strong> Kategoriler ve Markalar aktarılmalıdır</span>
            <span className="flex items-center gap-1"><CheckCircle size={11} className="text-teal-600" /> Çakışma stratejisi <strong>Atla</strong>: mevcut kayıtlara dokunmaz</span>
            <span className="flex items-center gap-1"><CheckCircle size={11} className="text-teal-600" /> Çakışma stratejisi <strong>Güncelle</strong>: mevcut kayıtları üzerine yazar</span>
            <span className="flex items-center gap-1"><CheckCircle size={11} className="text-teal-600" /> Aktarılan kayıtlar <strong>Ürünler / Kategoriler / Markalar</strong> listesinde kaynak adıyla işaretlenir</span>
            <span className="flex items-center gap-1"><CheckCircle size={11} className="text-teal-600" /> <strong>5.000+ satır</strong> otomatik olarak arka planda (kuyruk) işlenir, ilerleme canlı takip edilir</span>
            <span className="flex items-center gap-1"><AlertCircle size={11} className="text-amber-600" /> Aktarma geçmişi her kaynakta ayrı loglanır, hata varsa çözüm önerisi gösterilir</span>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Yükleniyor...</div>
      ) : sources.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Database size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">Henüz kaynak eklenmedi</p>
          <p className="text-xs">REST API veya Excel şablonundan veri aktarmak için kaynak ekleyin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map(source => {
            const preview = previewMap[source.id];
            const isExpanded = expandedId === source.id;
            const target = targetMap[source.id] || "Product";
            const mapping = mappingState[source.id] || {};
            const fieldList = fields(target);
            const hasSchedule = source.fetchSchedule && source.fetchSchedule !== "None";
            const hasLiveJob = source.hasActiveJob || logsMap[source.id]?.some(l => l.isJob && (l.jobStatus === "Queued" || l.jobStatus === "Processing"));
            const nextFetch = formatNextFetch(source.nextScheduledFetchAt);

            // Grid state for this source
            const selRowSet = selectedRows[source.id];
            const selColSet = selectedCols[source.id];
            const filterTxt = (filterText[source.id] ?? "").toLowerCase().trim();

            // Compute filtered indices (absolute indices into preview.rows)
            const filteredIdxs: number[] = preview
              ? preview.rows.reduce<number[]>((acc, row, i) => {
                  if (!filterTxt || Object.values(row).some(v => v.toLowerCase().includes(filterTxt)))
                    acc.push(i);
                  return acc;
                }, [])
              : [];
            const isFiltered = filterTxt.length > 0;
            const filteredCount = filteredIdxs.length;
            const totalPages = preview ? Math.ceil(filteredCount / PAGE_SIZE) : 0;
            const curPage = Math.min(tablePage[source.id] ?? 0, Math.max(0, totalPages - 1));
            const pageFilteredIdxs = filteredIdxs.slice(curPage * PAGE_SIZE, (curPage + 1) * PAGE_SIZE);
            const pageRowsData = pageFilteredIdxs.map(i => preview!.rows[i]);
            const allOnPageSelected = pageFilteredIdxs.length > 0 && selRowSet
              ? pageFilteredIdxs.every(i => selRowSet.has(i))
              : pageFilteredIdxs.length > 0;
            const selRowCount = selRowSet?.size ?? 0;
            const selColCount = selColSet?.size ?? preview?.columns.length ?? 0;
            const progress = importProgress[source.id];
            const isAsync = (preview?.rows.length ?? 0) > ASYNC_THRESHOLD;

            return (
              <div key={source.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header row */}
                <div className="flex items-center justify-between px-6 py-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                      source.type === "RestApi" ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700"
                    }`}>{source.type === "RestApi" ? "REST" : "Excel"}</span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 truncate">{source.name}</p>
                        {!source.isActive && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">Pasif</span>}
                        {hasLiveJob && (
                          <span className="flex items-center gap-1 text-[10px] bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                            <RefreshCw size={8} className="animate-spin" />
                            Aktarım sürüyor
                          </span>
                        )}
                        {hasSchedule && (
                          <span className="flex items-center gap-1 text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full shrink-0">
                            <Clock size={9} />
                            {SCHEDULE_LABELS[source.fetchSchedule]}
                            {source.autoImportTarget && <span className="ml-1 text-teal-500">→ {TARGET_LABELS[source.autoImportTarget]}</span>}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {source.description && <p className="text-xs text-slate-500 truncate">{source.description}</p>}
                        {source.lastFetchedAt && (
                          <span className="text-xs text-slate-400">
                            Son çekim: {formatDate(source.lastFetchedAt)} ({source.lastFetchedCount ?? 0} satır)
                          </span>
                        )}
                        {hasSchedule && nextFetch && (
                          <span className="text-xs text-teal-600 flex items-center gap-1">
                            <Zap size={10} /> Sonraki: {nextFetch}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditSource(source); setShowModal(true); }} title="Düzenle"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteTarget(source)} title="Sil"
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition">
                      <Trash2 size={15} />
                    </button>
                    <button onClick={() => toggleExpand(source.id)} title={isExpanded ? "Kapat" : "Detaylar"}
                      className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition relative">
                      {/* Red dot if there are error logs */}
                      {!isExpanded && logsMap[source.id]?.some(l => l.errorMessage) && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400" />
                      )}
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible body — tabs */}
                {isExpanded && (
                  <div className="border-t border-slate-100">

                    {/* Tab bar */}
                    {(() => {
                      const logs = logsMap[source.id];
                      const errorCount = logs?.filter(l => l.errorMessage).length ?? 0;
                      const currentTab = activeTab[source.id] ?? "preview";
                      return (
                        <div className="flex border-b border-slate-100 px-4 bg-slate-50/60">
                          {([
                            { key: "preview" as const, label: "Veri & Aktarma", badge: preview?.rows.length, badgeRed: false },
                            { key: "history" as const, label: "Aktarma Geçmişi", badge: logs?.length, badgeRed: errorCount > 0 },
                          ]).map(tab => (
                            <button key={tab.key}
                              onClick={() => switchTab(source.id, tab.key)}
                              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-px ${
                                currentTab === tab.key
                                  ? "border-teal-500 text-teal-700"
                                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                              }`}>
                              {tab.label}
                              {tab.badge !== undefined && tab.badge > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                  tab.badgeRed ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-600"
                                }`}>{tab.badge}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    {/* ── Preview tab ── */}
                    {(activeTab[source.id] ?? "preview") === "preview" && (
                      <div className="px-6 py-5 space-y-4">
                        {fetching === source.id ? (
                          <div className="text-center py-10 text-slate-400 space-y-3">
                            <RefreshCw size={28} className="mx-auto animate-spin opacity-40" />
                            <p className="text-sm font-medium">Veriler yükleniyor...</p>
                          </div>
                        ) : !preview ? (
                          <div className="text-center py-10 text-slate-400 space-y-2">
                            <Database size={32} className="mx-auto opacity-25" />
                            <p className="text-sm font-medium">Henüz veri çekilmedi</p>
                            <p className="text-xs">
                              {source.type === "RestApi"
                                ? 'Düzenle modalını açıp "Veri Çek & Önizle" butonuyla API\'den veri alın'
                                : 'Düzenle modalını açıp yeni bir Excel dosyası yükleyin'}
                            </p>
                          </div>
                        ) : preview.error ? (
                          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            {preview.error}
                          </div>
                        ) : (
                      <>
                        {/* Grid toolbar */}
                        <div className="space-y-2">
                          {/* Filter input */}
                          <div className="relative">
                            <svg viewBox="0 0 16 16" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 fill-current text-slate-400 pointer-events-none">
                              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
                            </svg>
                            <input
                              type="text"
                              value={filterText[source.id] ?? ""}
                              onChange={e => {
                                setFilterText(prev => ({ ...prev, [source.id]: e.target.value }));
                                setTablePage(prev => ({ ...prev, [source.id]: 0 }));
                              }}
                              placeholder="Satırlarda filtrele..."
                              className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-slate-400"
                            />
                            {filterTxt && (
                              <button
                                onClick={() => { setFilterText(prev => ({ ...prev, [source.id]: "" })); setTablePage(prev => ({ ...prev, [source.id]: 0 })); }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isFiltered ? (
                                <button
                                  onClick={() => selectFilteredRows(source.id, filteredIdxs)}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition font-medium border border-amber-200"
                                >
                                  Filtrelenenleri Seç ({filteredCount.toLocaleString("tr-TR")})
                                </button>
                              ) : (
                                <button
                                  onClick={() => selectAllRows(source.id, preview.rows.length)}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-100 hover:text-teal-700 text-slate-600 transition font-medium"
                                >
                                  Tümünü Seç
                                </button>
                              )}
                              <button
                                onClick={() => deselectAllRows(source.id)}
                                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 transition font-medium"
                              >
                                Seçimi Kaldır
                              </button>
                              <span className="text-xs text-slate-500">
                                <span className="font-semibold text-teal-600">{selRowCount.toLocaleString("tr-TR")}</span>
                                <span className="text-slate-400"> seçili</span>
                                {isFiltered && (
                                  <span className="text-amber-600"> · {filteredCount.toLocaleString("tr-TR")} filtrelendi</span>
                                )}
                                <span className="text-slate-400"> / {preview.rows.length.toLocaleString("tr-TR")} toplam</span>
                                <span className="mx-1.5 text-slate-300">·</span>
                                <span className="font-semibold text-violet-600">{selColCount}</span>
                                <span className="text-slate-400">/{preview.columns.length} sütun</span>
                              </span>
                            </div>
                            {totalPages > 1 && (
                              <div className="flex items-center gap-1 text-xs">
                                <button
                                  disabled={curPage === 0}
                                  onClick={() => setTablePage(prev => ({ ...prev, [source.id]: curPage - 1 }))}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition"
                                >
                                  <ChevronLeft size={13} />
                                </button>
                                <span className="px-2 text-slate-500 tabular-nums">
                                  {curPage + 1} / {totalPages}
                                  {isFiltered && <span className="text-amber-500 ml-1">({filteredCount.toLocaleString("tr-TR")} satır)</span>}
                                </span>
                                <button
                                  disabled={curPage === totalPages - 1}
                                  onClick={() => setTablePage(prev => ({ ...prev, [source.id]: curPage + 1 }))}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition"
                                >
                                  <ChevronRight size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Full data grid */}
                        <div className="overflow-auto rounded-xl border border-slate-200 max-h-[460px]">
                          <table className="text-xs w-full min-w-max">
                            <thead className="sticky top-0 z-10 bg-slate-100">
                              <tr>
                                {/* Row select all checkbox */}
                                <th className="px-2.5 py-2.5 w-8 border-r border-slate-200 text-center">
                                  <input
                                    type="checkbox"
                                    checked={allOnPageSelected}
                                    onChange={() => togglePageRows(source.id, pageFilteredIdxs, allOnPageSelected)}
                                    className="accent-teal-600 cursor-pointer"
                                    title="Sayfadaki tümünü seç/kaldır"
                                  />
                                </th>
                                {/* Row number */}
                                <th className="px-2 py-2.5 w-10 border-r border-slate-200 text-slate-400 font-normal text-center">#</th>
                                {/* Column headers — click to toggle inclusion */}
                                {preview.columns.map(col => {
                                  const isColSel = selColSet ? selColSet.has(col) : true;
                                  return (
                                    <th
                                      key={col}
                                      onClick={() => toggleCol(source.id, col, preview)}
                                      title={isColSel ? "Tıkla: sütunu çıkar" : "Tıkla: sütunu dahil et"}
                                      className={`px-3 py-2.5 text-left whitespace-nowrap cursor-pointer select-none transition border-r border-slate-200 last:border-r-0 group ${
                                        isColSel
                                          ? "text-slate-700 font-medium hover:bg-slate-200"
                                          : "text-slate-300 font-normal bg-slate-50/80"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition ${
                                          isColSel
                                            ? "border-teal-500 bg-teal-500"
                                            : "border-slate-300 bg-white"
                                        }`}>
                                          {isColSel && (
                                            <svg viewBox="0 0 10 8" className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                                              <polyline points="1,4 4,7 9,1" />
                                            </svg>
                                          )}
                                        </span>
                                        <span className={isColSel ? "" : "line-through"}>{col}</span>
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {pageRowsData.map((row, pageIdx) => {
                                const absIdx = pageFilteredIdxs[pageIdx];
                                const isRowSel = selRowSet ? selRowSet.has(absIdx) : true;
                                return (
                                  <tr
                                    key={absIdx}
                                    onClick={() => toggleRow(source.id, absIdx)}
                                    className={`cursor-pointer transition-colors ${
                                      isRowSel ? "bg-teal-50/40 hover:bg-teal-50/70" : "hover:bg-slate-50/80"
                                    }`}
                                  >
                                    <td className="px-2.5 py-1.5 text-center border-r border-slate-100" onClick={e => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={isRowSel}
                                        onChange={() => toggleRow(source.id, absIdx)}
                                        className="accent-teal-600 cursor-pointer"
                                      />
                                    </td>
                                    <td className="px-2 py-1.5 text-slate-300 text-center border-r border-slate-100 tabular-nums select-none">
                                      {absIdx + 1}
                                    </td>
                                    {preview.columns.map(col => {
                                      const isColSel = selColSet ? selColSet.has(col) : true;
                                      return (
                                        <td
                                          key={col}
                                          className={`px-3 py-1.5 max-w-[200px] truncate border-r border-slate-100 last:border-r-0 transition-colors ${
                                            isColSel
                                              ? isRowSel ? "text-slate-800" : "text-slate-500"
                                              : "text-slate-250 opacity-30"
                                          }`}
                                          title={row[col] ?? ""}
                                        >
                                          {row[col] ?? ""}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mapping + import config */}
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                          <p className="text-xs font-semibold text-slate-600">Aktarma Ayarları</p>
                          <div className="flex items-center gap-4 flex-wrap">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Hedef</label>
                              <select value={target} onChange={e => handleTargetChange(source.id, e.target.value)}
                                className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                                {TARGET_ENTITIES.map(t => <option key={t} value={t}>{TARGET_LABELS[t]}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Çakışma stratejisi</label>
                              <select value={conflictMap[source.id] || "skip"}
                                onChange={e => setConflictMap(prev => ({ ...prev, [source.id]: e.target.value }))}
                                className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                                <option value="skip">Mevcut olanı atla</option>
                                <option value="update">Mevcut olanı güncelle</option>
                              </select>
                            </div>
                          </div>

                          {/* Field mapping — only shows selected columns */}
                          <div>
                            <label className="block text-xs text-slate-500 mb-2">
                              Alan eşlemesi
                              <span className="ml-1 text-teal-600">(otomatik algılandı)</span>
                              {selColCount < preview.columns.length && (
                                <span className="ml-1 text-violet-500">· yalnızca seçili sütunlar</span>
                              )}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                              {fieldList.map(field => {
                                const activeCols = preview.columns.filter(c => selColSet ? selColSet.has(c) : true);
                                return (
                                  <div key={field}>
                                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">{field}</label>
                                    <select value={mapping[field] || ""}
                                      onChange={e => setMapping(source.id, field, e.target.value)}
                                      className={`w-full border rounded-xl px-2 py-1.5 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                                        mapping[field] && activeCols.includes(mapping[field])
                                          ? "border-teal-300 bg-teal-50/50"
                                          : mapping[field] && !activeCols.includes(mapping[field])
                                            ? "border-amber-300 bg-amber-50/50"
                                            : "border-slate-300"
                                      }`}>
                                      <option value="">— Eşleme yok —</option>
                                      {activeCols.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Progress bar — shown while importing or after with diagnostics */}
                        {progress && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-semibold flex items-center gap-1.5 ${progress.error ? "text-red-600" : "text-teal-700"}`}>
                                {importing === source.id
                                  ? <><RefreshCw size={12} className="animate-spin" />{progress.mode === "async" ? `Arka planda işleniyor${progress.jobStatus ? ` · ${progress.jobStatus}` : ""}` : "Aktarılıyor..."}</>
                                  : progress.error
                                    ? <><AlertCircle size={12} /> Aktarım hatası</>
                                    : progress.skipped > 0
                                      ? <><AlertCircle size={12} className="text-amber-500" /> Aktarım tamamlandı — bazı satırlar atlandı</>
                                      : <><CheckCircle size={12} /> Aktarım tamamlandı</>
                                }
                              </span>
                              <span className="text-slate-500 tabular-nums">
                                {progress.processed.toLocaleString("tr-TR")} / {progress.total.toLocaleString("tr-TR")} satır
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 rounded-full ${progress.error ? "bg-red-400" : "bg-teal-500"}`}
                                style={{ width: `${progress.total > 0 ? (progress.processed / progress.total) * 100 : 0}%` }}
                              />
                            </div>
                            <div className="flex gap-3 text-[10px] text-slate-500">
                              <span className="text-green-600 font-medium">+{progress.inserted.toLocaleString("tr-TR")} eklendi</span>
                              <span className="text-blue-500 font-medium">~{progress.updated.toLocaleString("tr-TR")} güncellendi</span>
                              {progress.skipped > 0 && <span className="text-amber-600 font-medium">⊘{progress.skipped.toLocaleString("tr-TR")} atlandı</span>}
                            </div>
                            {/* Skip reason diagnostics */}
                            {progress.skipReasons && Object.keys(progress.skipReasons).length > 0 && (
                              <SkipDiagnosticsPanel
                                diagnostics={analyzeSkipReasons(JSON.stringify(progress.skipReasons))}
                                onSwitchToMapping={() => {}}
                                onDismiss={() => setImportProgress(prev => { const n = { ...prev }; delete n[source.id]; return n; })}
                              />
                            )}
                            {progress.error && (
                              <SkipDiagnosticsPanel
                                diagnostics={[{ reason: "Aktarım durdu", count: 0, severity: "warn", suggestion: getSuggestion(progress.error).detail }]}
                                onSwitchToMapping={() => {}}
                                onDismiss={() => setImportProgress(prev => { const n = { ...prev }; delete n[source.id]; return n; })}
                              />
                            )}
                          </div>
                        )}

                        {/* Import action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Import selected — only active when rows are checked */}
                          <button
                            onClick={() => handleImport(source.id, false)}
                            disabled={importing === source.id || selRowCount === 0}
                            title={selRowCount === 0 ? "Önce tabloda satır seçin" : undefined}
                            className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-40 shadow bg-teal-600 hover:bg-teal-700 disabled:cursor-not-allowed"
                          >
                            {importing === source.id ? (
                              <><RefreshCw size={15} className="animate-spin" /> İşleniyor...</>
                            ) : (
                              <><Download size={15} /> {selRowCount > 0 ? `${selRowCount.toLocaleString("tr-TR")} Seçiliyi Aktar` : "Seçili Satırları Aktar"}</>
                            )}
                          </button>

                          {/* Import all — bypasses selection, always available */}
                          {(() => {
                            const allCount = preview?.rows.length ?? 0;
                            const allAsync = allCount > ASYNC_THRESHOLD;
                            return (
                              <button
                                onClick={() => handleImport(source.id, true)}
                                disabled={importing === source.id || allCount === 0}
                                className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-40 shadow border ${
                                  allAsync
                                    ? "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {allAsync ? <Zap size={15} /> : <Download size={15} />}
                                Tümünü Aktar ({allCount.toLocaleString("tr-TR")})
                              </button>
                            );
                          })()}
                        </div>
                        {selRowCount === 0 && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            Tabloda satır seçerek yalnızca seçilileri aktarabilir, ya da &quot;Tümünü Aktar&quot; ile tüm listeyi gönderebilirsiniz.
                          </p>
                        )}
                        {preview && preview.rows.length > ASYNC_THRESHOLD && (
                          <p className="text-[10px] text-violet-500 flex items-center gap-1">
                            <Zap size={9} /> {preview.rows.length.toLocaleString("tr-TR")} satır eşiği aşıyor — RabbitMQ kuyruğuna gönderilecek, tarayıcıyı kapatabilirsiniz
                          </p>
                        )}
                      </>
                        )}
                      </div>
                    )}

                    {/* ── History tab ── */}
                    {(activeTab[source.id] ?? "preview") === "history" && (
                      <div className="px-6 py-5">
                        {!logsMap[source.id] ? (
                          <p className="text-xs text-slate-400 text-center py-6">Yükleniyor...</p>
                        ) : logsMap[source.id].length === 0 ? (
                          <div className="text-center py-10 text-slate-400">
                            <History size={28} className="mx-auto mb-2 opacity-25" />
                            <p className="text-sm">Henüz aktarma yapılmamış.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {logsMap[source.id].map(log => {
                              const isLive = log.isJob && (log.jobStatus === "Queued" || log.jobStatus === "Processing");
                              const hasError = !!log.errorMessage;
                              const total = log.totalRows || (log.insertedCount + log.updatedCount + log.skippedCount);
                              const processed = isLive ? (log.processedRows ?? 0) : (log.insertedCount + log.updatedCount + log.skippedCount);
                              const successRate = total > 0 ? Math.round(((log.insertedCount + log.updatedCount) / total) * 100) : 0;
                              const analysis = hasError ? getSuggestion(log.errorMessage!) : null;
                              const isAuto = !log.importedByUserEmail;

                              // ── Live / in-progress job card ──
                              if (isLive) return (
                                <div key={log.id} className="rounded-xl border border-violet-200 bg-violet-50/40 overflow-hidden">
                                  <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <RefreshCw size={14} className="text-violet-500 animate-spin shrink-0" />
                                      <span className="text-sm font-semibold text-slate-800">
                                        {TARGET_LABELS[log.targetEntity] ?? log.targetEntity}
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold flex items-center gap-1">
                                        <Zap size={8} />
                                        {log.jobStatus === "Queued" ? "Kuyrukta" : "İşleniyor"}
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                                        {CONFLICT_LABELS[log.conflictStrategy] ?? log.conflictStrategy}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-xs text-slate-400">{formatDate(log.createdDate)}</span>
                                      <button
                                        onClick={() => cancelJob(log.id, source.id)}
                                        disabled={cancellingJob === log.id}
                                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition disabled:opacity-50"
                                        title="Kuyruğu İptal Et"
                                      >
                                        {cancellingJob === log.id
                                          ? <RefreshCw size={10} className="animate-spin" />
                                          : <X size={10} />}
                                        İptal
                                      </button>
                                    </div>
                                  </div>
                                  <div className="px-4 pb-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                      <span className="tabular-nums">
                                        {processed.toLocaleString("tr-TR")} / {total.toLocaleString("tr-TR")} satır işlendi
                                      </span>
                                      <span className="font-medium text-violet-600">
                                        {total > 0 ? Math.round((processed / total) * 100) : 0}%
                                      </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-violet-100 overflow-hidden">
                                      <div
                                        className="h-full bg-violet-500 rounded-full transition-all duration-500"
                                        style={{ width: `${total > 0 ? (processed / total) * 100 : 0}%` }}
                                      />
                                    </div>
                                    {(log.insertedCount > 0 || log.updatedCount > 0 || log.skippedCount > 0) && (
                                      <div className="flex gap-3 text-[10px]">
                                        <span className="text-green-600 font-medium">+{log.insertedCount.toLocaleString("tr-TR")} eklendi</span>
                                        <span className="text-blue-500 font-medium">~{log.updatedCount.toLocaleString("tr-TR")} güncellendi</span>
                                        <span className="text-slate-400">⊘{log.skippedCount.toLocaleString("tr-TR")} atlandı</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );

                              return (
                                <div key={log.id} className={`rounded-xl border overflow-hidden ${
                                  hasError ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-white"
                                }`}>
                                  {/* Log header */}
                                  <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {hasError ? (
                                        <AlertCircle size={15} className="text-red-500 shrink-0" />
                                      ) : processed === 0 ? (
                                        <AlertCircle size={15} className="text-amber-500 shrink-0" />
                                      ) : (
                                        <CheckCircle size={15} className="text-teal-500 shrink-0" />
                                      )}
                                      <span className="text-sm font-semibold text-slate-800">
                                        {TARGET_LABELS[log.targetEntity] ?? log.targetEntity}
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                                        {CONFLICT_LABELS[log.conflictStrategy] ?? log.conflictStrategy}
                                      </span>
                                      {isAuto && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium flex items-center gap-1">
                                          <Zap size={8} /> Otomatik
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {log.importedByUserEmail && (
                                        <span className="text-xs text-slate-400 hidden sm:block truncate max-w-[160px]">
                                          {log.importedByUserEmail}
                                        </span>
                                      )}
                                      <span className="text-xs text-slate-400 shrink-0">{formatDate(log.createdDate)}</span>
                                    </div>
                                  </div>

                                  {/* Stats */}
                                  <div className="px-4 pb-3 space-y-2">
                                    <div className="flex items-center gap-4 flex-wrap text-xs">
                                      <span className="flex items-center gap-1 font-semibold text-green-600">
                                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                                        +{log.insertedCount} eklendi
                                      </span>
                                      <span className="flex items-center gap-1 font-semibold text-blue-600">
                                        <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                                        ~{log.updatedCount} güncellendi
                                      </span>
                                      <span className="flex items-center gap-1 text-slate-400">
                                        <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                                        ⊘{log.skippedCount} atlandı
                                      </span>
                                      {total > 0 && (
                                        <span className="text-slate-400 ml-auto">{processed}/{total} satır</span>
                                      )}
                                    </div>
                                    {total > 0 && (
                                      <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 gap-px">
                                        {log.insertedCount > 0 && <div className="bg-green-400" style={{ width: `${(log.insertedCount / total) * 100}%` }} />}
                                        {log.updatedCount > 0 && <div className="bg-blue-400" style={{ width: `${(log.updatedCount / total) * 100}%` }} />}
                                        {log.skippedCount > 0 && <div className="bg-slate-200" style={{ width: `${(log.skippedCount / total) * 100}%` }} />}
                                      </div>
                                    )}
                                    {total > 0 && !hasError && (
                                      <p className="text-[10px] text-slate-400">
                                        %{successRate} başarı oranı
                                        {log.skippedCount > 0 && ` · ${log.skippedCount} satır atlandı`}
                                      </p>
                                    )}
                                  </div>

                                  {/* Skip diagnostics for completed logs */}
                                  {!isLive && log.skippedCount > 0 && log.skipDiagnosticsJson && (() => {
                                    const diags = analyzeSkipReasons(log.skipDiagnosticsJson);
                                    return diags.length > 0 ? (
                                      <div className="mx-4 mb-3">
                                        <SkipDiagnosticsPanel
                                          diagnostics={diags}
                                          onSwitchToMapping={() => switchTab(source.id, "preview")}
                                          onDismiss={() => {}}
                                        />
                                      </div>
                                    ) : null;
                                  })()}

                                  {/* Error + suggestion + Çöz */}
                                  {hasError && analysis && (
                                    <div className="mx-4 mb-4 rounded-xl border border-red-200 bg-white overflow-hidden">
                                      {/* Raw error */}
                                      <div className="px-4 py-3 border-b border-red-100">
                                        <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1.5">
                                          <AlertCircle size={12} /> Hata Mesajı
                                        </p>
                                        <p className="text-xs text-red-700 font-mono break-all leading-relaxed">
                                          {log.errorMessage}
                                        </p>
                                      </div>
                                      {/* Suggestion */}
                                      <div className="px-4 py-3 bg-amber-50/70">
                                        <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                                          <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current shrink-0">
                                            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 11.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm.75-3.25a.75.75 0 0 1-1.5 0V5.75a.75.75 0 0 1 1.5 0v3.5z"/>
                                          </svg>
                                          Neden Oldu? — {analysis.title}
                                        </p>
                                        <p className="text-xs text-amber-800 leading-relaxed mb-3">
                                          {analysis.detail}
                                        </p>
                                        {/* Çöz button */}
                                        <button
                                          onClick={() => {
                                            if (analysis.fixType === "strategy_update") {
                                              setConflictMap(prev => ({ ...prev, [source.id]: "update" }));
                                              switchTab(source.id, "preview");
                                              toast(true, "Strateji 'Güncelle' yapıldı. Şimdi tekrar aktarabilirsiniz.");
                                            } else if (analysis.fixType === "check_mapping") {
                                              switchTab(source.id, "preview");
                                              toast(true, "Alan eşlemesini ve hedefi kontrol edin, ardından aktarın.");
                                            } else if (analysis.fixType === "refetch") {
                                              switchTab(source.id, "preview");
                                              if (source.type === "RestApi") handleFetch(source);
                                            } else if (analysis.fixType === "edit_source") {
                                              setEditSource(source);
                                              setShowModal(true);
                                            }
                                          }}
                                          className="flex items-center gap-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-2 rounded-xl transition shadow-sm"
                                        >
                                          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current shrink-0">
                                            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
                                          </svg>
                                          Çöz — {analysis.fixLabel}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <SourceModal
          source={editSource}
          onClose={() => setShowModal(false)}
          onSaved={(id, preview) => {
            setShowModal(false);
            load();
            if (id && preview) applyPreview(id, preview);
            toast(true, editSource ? "Kaynak güncellendi." : "Kaynak oluşturuldu." + (preview ? " Veriler hazır, aktarabilirsiniz." : ""));
          }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            {/* Icon + title */}
            <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                <Trash2 size={26} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Kaynağı Sil</h2>
              <p className="text-sm text-slate-500">
                Bu işlem geri alınamaz.
              </p>
            </div>

            {/* Source info */}
            <div className="mx-6 mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                deleteTarget.type === "RestApi" ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700"
              }`}>
                {deleteTarget.type === "RestApi" ? "REST" : "Excel"}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{deleteTarget.name}</p>
                {deleteTarget.description && (
                  <p className="text-xs text-slate-400 truncate">{deleteTarget.description}</p>
                )}
              </div>
            </div>

            {/* Warning */}
            <div className="mx-6 mb-6 flex items-start gap-2.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>Kaynağa ait tüm aktarma geçmişi de kalıcı olarak silinecek.</span>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <><RefreshCw size={13} className="animate-spin" /> Siliniyor...</>
                ) : (
                  <><Trash2 size={13} /> Evet, Sil</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add / Edit Modal ───────────────────────────────────────────────────────
function SourceModal({
  source, onClose, onSaved,
}: {
  source: ExternalSource | null;
  onClose: () => void;
  onSaved: (id: string, preview?: PreviewData) => void;
}) {
  const isEdit = !!source;
  const hasServerFile = isEdit && source.type === "Excel" && source.hasExcelFile;

  // Basic fields
  const [name, setName] = useState(source?.name ?? "");
  const [type, setType] = useState(source?.type ?? "Excel");
  const [description, setDescription] = useState(source?.description ?? "");
  const [isActive, setIsActive] = useState(source?.isActive ?? true);

  // REST config
  const parsedConfig = (() => { try { return source?.config ? JSON.parse(source.config) : {}; } catch { return {}; } })();
  const [url, setUrl] = useState<string>(parsedConfig.url ?? "");
  const [dataPath, setDataPath] = useState<string>(parsedConfig.dataPath ?? "");
  const [headersJson, setHeadersJson] = useState<string>(
    parsedConfig.headers && Object.keys(parsedConfig.headers).length > 0
      ? JSON.stringify(parsedConfig.headers, null, 2)
      : "{}"
  );
  const [fetchSchedule, setFetchSchedule] = useState(source?.fetchSchedule ?? "None");
  const [autoImportTarget, setAutoImportTarget] = useState(source?.autoImportTarget ?? "");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [restFetching, setRestFetching] = useState(false);
  const [restPreview, setRestPreview] = useState<PreviewData | null>(null);

  // Excel upload (new source only)
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<PreviewData | null>(null);
  const [parseFailed, setParseFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isRestApi = type === "RestApi";

  async function handleFileSelect(f: File) {
    if (!f.name.match(/\.(xlsx|xls)$/i)) { setParseFailed(true); return; }
    setFile(f); setParseFailed(false); setLocalPreview(null);
    try {
      const rawRows = await readExcelFile(f);
      const columns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
      const rows = rawRows.map(row =>
        Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v ?? "")]))
      ) as Record<string, string>[];
      setLocalPreview({ columns, rows });
    } catch { setParseFailed(true); }
  }

  async function save() {
    if (!name.trim()) { setError("Ad zorunludur."); return; }
    if (isRestApi) {
      try { new URL(url); } catch { setError("Geçerli bir URL giriniz (https://...)."); return; }
      try { JSON.parse(headersJson || "{}"); } catch { setError("HTTP Başlıkları geçerli JSON olmalıdır."); return; }
    }

    setSaving(true); setError("");
    try {
      const config = isRestApi
        ? JSON.stringify({ url, headers: JSON.parse(headersJson || "{}"), dataPath })
        : null;
      const body = { name, type, description, config, isActive, fetchSchedule, autoImportTarget: autoImportTarget || null };

      let sourceId: string;
      if (isEdit) {
        await api.put(`/api/admin/external-sources/${source.id}`, body);
        sourceId = source.id;
      } else {
        const created = await api.post<{ id: string }>("/api/admin/external-sources", body);
        sourceId = created.id;
      }

      // Upload Excel file for server-side persistence (re-parse on refresh)
      // Always use localPreview (client-side parse, full row count) — server response is ignored for preview
      let preview: PreviewData | undefined;
      if (!isRestApi && file) {
        const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
        const form = new FormData();
        form.append("file", file);
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/admin/external-sources/${sourceId}/upload-excel`,
          { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form }
        );
        // Use client-parsed localPreview (all rows, no server-side row cap)
        preview = localPreview ?? undefined;
      } else if (!isRestApi && localPreview) {
        preview = localPreview;
      }

      onSaved(sourceId, preview);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Kayıt hatası");
    }
    setSaving(false);
  }

  async function testFetch() {
    try { new URL(url); } catch { setError("Geçerli bir URL giriniz (https://...)."); return; }
    let headers: Record<string, string> = {};
    try { headers = JSON.parse(headersJson || "{}"); } catch { setError("HTTP Başlıkları geçerli JSON olmalıdır."); return; }
    setError("");
    setRestFetching(true);
    setRestPreview(null);
    try {
      const data = await api.post<PreviewData>("/api/admin/external-sources/test-fetch", {
        url, headers, dataPath: dataPath || null,
      });
      setRestPreview(data);
    } catch (e: unknown) {
      setRestPreview({ columns: [], rows: [], error: e instanceof Error ? e.message : "Bağlantı hatası" });
    }
    setRestFetching(false);
  }

  const inp = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-slate-900">{isEdit ? "Kaynağı Düzenle" : "Yeni Dış Kaynak"}</h2>
            {!isEdit && <p className="text-xs text-slate-400 mt-0.5">Kaynak türünü seçip yapılandırın</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Type selector — yeni kaynak için */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Kaynak Türü</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { t: "Excel", label: "Excel Dosyası", sub: ".xlsx / .xls dosyasından veri yükleyin", Icon: FileSpreadsheet, accent: "amber" },
                  { t: "RestApi", label: "REST API", sub: "HTTP endpoint'ten otomatik veri çekin", Icon: RefreshCw, accent: "violet" },
                ] as const).map(({ t, label, sub, Icon, accent }) => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition ${
                      type === t
                        ? accent === "amber" ? "border-amber-400 bg-amber-50" : "border-violet-400 bg-violet-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}>
                    <Icon size={20} className={type === t ? (accent === "amber" ? "text-amber-600" : "text-violet-600") : "text-slate-400"} />
                    <span className={`text-sm font-semibold ${type === t ? (accent === "amber" ? "text-amber-800" : "text-violet-800") : "text-slate-700"}`}>{label}</span>
                    <span className="text-[10px] text-slate-400 leading-snug">{sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Temel bilgiler */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Ad <span className="text-red-500">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} className={inp}
                placeholder={isRestApi ? "örn: Ürün Kataloğu API" : "örn: Tedarikçi A Kataloğu"} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Açıklama</label>
              <input value={description} onChange={e => setDescription(e.target.value)} className={inp}
                placeholder="İsteğe bağlı kısa açıklama" />
            </div>
          </div>

          {/* ── Excel: dosya yükleme ── */}
          {!isRestApi && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">
                Excel Dosyası
                {isEdit && <span className="ml-1 font-normal text-slate-400">(isteğe bağlı — yeni dosya ile güncellemek için seçin)</span>}
              </label>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />

              {/* Existing server-side file — only shown in edit mode when no new file selected */}
              {hasServerFile && !localPreview && (
                <div className="mb-3 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                  <FileSpreadsheet size={16} className="text-amber-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-800 truncate">Yüklü Excel Dosyası</p>
                    {source.lastFetchedAt && (
                      <p className="text-xs text-amber-600">
                        {source.lastFetchedCount?.toLocaleString("tr-TR") ?? "?"} satır · {formatDate(source.lastFetchedAt)}
                      </p>
                    )}
                  </div>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/admin/external-sources/${source.id}/download-excel`}
                    download
                    onClick={e => {
                      e.preventDefault();
                      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
                      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/admin/external-sources/${source.id}/download-excel`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                      })
                        .then(r => r.blob())
                        .then(blob => {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${source.name.replace(/\s+/g, "_")}.xlsx`;
                          a.click();
                          URL.revokeObjectURL(url);
                        });
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition shrink-0"
                  >
                    <Download size={12} /> İndir
                  </a>
                </div>
              )}

              {!localPreview ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                    parseFailed
                      ? "border-red-300 bg-red-50"
                      : dragging
                        ? "border-teal-400 bg-teal-50"
                        : "border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/30"
                  }`}>
                  <Upload size={24} className={parseFailed ? "text-red-400" : dragging ? "text-teal-500" : "text-slate-400"} />
                  <p className="text-sm font-medium text-slate-600">
                    {parseFailed ? "Dosya okunamadı — başka bir dosya deneyin" : dragging ? "Bırakın..." : hasServerFile ? "Farklı dosya seçmek için tıklayın" : "Dosyayı buraya sürükleyin"}
                  </p>
                  {!hasServerFile && <p className="text-xs text-slate-400">veya tıklayarak seçin (.xlsx, .xls)</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Dosya bilgi satırı */}
                  <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
                    <FileSpreadsheet size={16} className="text-teal-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-teal-800 truncate">{file?.name}</p>
                      <p className="text-xs text-teal-600">{localPreview.columns.length} sütun · {localPreview.rows.length} satır</p>
                    </div>
                    <button type="button" onClick={() => { setFile(null); setLocalPreview(null); }}
                      className="text-slate-400 hover:text-red-500 transition shrink-0" title="Dosyayı kaldır">
                      <X size={15} />
                    </button>
                  </div>
                  {/* Mini önizleme */}
                  {localPreview.rows.length > 0 && (
                    <div className="overflow-auto rounded-xl border border-slate-200 max-h-36">
                      <table className="text-xs w-full min-w-max">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            {localPreview.columns.map(c => (
                              <th key={c} className="px-3 py-2 text-left text-slate-500 font-medium whitespace-nowrap border-r border-slate-200 last:border-r-0">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {localPreview.rows.slice(0, 3).map((row, i) => (
                            <tr key={i}>
                              {localPreview.columns.map(c => (
                                <td key={c} className="px-3 py-1.5 text-slate-700 max-w-[120px] truncate border-r border-slate-200 last:border-r-0">{row[c]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="text-xs text-slate-400 hover:text-teal-600 transition flex items-center gap-1">
                    <Upload size={11} /> Farklı dosya seç
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── REST: URL + config ── */}
          {isRestApi && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  API URL <span className="text-red-500">*</span>
                </label>
                <input value={url} onChange={e => setUrl(e.target.value)} className={inp}
                  placeholder="https://api.example.com/products" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Veri Yolu
                  <span className="ml-1 font-normal text-slate-400">— JSON içindeki dizi alanı</span>
                </label>
                <input value={dataPath} onChange={e => setDataPath(e.target.value)} className={inp}
                  placeholder='örn: data   veya   data.items   (boşsa kök dizi)' />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  HTTP Başlıkları
                  <span className="ml-1 font-normal text-slate-400">— JSON formatında</span>
                </label>
                <textarea value={headersJson} onChange={e => setHeadersJson(e.target.value)} rows={3}
                  className={inp + " font-mono text-xs resize-none"}
                  placeholder={'{ "Authorization": "Bearer TOKEN", "X-Api-Key": "..." }'} />
              </div>

              {/* Veri Çek & Önizle */}
              <div>
                <button type="button" onClick={testFetch} disabled={restFetching || !url.trim()}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50">
                  <RefreshCw size={14} className={restFetching ? "animate-spin" : ""} />
                  {restFetching ? "Veriler çekiliyor..." : "Veri Çek & Önizle"}
                </button>

                {restPreview && (
                  <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                    {restPreview.error ? (
                      <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-4 py-3">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        {restPreview.error}
                      </div>
                    ) : (
                      <>
                        <div className="bg-slate-50 px-4 py-2 flex items-center border-b border-slate-200">
                          <span className="text-xs font-semibold text-slate-600">
                            {restPreview.columns.length} sütun · {restPreview.rows.length.toLocaleString("tr-TR")} satır
                          </span>
                        </div>
                        <div className="overflow-auto max-h-40">
                          <table className="text-xs w-full min-w-max">
                            <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                {restPreview.columns.map(c => (
                                  <th key={c} className="px-3 py-2 text-left text-slate-500 font-medium whitespace-nowrap border-r border-slate-100 last:border-r-0">{c}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {restPreview.rows.slice(0, 5).map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                  {restPreview.columns.map(c => (
                                    <td key={c} className="px-3 py-1.5 text-slate-700 max-w-[140px] truncate border-r border-slate-100 last:border-r-0">{row[c]}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {restPreview.rows.length > 5 && (
                          <div className="px-4 py-2 text-[10px] text-slate-400 bg-slate-50 border-t border-slate-100">
                            İlk 5 satır gösteriliyor · toplam {restPreview.rows.length.toLocaleString("tr-TR")} satır
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Gelişmiş — collapsed by default */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button type="button" onClick={() => setShowAdvanced(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                  <span className="flex items-center gap-1.5"><Clock size={12} /> Zamanlanmış Çekim</span>
                  {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {showAdvanced && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Otomatik Çekim Sıklığı</label>
                      <select value={fetchSchedule}
                        onChange={e => { setFetchSchedule(e.target.value); if (e.target.value === "None") setAutoImportTarget(""); }}
                        className={inp}>
                        <option value="None">Devre dışı</option>
                        <option value="Hourly">Her saat</option>
                        <option value="Daily">Her gün</option>
                        <option value="Weekly">Her hafta</option>
                      </select>
                    </div>
                    {fetchSchedule !== "None" && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Otomatik Aktarma Hedefi</label>
                        <select value={autoImportTarget} onChange={e => setAutoImportTarget(e.target.value)} className={inp}>
                          <option value="">Sadece çek, aktarma</option>
                          {TARGET_ENTITIES.map(t => <option key={t} value={t}>{TARGET_LABELS[t]}</option>)}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Her çekimden sonra seçilen hedefe otomatik aktarılır (strateji: atla).
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aktif toggle — sadece düzenleme */}
          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
              Aktif
            </label>
          )}

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle size={14} /> {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition hover:bg-slate-50">
            İptal
          </button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2">
            {saving
              ? <><RefreshCw size={13} className="animate-spin" /> Kaydediliyor...</>
              : isEdit ? "Güncelle" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
