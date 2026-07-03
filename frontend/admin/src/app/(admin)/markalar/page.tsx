"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import { exportToExcel, readExcelFile, downloadTemplate } from "@/lib/excel";
import { Plus, Pencil, X, Download, Upload, Search, ToggleLeft, ToggleRight, Trash2, Info, History, ChevronUp, ChevronDown, ChevronsUpDown, CheckSquare, Square, Loader2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { PreviewPanel, PreviewToggleButton } from "@/components/previews/PreviewPanel";
import BrandPreview from "@/components/previews/BrandPreview";
import RichTextEditor from "@/components/RichTextEditor";

interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  createdDate: string;
}

const BRAND_ACTION_COLORS: Record<string, string> = {
  BrandCreated: "bg-green-100 text-green-700",
  BrandUpdated: "bg-blue-100 text-blue-700",
  BrandDeleted: "bg-red-100 text-red-700",
  "Oluşturuldu — Marka": "bg-green-100 text-green-700",
  "Güncellendi — Marka": "bg-blue-100 text-blue-700",
  "Silindi — Marka": "bg-red-100 text-red-700",
};

interface Brand { id: string; name: string; slug: string; logoUrl?: string; isActive: boolean; importedFromSourceName?: string; createdDate?: string; dataSource?: string; createdByAdminEmail?: string; showInVehicleNav?: boolean; vehicleModelsJson?: string; }
interface BrandForm { id?: string; name: string; slug: string; logoUrl: string; description: string; isActive: boolean; showInVehicleNav: boolean; vehicleModelsJson: string; }

const EMPTY: BrandForm = { name: "", slug: "", logoUrl: "", description: "", isActive: true, showInVehicleNav: false, vehicleModelsJson: "" };

const TR: Record<string, string> = {
  "ğ":"g","Ğ":"g",
  "ü":"u","Ü":"u",
  "ş":"s","Ş":"s",
  "ı":"i","İ":"i",
  "ö":"o","Ö":"o",
  "ç":"c","Ç":"c",
};
function slugify(s: string) {
  return [...s].map(c => TR[c] ?? c).join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

type SortField = "createdDate" | "dataSource";
function buildSortKey(field: SortField, dir: "asc" | "desc") { return `${field}-${dir}`; }

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: "asc" | "desc" }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30 ml-1 inline-block" />;
  return sortDir === "asc" ? <ChevronUp size={12} className="text-teal-600 ml-1 inline-block" /> : <ChevronDown size={12} className="text-teal-600 ml-1 inline-block" />;
}

export default function MarkalarPage() {
  const { t } = useI18n();
  const [historyTarget, setHistoryTarget] = useState<Brand | null>(null);
  const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadBrandHistory = useCallback(async (brandId: string) => {
    setHistoryLoading(true);
    setHistoryLogs([]);
    try {
      const data = await api.get<{ items: AuditLog[]; totalCount: number }>(`/api/admin/audit-logs/entity/Marka/${brandId}`);
      setHistoryLogs(data.items);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  function openHistory(b: Brand) {
    setHistoryTarget(b);
    loadBrandHistory(b.id);
  }

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
  const [filterDataSource, setFilterDataSource] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState<BrandForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize), onlyActive: "false" });
      if (search) qs.set("search", search);
      if (statusFilter) qs.set("isActive", statusFilter);
      if (filterDataSource) qs.set("dataSource", filterDataSource);
      if (sortField) qs.set("sortBy", buildSortKey(sortField, sortDir));
      const data = await api.get<{ items: Brand[]; totalPages: number; totalCount: number }>(`/api/brands?${qs}`);
      setBrands(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount ?? data.items.length);
    } catch { setBrands([]); }
    finally { setLoading(false); }
  }, [page, pageSize, search, statusFilter, filterDataSource, sortField, sortDir]);

  useEffect(() => {
    const id = window.setTimeout(() => { void fetch(); }, 0);
    return () => window.clearTimeout(id);
  }, [fetch]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSelectedIds(new Set()); }, [page]);

  const allPageIds = brands.map(b => b.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every(id => selectedIds.has(id));
  const someSelected = allPageIds.some(id => selectedIds.has(id)) && !allSelected;

  function toggleSelectAll() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) allPageIds.forEach(id => next.delete(id));
      else allPageIds.forEach(id => next.add(id));
      return next;
    });
  }
  function toggleSelect(id: string) {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    setBulkLoading(true);
    const results = await Promise.allSettled(ids.map(id => api.delete(`/api/brands/${id}`)));
    const ok = results.filter(r => r.status === "fulfilled").length;
    const fail = ids.length - ok;
    setMsg({ text: `${ok} marka silindi${fail > 0 ? ` (${fail} hata)` : ""}`, ok: ok > 0 });
    setSelectedIds(new Set());
    setBulkLoading(false);
    void fetch();
  }

  async function handleBulkToggle(targetActive: boolean) {
    const ids = [...selectedIds];
    setBulkLoading(true);
    const results = await Promise.allSettled(ids.map(id => {
      const b = brands.find(b => b.id === id);
      if (!b || b.isActive === targetActive) return Promise.resolve();
      return api.put(`/api/brands/${id}`, { id, name: b.name, slug: b.slug, logoUrl: b.logoUrl || null, description: null, metaTitle: null, metaDescription: null, isActive: targetActive, showInVehicleNav: b.showInVehicleNav ?? false, vehicleModelsJson: b.vehicleModelsJson ?? null });
    }));
    const ok = results.filter(r => r.status === "fulfilled").length;
    setMsg({ text: `${ok} marka ${targetActive ? "aktif" : "pasif"} yapıldı.`, ok: true });
    setSelectedIds(new Set());
    setBulkLoading(false);
    void fetch();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function handleExport() {
    exportToExcel(
      brands.map(b => ({
        "Ad": b.name, "Slug": b.slug, "Logo URL": b.logoUrl ?? "",
        "Durum": b.isActive ? t("status.active", "Aktif") : t("status.passive", "Pasif"),
      })),
      "markalar", "Markalar"
    );
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true); setImportResult(null);
    let ok = 0, fail = 0;
    try {
      const rows = await readExcelFile(file);
      for (const row of rows) {
        try {
          const name = String(row["Ad"] ?? ""); if (!name) { fail++; continue; }
          await api.post("/api/brands", {
            name, slug: slugify(name),
            logoUrl: String(row["Logo URL"] ?? "") || null,
            description: String(row["Açıklama"] ?? "") || null,
            metaTitle: null, metaDescription: null,
          });
          ok++;
        } catch { fail++; }
      }
      setImportResult(`${ok} marka eklendi${fail > 0 ? `, ${fail} hatalı` : ""}.`);
      await fetch();
    } catch { setImportResult(t("msg.fileReadFailed", "Dosya okunamadı.")); }
    finally { setImporting(false); e.target.value = ""; }
  }

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(b: Brand) {
    setForm({ id: b.id, name: b.name, slug: b.slug, logoUrl: b.logoUrl ?? "", description: "", isActive: b.isActive, showInVehicleNav: b.showInVehicleNav ?? false, vehicleModelsJson: b.vehicleModelsJson ?? "" });
    setError(""); setModal("edit");
  }

  async function handleToggleActive(b: Brand) {
    try {
      await api.put(`/api/brands/${b.id}`, {
        id: b.id, name: b.name, slug: b.slug, logoUrl: b.logoUrl || null,
        description: null, metaTitle: null, metaDescription: null, isActive: !b.isActive,
        showInVehicleNav: b.showInVehicleNav ?? false, vehicleModelsJson: b.vehicleModelsJson ?? null,
      });
      setMsg({ text: `${t("ui.brand", "Marka")} ${!b.isActive ? t("ui.madeActive", "aktif") : t("ui.madePassive", "pasif")} ${t("ui.madeStatus", "yapıldı.")}.`, ok: true });
      await fetch();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu"), ok: false });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/brands/${deleteTarget.id}`);
      setMsg({ text: `"${deleteTarget.name}" ${t("msg.deleted", "Başarıyla silindi")}`, ok: true });
      setDeleteTarget(null);
      await fetch();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu"), ok: false });
      setDeleteTarget(null);
    }
    setDeleting(false);
  }

  async function handleSave() {
    if (!form.name) { setError(t("form.nameRequired", "Ad zorunludur.")); return; }
    setSaving(true); setError("");
    try {
      const body = { name: form.name, slug: form.slug || slugify(form.name), logoUrl: form.logoUrl || null, description: form.description || null, metaTitle: null, metaDescription: null, showInVehicleNav: form.showInVehicleNav, vehicleModelsJson: form.vehicleModelsJson || null };
      if (modal === "create") {
        await api.post("/api/brands", body);
        setMsg({ text: t("msg.created", "Başarıyla oluşturuldu"), ok: true });
      } else {
        await api.put(`/api/brands/${form.id}`, { id: form.id, isActive: form.isActive, ...body });
        setMsg({ text: t("msg.updated", "Başarıyla güncellendi"), ok: true });
      }
      setModal(null); await fetch();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu")); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav./markalar", "Markalar")}</h1>
          {!loading && <p className="text-sm text-slate-500 mt-0.5">{totalCount} {t("ui.brandCount", "marka")}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadTemplate(["Ad", "Logo URL", "Açıklama"], "markalar")}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">{t("action.downloadTemplate", "Şablon İndir")}</button>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
            <Download size={14} /> {t("action.exportExcel", "Excel'e Aktar")}
          </button>
          <label className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition cursor-pointer">
            <Upload size={14} /> {importing ? t("action.importing", "Aktarılıyor...") : t("action.importFile", "İçe Aktar")}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#12304A] hover:bg-[#0d2438] text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Plus size={16} /> {t("ui.newBrand", "Yeni Marka")}
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-800 text-white rounded-2xl px-5 py-3 flex items-center gap-3 flex-wrap shadow-md">
          <span className="text-sm font-semibold shrink-0">{selectedIds.size} marka seçili</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => handleBulkToggle(true)} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/80 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50">
              {bulkLoading ? <Loader2 size={12} className="animate-spin" /> : <ToggleRight size={13} />}
              {t("action.activate", "Aktifleştir")}
            </button>
            <button onClick={() => handleBulkToggle(false)} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50">
              <ToggleLeft size={13} /> Pasife Al
            </button>
            <button onClick={() => setBulkDeleteModal(true)} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/80 hover:bg-red-500 rounded-xl transition disabled:opacity-50">
              <Trash2 size={12} /> {t("action.delete", "Sil")}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {bulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">{t("auto.topluIslem", "Toplu İşlem")}</h2>
                <p className="text-xs text-slate-500">{selectedIds.size} marka seçili</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">{t("msg.confirmDelete", "Silmek istediğinizden emin misiniz?")} (<span className="font-semibold">{selectedIds.size} Marka</span>)</p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{t("msg.irreversible", "Bu işlem geri alınamaz.")}</p>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setBulkDeleteModal(false)} disabled={bulkLoading}
                className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
                {t("action.cancel", "Vazgeç")}
              </button>
              <button onClick={async () => { setBulkDeleteModal(false); await handleBulkDelete(); }} disabled={bulkLoading}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                {bulkLoading ? t("action.deleting", "Siliniyor...") : t("action.delete", "Sil")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="sticky top-0 z-10 bg-white py-3 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={t("ui.searchBrands", "Marka adı...")}
              className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-56 text-slate-900 bg-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">{t("action.search", "Ara")}</button>
          {(search || searchInput) && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">{t("action.clear", "Temizle")}</button>
          )}
        </form>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as "" | "true" | "false"); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="">{t("filter.allStatus", "Tüm Durumlar")}</option>
          <option value="true">{t("status.active", "Aktif")}</option>
          <option value="false">{t("status.passive", "Pasif")}</option>
        </select>
        <select
          value={filterDataSource}
          onChange={e => { setFilterDataSource(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 min-w-[140px]"
        >
          <option value="">{t("filter.allSources", "Tüm Kaynaklar")}</option>
          <option value="__manual__">{t("filter.manual", "Manuel Giriş")}</option>
          <option value="catalogiq">CatalogIQ</option>
          <option value="test">Test</option>
        </select>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          {[20, 50, 100].map(s => <option key={s} value={s}>{s} {t("table.perPage", "kayıt")}</option>)}
        </select>
      </div>

      {importResult && (
        <div className="text-sm px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-between">
          {importResult} <button onClick={() => setImportResult(null)}><X size={14} /></button>
        </div>
      )}

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl flex items-center justify-between ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text} <button onClick={() => setMsg(null)}><X size={14} /></button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-slate-400">{t("action.loading", "Yükleniyor...")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700 transition">
                    {allSelected ? <CheckSquare size={16} className="text-slate-700" /> : someSelected ? <CheckSquare size={16} className="opacity-50" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{t("ui.brandLabel", "Marka")}</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">
                  <span className="flex items-center gap-1">
                    Slug
                    <span title="Slug, URL adresinde görünen benzersiz kimlik metnidir. Örn: 'nike' → /marka/nike. Türkçe karakter ve boşluk içermez."><Info size={12} className="text-slate-400 cursor-help" /></span>
                  </span>
                </th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{t("ui.logo", "Logo")}</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{t("col.status", "Durum")}</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("createdDate")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">{t("ui.createdDate", "Oluşturulma Tarihi")} <SortIcon field="createdDate" sortField={sortField} sortDir={sortDir} /></button></th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("dataSource")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">{t("col.source", "Kaynak")} <SortIcon field="dataSource" sortField={sortField} sortDir={sortDir} /></button></th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{t("col.createdBy", "Oluşturan")}</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brands.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-400">{t("table.noData", "Kayıt bulunamadı")}</td></tr>
              ) : brands.map(b => (
                <tr key={b.id} className={`hover:bg-slate-50 ${selectedIds.has(b.id) ? "!bg-slate-100" : ""}`}>
                  <td className="px-4 py-3 w-10">
                    <button onClick={() => toggleSelect(b.id)} className="text-slate-400 hover:text-slate-700 transition">
                      {selectedIds.has(b.id) ? <CheckSquare size={15} className="text-slate-700" /> : <Square size={15} />}
                    </button>
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                      {b.logoUrl
                        ? <img src={b.logoUrl} alt={b.name} className="w-8 h-8 object-contain rounded" /> // eslint-disable-line @next/next/no-img-element
                        : <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-base">🏷️</div>}
                      {b.name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">{b.slug}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">{b.logoUrl ? t("ui.exists", "Var") : "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold w-fit ${b.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {b.isActive ? t("status.active", "Aktif") : t("status.passive", "Pasif")}
                      </span>
                      {b.showInVehicleNav && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-orange-100 text-orange-600 w-fit whitespace-nowrap">🚗 Araç Menüsü</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {b.createdDate ? new Date(b.createdDate).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {b.dataSource
                      ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{b.dataSource}</span>
                      : b.importedFromSourceName
                      ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{b.importedFromSourceName}</span>
                      : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400 max-w-[140px] truncate" title={b.createdByAdminEmail}>{b.createdByAdminEmail ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openHistory(b)} title={t("tab.history", "Geçmiş")}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm hover:shadow-amber-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <History size={16} />
                      </button>
                      <button onClick={() => openEdit(b)} title={t("action.edit", "Düzenle")}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleToggleActive(b)} title={b.isActive ? t("ui.makePassive", "Pasife Çek") : t("action.activate", "Aktive Et")}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl shadow-sm transition-all duration-150 active:scale-95 ${b.isActive ? "bg-green-50 text-green-600 hover:bg-green-500 hover:text-white hover:shadow-green-200 hover:shadow-md" : "bg-slate-100 text-slate-500 hover:bg-emerald-500 hover:text-white hover:shadow-emerald-200 hover:shadow-md"}`}>
                        {b.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => setDeleteTarget(b)} title={t("action.delete", "Sil")}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-red-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">{t("table.prev", "← Önceki")}</button>}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">{t("table.next", "Sonraki →")}</button>}
        </div>
      )}

      {/* Brand History Modal */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <History size={16} className="text-amber-500" /> {t("ui.brandHistory", "Marka Geçmişi")}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{historyTarget.name}</p>
              </div>
              <button onClick={() => setHistoryTarget(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {historyLoading ? (
                <p className="p-8 text-center text-slate-400">{t("action.loading", "Yükleniyor...")}</p>
              ) : historyLogs.length === 0 ? (
                <p className="p-8 text-center text-slate-400">{t("ui.noBrandHistory", "Bu markaya ait hareket kaydı bulunamadı.")}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      {[t("col.date", "Tarih"), t("ui.actionBy", "İşlemi Yapan"), t("ui.actionLabel", "Aksiyon"), t("action.details", "Detaylar")].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(l.createdDate).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="px-4 py-3 text-slate-700 text-xs">{l.userEmail}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${BRAND_ACTION_COLORS[l.action] ?? "bg-slate-100 text-slate-600"}`}>
                            {l.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {l.newValue
                            ? l.newValue.split(" | ").map((part, i) => (
                                <div key={i} className="text-xs text-slate-600">{part}</div>
                              ))
                            : l.oldValue
                            ? <span className="text-xs text-slate-400">{l.oldValue}</span>
                            : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
              <button onClick={() => setHistoryTarget(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">{t("action.close", "Kapat")}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{t("ui.deleteBrand", "Markayı Sil")}</h3>
                  <p className="text-xs text-slate-500">{t("msg.irreversible", "Bu işlem geri alınamaz.")}</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <strong>&quot;{deleteTarget.name}&quot;</strong> {t("ui.brandWillBeDeleted", "markası silinecek. Aktif ürünü olan markalar silinemez.")}
              </p>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-50 transition">{t("action.cancel", "İptal")}</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-50">
                {deleting ? t("action.deleting", "Siliniyor...") : t("ui.yesDelete", "Evet, Sil")}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col transition-all duration-200 ${showPreview ? "max-w-4xl" : "max-w-2xl"}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="font-bold text-slate-800">{modal === "create" ? t("ui.newBrand", "Yeni Marka") : t("ui.editBrand", "Markayı Düzenle")}</h2>
              <div className="flex items-center gap-2">
                <PreviewToggleButton open={showPreview} onToggle={() => setShowPreview(p => !p)} />
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
              </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t("label.name", "Ad")} *</label>
                <input className={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} />
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1">
                  Slug
                  <span title="Slug, URL adresinde görünen benzersiz kimlik metnidir. Örn: 'nike'. Türkçe karakter ve boşluk içermez."><Info size={12} className="text-slate-400 cursor-help" /></span>
                </label>
                <input className={INPUT} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} />
              </div>
              <ImageUpload
                value={form.logoUrl}
                onChange={url => setForm(f => ({ ...f, logoUrl: url }))}
                label={t("ui.brandLogo", "Marka Logosu")}
              />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t("label.description", "Açıklama")}</label>
                <RichTextEditor
                  value={form.description}
                  onChange={v => setForm(f => ({ ...f, description: v }))}
                  placeholder={t("ui.brandDescPlaceholder", "Marka hakkında açıklama (isteğe bağlı)...")}
                />
              </div>
              {modal === "edit" && (
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  {t("status.active", "Aktif")}
                </label>
              )}

              {/* Araç navigasyonu alanları */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Customer Araç Menüsü</p>
                <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showInVehicleNav}
                    onChange={e => setForm(f => ({ ...f, showInVehicleNav: e.target.checked }))}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <span>Customer üst menüsünde <strong>Araç Markası</strong> olarak göster</span>
                </label>
                {form.showInVehicleNav && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Araç Modelleri <span className="text-slate-400 font-normal">(her satıra bir model — boşsa varsayılan liste kullanılır)</span>
                    </label>
                    <textarea
                      className={`${INPUT} min-h-[160px] font-mono text-xs`}
                      value={form.vehicleModelsJson}
                      onChange={e => setForm(f => ({ ...f, vehicleModelsJson: e.target.value }))}
                      placeholder={"Astra F\nAstra G\nAstra H\nCorsa A\nCorsa B"}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => setModal(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">{t("action.cancel", "Vazgeç")}</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                  {saving ? t("action.saving", "Kaydediliyor...") : modal === "create" ? t("action.create", "Oluştur") : t("action.update", "Güncelle")}
                </button>
              </div>
            </div>

            <PreviewPanel open={showPreview}>
              <BrandPreview form={form} />
            </PreviewPanel>

            </div>{/* /flex */}
          </div>
        </div>
      )}
    </div>
  );
}
