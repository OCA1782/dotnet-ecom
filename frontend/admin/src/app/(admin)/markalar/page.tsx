"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import { exportToExcel, readExcelFile, downloadTemplate } from "@/lib/excel";
import { Plus, Pencil, X, Download, Upload, Search, ToggleLeft, ToggleRight, Trash2, Info, History, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
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

interface Brand { id: string; name: string; slug: string; logoUrl?: string; isActive: boolean; importedFromSourceName?: string; createdDate?: string; dataSource?: string; createdByAdminEmail?: string; }
interface BrandForm { id?: string; name: string; slug: string; logoUrl: string; description: string; isActive: boolean; }

const EMPTY: BrandForm = { name: "", slug: "", logoUrl: "", description: "", isActive: true };

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
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30 ml-1 inline-block" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-teal-600 ml-1 inline-block" /> : <ChevronDown size={12} className="text-teal-600 ml-1 inline-block" />;
  }

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize), onlyActive: "false" });
      if (search) qs.set("search", search);
      if (statusFilter) qs.set("isActive", statusFilter);
      if (sortField) qs.set("sortBy", buildSortKey(sortField, sortDir));
      const data = await api.get<{ items: Brand[]; totalPages: number; totalCount: number }>(`/api/brands?${qs}`);
      setBrands(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount ?? data.items.length);
    } catch { setBrands([]); }
    finally { setLoading(false); }
  }, [page, pageSize, search, statusFilter, sortField, sortDir]);

  useEffect(() => { fetch(); }, [fetch]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function handleExport() {
    exportToExcel(
      brands.map(b => ({
        "Ad": b.name, "Slug": b.slug, "Logo URL": b.logoUrl ?? "",
        "Durum": b.isActive ? "Aktif" : "Pasif",
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
    } catch { setImportResult("Dosya okunamadı."); }
    finally { setImporting(false); e.target.value = ""; }
  }

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(b: Brand) {
    setForm({ id: b.id, name: b.name, slug: b.slug, logoUrl: b.logoUrl ?? "", description: "", isActive: b.isActive });
    setError(""); setModal("edit");
  }

  async function handleToggleActive(b: Brand) {
    try {
      await api.put(`/api/brands/${b.id}`, {
        id: b.id, name: b.name, slug: b.slug, logoUrl: b.logoUrl || null,
        description: null, metaTitle: null, metaDescription: null, isActive: !b.isActive,
      });
      setMsg({ text: `Marka ${!b.isActive ? "aktif" : "pasif"} yapıldı.`, ok: true });
      await fetch();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Hata", ok: false });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/brands/${deleteTarget.id}`);
      setMsg({ text: `"${deleteTarget.name}" silindi.`, ok: true });
      setDeleteTarget(null);
      await fetch();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Silme hatası", ok: false });
      setDeleteTarget(null);
    }
    setDeleting(false);
  }

  async function handleSave() {
    if (!form.name) { setError("Ad zorunludur."); return; }
    setSaving(true); setError("");
    try {
      const body = { name: form.name, slug: form.slug || slugify(form.name), logoUrl: form.logoUrl || null, description: form.description || null, metaTitle: null, metaDescription: null };
      if (modal === "create") {
        await api.post("/api/brands", body);
        setMsg({ text: "Marka oluşturuldu.", ok: true });
      } else {
        await api.put(`/api/brands/${form.id}`, { id: form.id, isActive: form.isActive, ...body });
        setMsg({ text: "Marka güncellendi.", ok: true });
      }
      setModal(null); await fetch();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Hata"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav./markalar", "Markalar")}</h1>
          {!loading && <p className="text-sm text-slate-500 mt-0.5">{totalCount} marka</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadTemplate(["Ad", "Logo URL", "Açıklama"], "markalar")}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">Şablon İndir</button>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
            <Download size={14} /> Excel'e Aktar
          </button>
          <label className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition cursor-pointer">
            <Upload size={14} /> {importing ? "Aktarılıyor..." : "İçe Aktar"}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#12304A] hover:bg-[#0d2438] text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
            <Plus size={16} /> Yeni Marka
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="sticky top-0 z-10 bg-white py-3 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Marka adı ara..."
              className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-56 text-slate-900 bg-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 transition">Ara</button>
          {(search || searchInput) && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">Temizle</button>
          )}
        </form>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as "" | "true" | "false"); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="">Tüm Durumlar</option>
          <option value="true">Aktif</option>
          <option value="false">Pasif</option>
        </select>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          {[20, 50, 100].map(s => <option key={s} value={s}>{s} kayıt</option>)}
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
          <p className="p-8 text-center text-slate-400">Yükleniyor...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Marka</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">
                  <span className="flex items-center gap-1">
                    Slug
                    <span title="Slug, URL adresinde görünen benzersiz kimlik metnidir. Örn: 'nike' → /marka/nike. Türkçe karakter ve boşluk içermez."><Info size={12} className="text-slate-400 cursor-help" /></span>
                  </span>
                </th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Logo</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Durum</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("createdDate")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">Oluşturulma Tarihi <SortIcon field="createdDate" /></button></th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("dataSource")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">Kaynak <SortIcon field="dataSource" /></button></th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Oluşturan</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brands.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">Marka bulunamadı</td></tr>
              ) : brands.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                      {b.logoUrl
                        ? <img src={b.logoUrl} alt={b.name} className="w-8 h-8 object-contain rounded" /> // eslint-disable-line @next/next/no-img-element
                        : <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-base">🏷️</div>}
                      {b.name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">{b.slug}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">{b.logoUrl ? "Var" : "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${b.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {b.isActive ? "Aktif" : "Pasif"}
                    </span>
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
                      <button onClick={() => openHistory(b)} title="Geçmiş"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm hover:shadow-amber-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <History size={16} />
                      </button>
                      <button onClick={() => openEdit(b)} title="Düzenle"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleToggleActive(b)} title={b.isActive ? "Pasife Çek" : "Aktive Et"}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl shadow-sm transition-all duration-150 active:scale-95 ${b.isActive ? "bg-green-50 text-green-600 hover:bg-green-500 hover:text-white hover:shadow-green-200 hover:shadow-md" : "bg-slate-100 text-slate-500 hover:bg-emerald-500 hover:text-white hover:shadow-emerald-200 hover:shadow-md"}`}>
                        {b.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => setDeleteTarget(b)} title="Sil"
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
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">← Önceki</button>}
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
          {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">Sonraki →</button>}
        </div>
      )}

      {/* Brand History Modal */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <History size={16} className="text-amber-500" /> Marka Geçmişi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{historyTarget.name}</p>
              </div>
              <button onClick={() => setHistoryTarget(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {historyLoading ? (
                <p className="p-8 text-center text-slate-400">Yükleniyor...</p>
              ) : historyLogs.length === 0 ? (
                <p className="p-8 text-center text-slate-400">Bu markaya ait hareket kaydı bulunamadı.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      {["Tarih", "İşlemi Yapan", "Aksiyon", "Detay"].map(h => (
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
              <button onClick={() => setHistoryTarget(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">Kapat</button>
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
                  <h3 className="font-bold text-slate-900">Markayı Sil</h3>
                  <p className="text-xs text-slate-500">Bu işlem geri alınamaz.</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <strong>"{deleteTarget.name}"</strong> markası silinecek. Aktif ürünü olan markalar silinemez.
              </p>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-50 transition">İptal</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-50">
                {deleting ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col transition-all duration-200 ${showPreview ? "max-w-4xl" : "max-w-2xl"}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="font-bold text-slate-800">{modal === "create" ? "Yeni Marka" : "Markayı Düzenle"}</h2>
              <div className="flex items-center gap-2">
                <PreviewToggleButton open={showPreview} onToggle={() => setShowPreview(p => !p)} />
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
              </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ad *</label>
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
                label="Marka Logosu"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Açıklama</label>
                <RichTextEditor
                  value={form.description}
                  onChange={v => setForm(f => ({ ...f, description: v }))}
                  placeholder="Marka hakkında açıklama (isteğe bağlı)..."
                />
              </div>
              {modal === "edit" && (
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  Aktif
                </label>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => setModal(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                  {saving ? "Kaydediliyor..." : modal === "create" ? "Oluştur" : "Güncelle"}
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
