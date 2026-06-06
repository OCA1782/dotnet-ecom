"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { exportToExcel, readExcelFile, downloadTemplate } from "@/lib/excel";
import {
  Plus, Pencil, Trash2, X, Download, Upload, Search,
  ChevronRight, ChevronDown, FolderOpen, Folder,
  ChevronsDownUp, ChevronsUpDown, Info, History, ChevronUp,
} from "lucide-react";
import { PreviewPanel, PreviewToggleButton } from "@/components/previews/PreviewPanel";
import CategoryPreview from "@/components/previews/CategoryPreview";
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

const CAT_ACTION_COLORS: Record<string, string> = {
  CategoryCreated: "bg-green-100 text-green-700",
  CategoryUpdated: "bg-blue-100 text-blue-700",
  CategoryDeleted: "bg-red-100 text-red-700",
  "Oluşturuldu — Kategori": "bg-green-100 text-green-700",
  "Güncellendi — Kategori": "bg-blue-100 text-blue-700",
  "Silindi — Kategori": "bg-red-100 text-red-700",
};
import ImageUpload from "@/components/ImageUpload";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  imageUrl?: string;
  sortOrder: number;
  showInMenu: boolean;
  isActive: boolean;
  productCount?: number;
  subCategories?: Category[];
  importedFromSourceName?: string;
  createdDate?: string;
  dataSource?: string;
  createdByAdminEmail?: string;
}

interface CatForm {
  id?: string;
  name: string;
  slug: string;
  parentCategoryId: string;
  description: string;
  sortOrder: string;
  showInMenu: boolean;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY: CatForm = { name: "", slug: "", parentCategoryId: "", description: "", sortOrder: "0", showInMenu: true, imageUrl: "", isActive: true };

function flattenCategories(cats: Category[]): Category[] {
  const result: Category[] = [];
  for (const cat of cats) {
    result.push(cat);
    if (cat.subCategories && cat.subCategories.length > 0)
      result.push(...flattenCategories(cat.subCategories));
  }
  return result;
}

const TR: Record<string, string> = {
  "ğ":"g","Ğ":"g","ü":"u","Ü":"u","ş":"s","Ş":"s",
  "ı":"i","İ":"i","ö":"o","Ö":"o","ç":"c","Ç":"c",
};
function slugify(s: string) {
  return [...s].map(c => TR[c] ?? c).join("")
    .toLowerCase().replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400";

const PAGE_SIZES = [10, 25, 50] as const;
type PageSize = typeof PAGE_SIZES[number];

type SortField = "createdDate" | "dataSource";

function buildPageNums(total: number, current: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

export default function KategorilerPage() {
  const [historyTarget, setHistoryTarget] = useState<Category | null>(null);
  const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadCategoryHistory = useCallback(async (categoryId: string) => {
    setHistoryLoading(true);
    setHistoryLogs([]);
    try {
      const data = await api.get<{ items: AuditLog[]; totalCount: number }>(`/api/admin/audit-logs/entity/Kategori/${categoryId}`);
      setHistoryLogs(data.items);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  function openHistory(c: Category) {
    setHistoryTarget(c);
    loadCategoryHistory(c.id);
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState<CatForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [menuFilter, setMenuFilter] = useState<"" | "true" | "false">("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Category[]>("/api/categories?onlyActive=false");
      setCategories(flattenCategories(data));
    } catch { setCategories([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset to page 1 when any filter/sort changes
  useEffect(() => { setPage(1); }, [filterText, menuFilter, activeFilter, pageSize, sortField, sortDir]);

  function toggleCollapse(id: string) {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(c: Category) {
    setForm({ id: c.id, name: c.name, slug: c.slug, parentCategoryId: c.parentCategoryId ?? "", description: "", sortOrder: String(c.sortOrder), showInMenu: c.showInMenu, imageUrl: c.imageUrl ?? "", isActive: c.isActive });
    setError(""); setModal("edit");
  }

  async function handleSave() {
    if (!form.name) { setError("Ad zorunludur."); return; }
    setSaving(true); setError("");
    try {
      const body = { name: form.name, slug: form.slug || slugify(form.name), parentCategoryId: form.parentCategoryId || null, description: form.description || null, imageUrl: form.imageUrl || null, sortOrder: parseInt(form.sortOrder) || 0, showInMenu: form.showInMenu, metaTitle: null, metaDescription: null };
      if (modal === "create") {
        await api.post("/api/categories", body);
        setMsg({ text: "Kategori oluşturuldu.", ok: true });
      } else {
        await api.put(`/api/categories/${form.id}`, { id: form.id, isActive: form.isActive, ...body });
        setMsg({ text: "Kategori güncellendi.", ok: true });
      }
      setModal(null); await fetchData();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Hata"); }
    finally { setSaving(false); }
  }

  function handleExport() {
    exportToExcel(
      categories.map(c => ({
        "Ad": c.name, "Slug": c.slug,
        "Üst Kategori": c.parentCategoryName ?? "",
        "Sıra": c.sortOrder, "Menüde": c.showInMenu ? "Evet" : "Hayır",
        "Durum": c.isActive ? "Aktif" : "Pasif",
      })),
      "kategoriler", "Kategoriler"
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
          await api.post("/api/categories", {
            name, slug: slugify(name), parentCategoryId: null,
            description: String(row["Açıklama"] ?? "") || null,
            imageUrl: null, sortOrder: Number(row["Sıra"] ?? 0),
            showInMenu: String(row["Menüde"] ?? "Evet") === "Evet",
            metaTitle: null, metaDescription: null,
          });
          ok++;
        } catch { fail++; }
      }
      setImportResult(`${ok} kategori eklendi${fail > 0 ? `, ${fail} hatalı` : ""}.`);
      await fetchData();
    } catch { setImportResult("Dosya okunamadı."); }
    finally { setImporting(false); e.target.value = ""; }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/categories/${deleteTarget.id}`);
      setMsg({ text: `"${deleteTarget.name}" silindi.`, ok: true });
      setDeleteTarget(null);
      await fetchData();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Silinemedi", ok: false });
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const isSearching = !!(filterText || menuFilter || activeFilter);

  const filteredCats = categories.filter(c => {
    const matchText = !filterText || c.name.toLowerCase().includes(filterText.toLowerCase());
    const matchMenu = !menuFilter || String(c.showInMenu) === menuFilter;
    const matchActive = !activeFilter || String(c.isActive) === activeFilter;
    return matchText && matchMenu && matchActive;
  });

  const sortedCats = sortField
    ? [...filteredCats].sort((a, b) => {
        let aVal = "", bVal = "";
        if (sortField === "createdDate") { aVal = a.createdDate ?? ""; bVal = b.createdDate ?? ""; }
        else if (sortField === "dataSource") { aVal = a.dataSource ?? a.importedFromSourceName ?? ""; bVal = b.dataSource ?? b.importedFromSourceName ?? ""; }
        const cmp = aVal.localeCompare(bVal);
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filteredCats;

  const allRoots = (sortField ? sortedCats : categories).filter(c => !c.parentCategoryId);

  // A root is visible if it itself matches OR any of its children match
  const visibleRoots = allRoots.filter(cat =>
    sortedCats.some(c => c.id === cat.id) ||
    sortedCats.some(c => c.parentCategoryId === cat.id)
  );

  const totalRoots = visibleRoots.length;
  const totalPages = Math.max(1, Math.ceil(totalRoots / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRoots = visibleRoots.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getVisibleChildren = (parentId: string) =>
    sortedCats.filter(c => c.parentCategoryId === parentId);

  const isExpanded = (catId: string) => isSearching || !collapsedIds.has(catId);

  const anyCollapsed = collapsedIds.size > 0;
  const pageNums = buildPageNums(totalPages, safePage);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Kategoriler</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadTemplate(["Ad", "Açıklama", "Sıra", "Menüde"], "kategoriler")}
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
            <Plus size={16} /> Yeni Kategori
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-white py-3 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={filterText} onChange={e => setFilterText(e.target.value)}
            placeholder="Kategori adı ara..."
            className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-52 text-slate-900 bg-white" />
          {filterText && (
            <button onClick={() => setFilterText("")} className="absolute right-2 top-2.5 text-slate-300 hover:text-slate-500">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={menuFilter} onChange={e => setMenuFilter(e.target.value as "" | "true" | "false")}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">Tüm Menü</option>
          <option value="true">Menüde</option>
          <option value="false">Menüde Değil</option>
        </select>
        <select value={activeFilter} onChange={e => setActiveFilter(e.target.value as "" | "true" | "false")}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">Tüm Durum</option>
          <option value="true">Aktif</option>
          <option value="false">Pasif</option>
        </select>
        {isSearching && (
          <button onClick={() => { setFilterText(""); setMenuFilter(""); setActiveFilter(""); }}
            className="px-3 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">
            Temizle
          </button>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {/* Expand/Collapse all */}
          {!isSearching && (
            <button
              onClick={() => anyCollapsed ? setCollapsedIds(new Set()) : setCollapsedIds(new Set(allRoots.map(c => c.id)))}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition"
              title={anyCollapsed ? "Tümünü Genişlet" : "Tümünü Daralt"}
            >
              {anyCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
              {anyCollapsed ? "Genişlet" : "Daralt"}
            </button>
          )}

          {/* Page size */}
          <div className="flex items-center gap-1 border border-slate-300 rounded-xl overflow-hidden ml-1">
            {PAGE_SIZES.map(s => (
              <button key={s} onClick={() => setPageSize(s)}
                className={`px-3 py-2 text-xs font-medium transition ${pageSize === s ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
                {s}
              </button>
            ))}
          </div>

          <span className="text-sm text-slate-500 ml-2 whitespace-nowrap">
            {totalRoots} ana kategori
          </span>
        </div>
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-slate-400">Yükleniyor...</p>
        ) : pagedRoots.length === 0 ? (
          <p className="p-8 text-center text-slate-400">Henüz kategori yok</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Kategori</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">
                  <span className="flex items-center gap-1">
                    Slug
                    <span title="Slug, URL adresinde görünen benzersiz kimlik metnidir. Örn: 'erkek-ayakkabisi' → /kategori/erkek-ayakkabisi. Türkçe karakter ve boşluk içermez."><Info size={12} className="text-slate-400 cursor-help" /></span>
                  </span>
                </th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Menüde</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Durum</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("createdDate")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">Oluşturulma Tarihi <SortIcon field="createdDate" /></button></th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("dataSource")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">Kaynak <SortIcon field="dataSource" /></button></th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Oluşturan</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedRoots.map(cat => {
                const visibleKids = getVisibleChildren(cat.id);
                const expanded = isExpanded(cat.id);
                return (
                  <>
                    {/* Parent row */}
                    <tr key={cat.id} className="hover:bg-teal-50/40 border-l-4 border-l-teal-500 bg-white">
                      <td className="px-4 py-3 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          {/* Collapse toggle */}
                          {visibleKids.length > 0 ? (
                            <button
                              onClick={() => !isSearching && toggleCollapse(cat.id)}
                              className={`text-slate-400 hover:text-teal-600 transition ${isSearching ? "cursor-default opacity-50" : ""}`}
                            >
                              {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </button>
                          ) : (
                            <span className="w-[15px]" />
                          )}
                          {/* Icon */}
                          {cat.imageUrl
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={cat.imageUrl} alt={cat.name} className="w-8 h-8 object-cover rounded-lg" />
                            : (expanded
                              ? <FolderOpen size={18} className="text-teal-500 shrink-0" />
                              : <Folder size={18} className="text-teal-400 shrink-0" />)
                          }
                          <span className="text-slate-800">{cat.name}</span>
                          {visibleKids.length > 0 && (
                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
                              {visibleKids.length} alt
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs font-mono">{cat.slug}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cat.showInMenu ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                          {cat.showInMenu ? "Evet" : "Hayır"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cat.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {cat.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {cat.createdDate ? new Date(cat.createdDate).toLocaleDateString("tr-TR") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {cat.dataSource
                          ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{cat.dataSource}</span>
                          : cat.importedFromSourceName
                          ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{cat.importedFromSourceName}</span>
                          : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400 max-w-[140px] truncate" title={cat.createdByAdminEmail}>{cat.createdByAdminEmail ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => openHistory(cat)} title="Geçmiş"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm hover:shadow-amber-200 hover:shadow-md transition-all duration-150 active:scale-95">
                            <History size={16} />
                          </button>
                          <button onClick={() => openEdit(cat)} title="Düzenle"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => setDeleteTarget(cat)} title="Sil"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-red-200 hover:shadow-md transition-all duration-150 active:scale-95">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Child rows */}
                    {expanded && visibleKids.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50 bg-slate-50/50 border-l-4 border-l-transparent">
                        <td className="px-5 py-2.5 text-xs text-slate-600 pl-12">
                          <div className="flex items-center gap-2">
                            {sub.imageUrl
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={sub.imageUrl} alt={sub.name} className="w-6 h-6 object-cover rounded" />
                              : <Folder size={14} className="text-slate-400 shrink-0" />}
                            <span className="text-slate-400 mr-0.5">↳</span>
                            {sub.name}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-slate-400 text-xs font-mono">{sub.slug}</td>
                        <td className="px-5 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sub.showInMenu ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                            {sub.showInMenu ? "Evet" : "Hayır"}
                          </span>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sub.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                            {sub.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-500">
                          {sub.createdDate ? new Date(sub.createdDate).toLocaleDateString("tr-TR") : "—"}
                        </td>
                        <td className="px-5 py-2.5">
                          {sub.dataSource
                            ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{sub.dataSource}</span>
                            : sub.importedFromSourceName
                            ? <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{sub.importedFromSourceName}</span>
                            : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button onClick={() => openHistory(sub)} title="Geçmiş"
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm hover:shadow-amber-200 hover:shadow-md transition-all duration-150 active:scale-95">
                              <History size={14} />
                            </button>
                            <button onClick={() => openEdit(sub)} title="Düzenle"
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => setDeleteTarget(sub)} title="Sil"
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-red-200 hover:shadow-md transition-all duration-150 active:scale-95">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalRoots)} / {totalRoots} ana kategori
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage === 1}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
            {pageNums.map((n, i) =>
              n === "…"
                ? <span key={`e${i}`} className="px-2 py-1.5 text-slate-400 text-sm select-none">…</span>
                : <button key={n} onClick={() => setPage(n as number)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${safePage === n ? "bg-teal-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {n}
                  </button>
            )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">›</button>
            <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">»</button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Kategoriyi Sil</h3>
                  <p className="text-xs text-slate-500">Bu işlem geri alınamaz.</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <p className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <strong>"{deleteTarget.name}"</strong> kategorisi silinecek.
                </p>
                <p className="text-xs text-slate-500 px-1">Alt kategorisi veya aktif ürünü olan kategoriler silinemez.</p>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 transition">İptal</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-50">
                {deleting ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category History Modal */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <History size={16} className="text-amber-500" /> Kategori Geçmişi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{historyTarget.name}</p>
              </div>
              <button onClick={() => setHistoryTarget(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {historyLoading ? (
                <p className="p-8 text-center text-slate-400">Yükleniyor...</p>
              ) : historyLogs.length === 0 ? (
                <p className="p-8 text-center text-slate-400">Bu kategoriye ait hareket kaydı bulunamadı.</p>
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
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CAT_ACTION_COLORS[l.action] ?? "bg-slate-100 text-slate-600"}`}>
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

      {/* Create / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col transition-all duration-200 ${showPreview ? "max-w-4xl" : "max-w-2xl"}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="font-bold text-slate-800">{modal === "create" ? "Yeni Kategori" : "Kategoriyi Düzenle"}</h2>
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
                  <span title="Slug, URL adresinde görünen benzersiz kimlik metnidir. Örn: 'erkek-ayakkabisi'. Türkçe karakter ve boşluk içermez."><Info size={12} className="text-slate-400 cursor-help" /></span>
                </label>
                <input className={INPUT} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} />
              </div>
              <ImageUpload value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))} label="Kategori Görseli" />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Üst Kategori</label>
                <select className={INPUT} value={form.parentCategoryId} onChange={e => setForm(f => ({ ...f, parentCategoryId: e.target.value }))}>
                  <option value="">Ana Kategori</option>
                  {categories.filter(c => c.id !== form.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Açıklama</label>
                <RichTextEditor
                  value={form.description}
                  onChange={v => setForm(f => ({ ...f, description: v }))}
                  placeholder="Kategori açıklaması (isteğe bağlı)..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sıra</label>
                  <input type="number" className={INPUT} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-2 justify-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={form.showInMenu} onChange={e => setForm(f => ({ ...f, showInMenu: e.target.checked }))} />
                    Menüde Göster
                  </label>
                  {modal === "edit" && (
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                      Aktif
                    </label>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => setModal(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">Vazgeç</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                  {saving ? "Kaydediliyor..." : modal === "create" ? "Oluştur" : "Güncelle"}
                </button>
              </div>
            </div>

            <PreviewPanel open={showPreview}>
              <CategoryPreview form={form} />
            </PreviewPanel>

            </div>{/* /flex */}
          </div>
        </div>
      )}
    </div>
  );
}
