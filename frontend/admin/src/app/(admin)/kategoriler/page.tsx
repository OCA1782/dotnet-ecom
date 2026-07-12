"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import { exportToExcel, readExcelFile, downloadTemplate } from "@/lib/excel";
import {
  Plus, Pencil, Trash2, X, Download, Upload, Search,
  ChevronRight, ChevronDown, FolderOpen, Folder,
  ChevronsDownUp, ChevronsUpDown, Info, History, ChevronUp,
  ToggleLeft, ToggleRight, Loader2, CheckSquare, Square,
  Car, ZoomIn, RefreshCw,
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

interface CategoryProduct {
  id: string;
  name: string;
  sku?: string;
  price: number;
  isActive: boolean;
}

interface CategoryProductsResult {
  items: CategoryProduct[];
  totalCount: number;
  subcategoryCount: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  imageUrl?: string;
  sortOrder: number;
  showInMenu: boolean;
  showInVehicleNav?: boolean;
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
  showInVehicleNav: boolean;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY: CatForm = { name: "", slug: "", parentCategoryId: "", description: "", sortOrder: "0", showInMenu: true, showInVehicleNav: false, imageUrl: "", isActive: true };

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

// ─── imagin.studio picker sabitleri ─────────────────────────────────────────
const IMAGIN_MAKES = [
  { v: "opel", l: "Opel" }, { v: "chevrolet", l: "Chevrolet" },
  { v: "bmw", l: "BMW" }, { v: "mercedes-benz", l: "Mercedes-Benz" },
  { v: "volkswagen", l: "Volkswagen" }, { v: "audi", l: "Audi" },
  { v: "ford", l: "Ford" }, { v: "seat", l: "Seat" }, { v: "skoda", l: "Skoda" },
  { v: "renault", l: "Renault" }, { v: "peugeot", l: "Peugeot" },
  { v: "citroen", l: "Citroën" }, { v: "fiat", l: "Fiat" }, { v: "toyota", l: "Toyota" },
  { v: "hyundai", l: "Hyundai" }, { v: "kia", l: "Kia" }, { v: "honda", l: "Honda" },
  { v: "nissan", l: "Nissan" }, { v: "mazda", l: "Mazda" }, { v: "volvo", l: "Volvo" },
  { v: "mitsubishi", l: "Mitsubishi" }, { v: "suzuki", l: "Suzuki" },
  { v: "jeep", l: "Jeep" }, { v: "land-rover", l: "Land Rover" },
  { v: "alfa-romeo", l: "Alfa Romeo" }, { v: "dacia", l: "Dacia" },
  { v: "porsche", l: "Porsche" }, { v: "subaru", l: "Subaru" },
  { v: "saab", l: "Saab" }, { v: "lexus", l: "Lexus" }, { v: "fiat", l: "Tofaş (Fiat)" },
];
const IMAGIN_PAINTS = [
  { v: "color-red", l: "Kırmızı" }, { v: "color-blue", l: "Mavi" },
  { v: "color-midnight-blue", l: "Lacivert" }, { v: "color-silver", l: "Gümüş" },
  { v: "color-forest-green", l: "Yeşil" }, { v: "color-white", l: "Beyaz" },
  { v: "color-grey", l: "Gri" }, { v: "color-orange", l: "Turuncu" },
  { v: "color-black", l: "Siyah" }, { v: "color-yellow", l: "Sarı" },
];
const IMAGIN_ANGLES = [
  { v: "23", l: "Yan (profil)" }, { v: "1", l: "Ön" },
  { v: "4", l: "Arka" }, { v: "29", l: "Ön-Yan" }, { v: "13", l: "Arka-Yan" },
];

const PAGE_SIZES = [10, 25, 50] as const;
type PageSize = typeof PAGE_SIZES[number];

type SortField = "createdDate" | "dataSource";

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: "asc" | "desc" }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30 ml-1 inline-block" />;
  return sortDir === "asc" ? <ChevronUp size={12} className="text-teal-600 ml-1 inline-block" /> : <ChevronDown size={12} className="text-teal-600 ml-1 inline-block" />;
}

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
  const { t } = useI18n();
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
  const [dataSourceFilter, setDataSourceFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteProds, setDeleteProds] = useState<CategoryProduct[]>([]);
  const [deleteProdTotal, setDeleteProdTotal] = useState(0);
  const [deleteSubcatCount, setDeleteSubcatCount] = useState(0);
  const [deleteProdPage, setDeleteProdPage] = useState(1);
  const [deleteProdSearch, setDeleteProdSearch] = useState("");
  const [deleteProdSort, setDeleteProdSort] = useState("name");
  const [deleteProdSortDir, setDeleteProdSortDir] = useState<"asc" | "desc">("asc");
  const [deleteProdLoading, setDeleteProdLoading] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [imagin, setImagin] = useState({ open: false, make: "", family: "", paint: "color-red", angle: "23" });
  const [templateTag, setTemplateTag] = useState<"" | "spareparts">("");

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }

  async function handleInlineToggle(cat: Category) {
    setToggling(cat.id);
    try {
      await api.put(`/api/categories/${cat.id}`, {
        id: cat.id, name: cat.name, slug: cat.slug,
        parentCategoryId: cat.parentCategoryId ?? null,
        description: null, imageUrl: cat.imageUrl ?? null,
        sortOrder: cat.sortOrder, showInMenu: cat.showInMenu,
        showInVehicleNav: cat.showInVehicleNav ?? false,
        isActive: !cat.isActive, metaTitle: null, metaDescription: null,
      });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !cat.isActive } : c));
      setMsg({ text: `"${cat.name}" ${!cat.isActive ? "aktif" : "pasif"} yapıldı.`, ok: true });
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Bir hata oluştu", ok: false });
    } finally { setToggling(null); }
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    setBulkLoading(true);
    const results = await Promise.allSettled(ids.map(id => api.delete(`/api/categories/${id}`)));
    const ok = results.filter(r => r.status === "fulfilled").length;
    const fail = ids.length - ok;
    setMsg({ text: `${ok} kategori silindi${fail > 0 ? ` (${fail} hata)` : ""}`, ok: ok > 0 });
    setSelectedIds(new Set());
    setBulkLoading(false);
    await fetchData();
  }

  async function handleBulkToggle(targetActive: boolean) {
    setBulkLoading(true);
    const targets = categories.filter(c => selectedIds.has(c.id));
    const results = await Promise.allSettled(targets.map(cat =>
      api.put(`/api/categories/${cat.id}`, {
        id: cat.id, name: cat.name, slug: cat.slug,
        parentCategoryId: cat.parentCategoryId ?? null,
        description: null, imageUrl: cat.imageUrl ?? null,
        sortOrder: cat.sortOrder, showInMenu: cat.showInMenu,
        showInVehicleNav: cat.showInVehicleNav ?? false,
        isActive: targetActive, metaTitle: null, metaDescription: null,
      })
    ));
    const ok = results.filter(r => r.status === "fulfilled").length;
    const fail = results.filter(r => r.status === "rejected").length;
    setMsg({ text: `${ok} kategori güncellendi${fail > 0 ? `, ${fail} hatalı` : ""}.`, ok: fail === 0 });
    setSelectedIds(new Set());
    setBulkLoading(false);
    await fetchData();
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Category[]>("/api/categories?onlyActive=false");
      setCategories(flattenCategories(data));
    } catch { setCategories([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(id);
  }, [fetchData]);

  // Reset to page 1 when any filter/sort changes
  useEffect(() => {
    const id = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(id);
  }, [filterText, menuFilter, activeFilter, pageSize, sortField, sortDir]);

  function toggleCollapse(id: string) {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); setImagin({ open: false, make: "", family: "", paint: "color-red", angle: "23" }); setTemplateTag(""); }
  function openEdit(c: Category) {
    setForm({ id: c.id, name: c.name, slug: c.slug, parentCategoryId: c.parentCategoryId ?? "", description: "", sortOrder: String(c.sortOrder), showInMenu: c.showInMenu, showInVehicleNav: c.showInVehicleNav ?? false, imageUrl: c.imageUrl ?? "", isActive: c.isActive });
    setError(""); setModal("edit"); setImagin({ open: false, make: "", family: "", paint: "color-red", angle: "23" });
    setTemplateTag(c.imageUrl?.includes("imagin.studio") ? "spareparts" : "");
  }

  async function handleSave() {
    if (!form.name) { setError(t("form.nameRequired", "Ad zorunludur.")); return; }
    setSaving(true); setError("");
    try {
      const body = { name: form.name, slug: form.slug || slugify(form.name), parentCategoryId: form.parentCategoryId || null, description: form.description || null, imageUrl: form.imageUrl || null, sortOrder: parseInt(form.sortOrder) || 0, showInMenu: form.showInMenu, showInVehicleNav: form.showInVehicleNav, metaTitle: null, metaDescription: null };
      if (modal === "create") {
        await api.post("/api/categories", body);
        setMsg({ text: t("msg.created", "Başarıyla oluşturuldu"), ok: true });
      } else {
        await api.put(`/api/categories/${form.id}`, { id: form.id, isActive: form.isActive, ...body });
        setMsg({ text: t("msg.updated", "Başarıyla güncellendi"), ok: true });
      }
      setModal(null); await fetchData();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu")); }
    finally { setSaving(false); }
  }

  function handleExport() {
    exportToExcel(
      categories.map(c => ({
        "Ad": c.name, "Slug": c.slug,
        "Üst Kategori": c.parentCategoryName ?? "",
        "Sıra": c.sortOrder, "Menüde": c.showInMenu ? t("action.yes", "Evet") : t("action.no", "Hayır"),
        "Durum": c.isActive ? t("status.active", "Aktif") : t("status.passive", "Pasif"),
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
    } catch { setImportResult(t("msg.fileReadFailed", "Dosya okunamadı.")); }
    finally { setImporting(false); e.target.value = ""; }
  }

  const DELPROD_PAGE_SIZE = 15;

  const loadDeleteProducts = useCallback(async (catId: string, page: number, search: string, sortBy: string, sortDir: string) => {
    setDeleteProdLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), pageSize: String(DELPROD_PAGE_SIZE),
        sortBy, sortDir,
        ...(search ? { search } : {}),
      });
      const data = await api.get<CategoryProductsResult>(`/api/categories/${catId}/products?${params}`);
      setDeleteProds(data.items);
      setDeleteProdTotal(data.totalCount);
      setDeleteSubcatCount(data.subcategoryCount);
    } catch {
      setDeleteProds([]);
      setDeleteProdTotal(0);
    } finally { setDeleteProdLoading(false); }
  }, []);

  function openDeleteModal(cat: Category) {
    setDeleteTarget(cat);
    setDeleteProdPage(1);
    setDeleteProdSearch("");
    setDeleteProdSort("name");
    setDeleteProdSortDir("asc");
    void loadDeleteProducts(cat.id, 1, "", "name", "asc");
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
    setDeleteProds([]);
    setDeleteProdTotal(0);
    setDeleteSubcatCount(0);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/categories/${deleteTarget.id}?cascade=true`);
      setMsg({ text: `"${deleteTarget.name}" ${t("msg.deleted", "Başarıyla silindi")}`, ok: true });
      closeDeleteModal();
      await fetchData();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu"), ok: false });
      closeDeleteModal();
    } finally { setDeleting(false); }
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const isSearching = !!(filterText || menuFilter || activeFilter || dataSourceFilter);

  const filteredCats = categories.filter(c => {
    const matchText = !filterText || c.name.toLowerCase().includes(filterText.toLowerCase());
    const matchMenu = !menuFilter || String(c.showInMenu) === menuFilter;
    const matchActive = !activeFilter || String(c.isActive) === activeFilter;
    const matchSource = !dataSourceFilter || (
      dataSourceFilter === "__manual__"
        ? !c.dataSource && !c.importedFromSourceName
        : (c.dataSource === dataSourceFilter || c.importedFromSourceName === dataSourceFilter)
    );
    return matchText && matchMenu && matchActive && matchSource;
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

  const visiblePageIds = new Set<string>();
  pagedRoots.forEach(cat => {
    visiblePageIds.add(cat.id);
    if (isExpanded(cat.id)) getVisibleChildren(cat.id).forEach(sub => visiblePageIds.add(sub.id));
  });
  const allPageSelected = visiblePageIds.size > 0 && [...visiblePageIds].every(id => selectedIds.has(id));

  function toggleSelectAll() {
    if (allPageSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set([...selectedIds, ...visiblePageIds]));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t("nav./kategoriler", "Kategoriler")}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadTemplate(["Ad", "Açıklama", "Sıra", "Menüde"], "kategoriler")}
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
            <Plus size={16} /> {t("ui.newCategory", "Yeni Kategori")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-white py-3 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={filterText} onChange={e => setFilterText(e.target.value)}
            placeholder={t("ui.searchCategories", "Kategori adı...")}
            className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-52 text-slate-900 bg-white" />
          {filterText && (
            <button onClick={() => setFilterText("")} className="absolute right-2 top-2.5 text-slate-300 hover:text-slate-500">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={menuFilter} onChange={e => setMenuFilter(e.target.value as "" | "true" | "false")}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">{t("filter.all", "Tümü")} Menü</option>
          <option value="true">Menüde</option>
          <option value="false">Menüde Değil</option>
        </select>
        <select value={activeFilter} onChange={e => setActiveFilter(e.target.value as "" | "true" | "false")}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">{t("filter.allStatus", "Tüm Durumlar")}</option>
          <option value="true">{t("status.active", "Aktif")}</option>
          <option value="false">{t("status.passive", "Pasif")}</option>
        </select>
        <select value={dataSourceFilter} onChange={e => { setDataSourceFilter(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 min-w-[140px]">
          <option value="">{t("filter.allSources", "Tüm Kaynaklar")}</option>
          <option value="__manual__">{t("filter.manual", "Manuel Giriş")}</option>
          <option value="catalogiq">CatalogIQ</option>
          <option value="test">Test</option>
        </select>
        {isSearching && (
          <button onClick={() => { setFilterText(""); setMenuFilter(""); setActiveFilter(""); setDataSourceFilter(""); }}
            className="px-3 py-2 border border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">
            {t("action.clear", "Temizle")}
          </button>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {/* Expand/Collapse all */}
          {!isSearching && (
            <button
              onClick={() => anyCollapsed ? setCollapsedIds(new Set()) : setCollapsedIds(new Set(allRoots.map(c => c.id)))}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition"
              title={anyCollapsed ? t("action.selectAll", "Tümünü Seç") : t("action.clear", "Temizle")}
            >
              {anyCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
              {anyCollapsed ? t("ui.expand", "Genişlet") : t("ui.collapse", "Daralt")}
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
            {totalRoots} {t("ui.rootCategories", "ana kategori")}
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

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm flex-wrap">
          <span className="font-semibold">{selectedIds.size} seçili</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => handleBulkToggle(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-50"
            >
              <ToggleRight size={14} /> Aktifleştir
            </button>
            <button
              onClick={() => handleBulkToggle(false)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold transition disabled:opacity-50"
            >
              {bulkLoading ? <Loader2 size={14} className="animate-spin" /> : <ToggleLeft size={14} />} Pasife Al
            </button>
            <button onClick={() => setBulkDeleteModal(true)} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold transition disabled:opacity-50">
              <Trash2 size={13} /> {t("action.delete", "Sil")}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs transition"
            >
              Vazgeç
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
                <p className="text-xs text-slate-500">{selectedIds.size} kategori seçili</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">{t("msg.confirmDelete", "Silmek istediğinizden emin misiniz?")} (<span className="font-semibold">{selectedIds.size} Kategori</span>)</p>
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-slate-400">{t("action.loading", "Yükleniyor...")}</p>
        ) : pagedRoots.length === 0 ? (
          <p className="p-8 text-center text-slate-400">{t("table.noData", "Kayıt bulunamadı")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-8">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-teal-600 transition">
                    {allPageSelected ? <CheckSquare size={16} className="text-teal-600" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{t("col.category", "Kategori")}</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">
                  <span className="flex items-center gap-1">
                    Slug
                    <span title="Slug, URL adresinde görünen benzersiz kimlik metnidir. Örn: 'erkek-ayakkabisi' → /kategori/erkek-ayakkabisi. Türkçe karakter ve boşluk içermez."><Info size={12} className="text-slate-400 cursor-help" /></span>
                  </span>
                </th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">Görünüm</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{t("col.status", "Durum")}</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("createdDate")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">{t("col.createdAt", "Oluşturma")} <SortIcon field="createdDate" sortField={sortField} sortDir={sortDir} /></button></th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs"><button onClick={() => handleSort("dataSource")} className="flex items-center gap-0.5 hover:text-teal-600 transition select-none">{t("col.source", "Kaynak")} <SortIcon field="dataSource" sortField={sortField} sortDir={sortDir} /></button></th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{t("col.createdBy", "Oluşturan")}</th>
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
                    <tr key={cat.id} className={`hover:bg-teal-50/40 border-l-4 border-l-teal-500 bg-white ${selectedIds.has(cat.id) ? "bg-teal-50" : ""}`}>
                      <td className="px-3 py-3">
                        <button onClick={() => toggleSelect(cat.id)} className="text-slate-400 hover:text-teal-600 transition">
                          {selectedIds.has(cat.id) ? <CheckSquare size={15} className="text-teal-600" /> : <Square size={15} />}
                        </button>
                      </td>
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
                            ? (
                              <button onClick={e => { e.stopPropagation(); setZoomUrl(cat.imageUrl!); }} className="relative group shrink-0" title="Resmi büyüt">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={cat.imageUrl} alt={cat.name} className="w-8 h-8 object-cover rounded-lg" />
                                <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ZoomIn size={12} className="text-white" />
                                </span>
                              </button>
                            )
                            : (expanded
                              ? <FolderOpen size={18} className="text-teal-500 shrink-0" />
                              : <Folder size={18} className="text-teal-400 shrink-0" />)
                          }
                          <span className="text-slate-800">{cat.name}</span>
                          {visibleKids.length > 0 && (
                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
                              {visibleKids.length} {t("ui.sub", "alt")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs font-mono">{cat.slug}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {cat.showInMenu && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap">Kategori Menüsü</span>
                          )}
                          {cat.showInVehicleNav && (
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap">🚗 Otomotiv</span>
                          )}
                          {!cat.showInMenu && !cat.showInVehicleNav && (
                            <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-semibold">Gizli</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleInlineToggle(cat)}
                          disabled={toggling === cat.id}
                          title={cat.isActive ? "Pasife al" : "Aktifleştir"}
                          className="flex items-center gap-1.5 text-xs font-semibold transition disabled:opacity-50"
                        >
                          {toggling === cat.id
                            ? <Loader2 size={16} className="animate-spin text-slate-400" />
                            : cat.isActive
                              ? <ToggleRight size={18} className="text-emerald-500" />
                              : <ToggleLeft size={18} className="text-slate-300" />
                          }
                          <span className={cat.isActive ? "text-emerald-700" : "text-slate-400"}>
                            {cat.isActive ? t("status.active", "Aktif") : t("status.passive", "Pasif")}
                          </span>
                        </button>
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
                          <button onClick={() => openHistory(cat)} title={t("tab.history", "Geçmiş")}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm hover:shadow-amber-200 hover:shadow-md transition-all duration-150 active:scale-95">
                            <History size={16} />
                          </button>
                          <button onClick={() => openEdit(cat)} title={t("action.edit", "Düzenle")}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => openDeleteModal(cat)} title={t("action.delete", "Sil")}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-red-200 hover:shadow-md transition-all duration-150 active:scale-95">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Child rows */}
                    {expanded && visibleKids.map(sub => (
                      <tr key={sub.id} className={`hover:bg-slate-50 bg-slate-50/50 border-l-4 border-l-transparent ${selectedIds.has(sub.id) ? "bg-teal-50/60" : ""}`}>
                        <td className="px-3 py-2.5">
                          <button onClick={() => toggleSelect(sub.id)} className="text-slate-300 hover:text-teal-600 transition">
                            {selectedIds.has(sub.id) ? <CheckSquare size={14} className="text-teal-600" /> : <Square size={14} />}
                          </button>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-600 pl-12">
                          <div className="flex items-center gap-2">
                            {sub.imageUrl
                              ? (
                                <button onClick={e => { e.stopPropagation(); setZoomUrl(sub.imageUrl!); }} className="relative group shrink-0" title="Resmi büyüt">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={sub.imageUrl} alt={sub.name} className="w-6 h-6 object-cover rounded" />
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ZoomIn size={10} className="text-white" />
                                  </span>
                                </button>
                              )
                              : <Folder size={14} className="text-slate-400 shrink-0" />}
                            <span className="text-slate-400 mr-0.5">↳</span>
                            {sub.name}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-slate-400 text-xs font-mono">{sub.slug}</td>
                        <td className="px-5 py-2.5">
                          {sub.showInMenu
                            ? <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">Kategori Menüsü</span>
                            : <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-semibold">Gizli</span>}
                        </td>
                        <td className="px-5 py-2.5">
                          <button
                            onClick={() => handleInlineToggle(sub)}
                            disabled={toggling === sub.id}
                            title={sub.isActive ? "Pasife al" : "Aktifleştir"}
                            className="flex items-center gap-1 text-xs font-semibold transition disabled:opacity-50"
                          >
                            {toggling === sub.id
                              ? <Loader2 size={14} className="animate-spin text-slate-400" />
                              : sub.isActive
                                ? <ToggleRight size={16} className="text-emerald-500" />
                                : <ToggleLeft size={16} className="text-slate-300" />
                            }
                            <span className={sub.isActive ? "text-emerald-700" : "text-slate-400"}>
                              {sub.isActive ? t("status.active", "Aktif") : t("status.passive", "Pasif")}
                            </span>
                          </button>
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
                            <button onClick={() => openHistory(sub)} title={t("tab.history", "Geçmiş")}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm hover:shadow-amber-200 hover:shadow-md transition-all duration-150 active:scale-95">
                              <History size={14} />
                            </button>
                            <button onClick={() => openEdit(sub)} title={t("action.edit", "Düzenle")}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white shadow-sm hover:shadow-teal-200 hover:shadow-md transition-all duration-150 active:scale-95">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => openDeleteModal(sub)} title={t("action.delete", "Sil")}
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
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalRoots)} / {totalRoots} {t("ui.rootCategories", "ana kategori")}
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

      {/* Delete modal — enhanced with product list */}
      {deleteTarget && (() => {
        const target = deleteTarget;
        const delTotalPages = Math.max(1, Math.ceil(deleteProdTotal / DELPROD_PAGE_SIZE));
        const delPageNums = buildPageNums(delTotalPages, deleteProdPage);
        function delSort(field: string) {
          if (deleteProdSort === field) {
            const next = deleteProdSortDir === "asc" ? "desc" : "asc";
            setDeleteProdSortDir(next);
            void loadDeleteProducts(target.id, deleteProdPage, deleteProdSearch, field, next);
          } else {
            setDeleteProdSort(field);
            setDeleteProdSortDir("asc");
            setDeleteProdPage(1);
            void loadDeleteProducts(target.id, 1, deleteProdSearch, field, "asc");
          }
        }
        function delGoPage(p: number) {
          setDeleteProdPage(p);
          void loadDeleteProducts(target.id, p, deleteProdSearch, deleteProdSort, deleteProdSortDir);
        }
        function delSearch(val: string) {
          setDeleteProdSearch(val);
          setDeleteProdPage(1);
          void loadDeleteProducts(target.id, 1, val, deleteProdSort, deleteProdSortDir);
        }
        function DelSortIcon({ field }: { field: string }) {
          if (deleteProdSort !== field) return <ChevronsUpDown size={11} className="opacity-30 ml-0.5 inline-block" />;
          return deleteProdSortDir === "asc"
            ? <ChevronUp size={11} className="text-red-400 ml-0.5 inline-block" />
            : <ChevronDown size={11} className="text-red-400 ml-0.5 inline-block" />;
        }
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                      <Trash2 size={18} className="text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{t("ui.deleteCategory", "Kategoriyi Sil")}</h3>
                      <p className="text-xs text-slate-500">{t("msg.irreversible", "Bu işlem geri alınamaz.")}</p>
                    </div>
                  </div>
                  <button onClick={closeDeleteModal} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                </div>
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm">
                  <span className="font-semibold text-slate-900">&quot;{target.name}&quot;</span>
                  <span className="text-slate-600"> kategorisi</span>
                  {deleteSubcatCount > 0 && <span className="text-red-700 font-medium"> ve {deleteSubcatCount} alt kategorisi</span>}
                  {deleteProdTotal > 0 && <span className="text-red-700 font-medium">, {deleteProdTotal} ürünüyle birlikte</span>}
                  <span className="text-slate-700 font-semibold"> kalıcı olarak silinecek.</span>
                </div>
              </div>

              {/* Product list */}
              <div className="flex flex-col flex-1 min-h-0">
                {/* Search */}
                <div className="px-6 py-3 border-b border-slate-100 shrink-0 flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={deleteProdSearch}
                      onChange={e => delSearch(e.target.value)}
                      placeholder="Ürün adı veya SKU ara..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {deleteProdTotal} ürün
                    {deleteSubcatCount > 0 ? `, ${deleteSubcatCount} alt kategori` : ""}
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-y-auto flex-1 min-h-0">
                  {deleteProdLoading ? (
                    <div className="flex items-center justify-center py-12 text-slate-400">
                      <Loader2 size={20} className="animate-spin mr-2" /> Yükleniyor...
                    </div>
                  ) : deleteProds.length === 0 ? (
                    <p className="py-12 text-center text-slate-400 text-sm">
                      {deleteProdSearch ? "Aramanızla eşleşen ürün bulunamadı." : "Bu kategoride ürün bulunmuyor."}
                    </p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-slate-500 font-medium cursor-pointer select-none" onClick={() => delSort("name")}>
                            Ürün Adı <DelSortIcon field="name" />
                          </th>
                          <th className="text-left px-4 py-2.5 text-slate-500 font-medium cursor-pointer select-none w-36" onClick={() => delSort("sku")}>
                            SKU <DelSortIcon field="sku" />
                          </th>
                          <th className="text-right px-4 py-2.5 text-slate-500 font-medium cursor-pointer select-none w-28" onClick={() => delSort("price")}>
                            Fiyat <DelSortIcon field="price" />
                          </th>
                          <th className="text-center px-4 py-2.5 text-slate-500 font-medium cursor-pointer select-none w-24" onClick={() => delSort("isActive")}>
                            Durum <DelSortIcon field="isActive" />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deleteProds.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 text-slate-800 font-medium">{p.name}</td>
                            <td className="px-4 py-2.5 text-slate-500 font-mono">{p.sku ?? "—"}</td>
                            <td className="px-4 py-2.5 text-slate-700 text-right">{p.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-semibold ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                {p.isActive ? "Aktif" : "Pasif"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination */}
                {delTotalPages > 1 && (
                  <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-center gap-1 shrink-0">
                    <button onClick={() => delGoPage(1)} disabled={deleteProdPage === 1} className="px-2 py-1 rounded text-xs border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30">«</button>
                    <button onClick={() => delGoPage(deleteProdPage - 1)} disabled={deleteProdPage === 1} className="px-2 py-1 rounded text-xs border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30">‹</button>
                    {delPageNums.map((n, i) =>
                      n === "…" ? <span key={`e${i}`} className="px-1 text-slate-400 text-xs">…</span>
                        : <button key={n} onClick={() => delGoPage(n as number)}
                            className={`w-7 h-7 rounded text-xs font-medium transition ${deleteProdPage === n ? "bg-red-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                            {n}
                          </button>
                    )}
                    <button onClick={() => delGoPage(deleteProdPage + 1)} disabled={deleteProdPage === delTotalPages} className="px-2 py-1 rounded text-xs border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30">›</button>
                    <button onClick={() => delGoPage(delTotalPages)} disabled={deleteProdPage === delTotalPages} className="px-2 py-1 rounded text-xs border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30">»</button>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <button onClick={closeDeleteModal}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 transition">
                  {t("action.cancel", "İptal")}
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2">
                  {deleting && <Loader2 size={14} className="animate-spin" />}
                  {deleting ? t("action.deleting", "Siliniyor...") : "Kategoriyi ve Tüm İçeriği Sil"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Category History Modal */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <History size={16} className="text-amber-500" /> {t("ui.categoryHistory", "Kategori Geçmişi")}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{historyTarget.name}</p>
              </div>
              <button onClick={() => setHistoryTarget(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {historyLoading ? (
                <p className="p-8 text-center text-slate-400">{t("action.loading", "Yükleniyor...")}</p>
              ) : historyLogs.length === 0 ? (
                <p className="p-8 text-center text-slate-400">{t("table.noData", "Kayıt bulunamadı")}</p>
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
              <button onClick={() => setHistoryTarget(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">{t("action.close", "Kapat")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col transition-all duration-200 ${showPreview ? "max-w-4xl" : "max-w-2xl"}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="font-bold text-slate-800">{modal === "create" ? t("ui.newCategory", "Yeni Kategori") : t("ui.editCategory", "Kategoriyi Düzenle")}</h2>
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
                  <span title="Slug, URL adresinde görünen benzersiz kimlik metnidir. Örn: 'erkek-ayakkabisi'. Türkçe karakter ve boşluk içermez."><Info size={12} className="text-slate-400 cursor-help" /></span>
                </label>
                <input className={INPUT} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} />
              </div>
              <ImageUpload value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))} label={t("ui.categoryImage", "Kategori Görseli")} />

              {/* ── Şablon Seçimi ─────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Şablon</label>
                <select className={INPUT} value={templateTag} onChange={e => setTemplateTag(e.target.value as "" | "spareparts")}>
                  <option value="">Genel</option>
                  <option value="spareparts">Yedek Parça</option>
                </select>
              </div>

              {/* ── imagin.studio Picker ──────────────────────────────────── */}
              {templateTag === "spareparts" && (() => {
                const url = imagin.make
                  ? `https://cdn.imagin.studio/getimage?customer=img&make=${imagin.make}${imagin.family ? `&modelFamily=${encodeURIComponent(imagin.family)}` : ""}&angle=${imagin.angle}&width=800&zoomType=fullscreen&paintId=${imagin.paint}`
                  : "";
                return (
                  <div className="border border-orange-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setImagin(s => ({ ...s, open: !s.open }))}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-50 hover:bg-orange-100 transition text-sm font-semibold text-orange-700"
                    >
                      <span className="flex items-center gap-2">
                        <Car size={14} />
                        imagin.studio ile Araç Fotoğrafı Oluştur
                        <span className="text-[10px] bg-orange-200 text-orange-600 px-1.5 py-0.5 rounded font-bold">Yedek Parça</span>
                      </span>
                      <ChevronDown size={14} className={`transition-transform ${imagin.open ? "rotate-180" : ""}`} />
                    </button>

                    {imagin.open && (
                      <div className="px-4 py-3 space-y-3 bg-white">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Marka (Make)</label>
                            <select className={INPUT} value={imagin.make} onChange={e => setImagin(s => ({ ...s, make: e.target.value }))}>
                              <option value="">Seçin...</option>
                              {IMAGIN_MAKES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Model (Family slug)</label>
                            <input
                              className={INPUT}
                              value={imagin.family}
                              onChange={e => setImagin(s => ({ ...s, family: e.target.value }))}
                              placeholder="örn: astra, golf, 3-series..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Renk</label>
                            <select className={INPUT} value={imagin.paint} onChange={e => setImagin(s => ({ ...s, paint: e.target.value }))}>
                              {IMAGIN_PAINTS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Açı</label>
                            <select className={INPUT} value={imagin.angle} onChange={e => setImagin(s => ({ ...s, angle: e.target.value }))}>
                              {IMAGIN_ANGLES.map(a => <option key={a.v} value={a.v}>{a.l}</option>)}
                            </select>
                          </div>
                        </div>

                        {imagin.make && (
                          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              key={url}
                              src={url}
                              alt="imagin.studio önizleme"
                              className="w-full h-36 object-contain"
                            />
                            <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100">
                              <p className="text-[10px] text-slate-400 font-mono flex-1 truncate">{url}</p>
                              <button
                                type="button"
                                onClick={() => setZoomUrl(url)}
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
                                title="Büyüt"
                              >
                                <ZoomIn size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, imageUrl: url }))}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition"
                              >
                                <RefreshCw size={11} />
                                Bu Resmi Kullan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t("label.category", "Kategori")} ({t("label.name", "Ad")})</label>
                <select className={INPUT} value={form.parentCategoryId} onChange={e => setForm(f => ({ ...f, parentCategoryId: e.target.value }))}>
                  <option value="">{t("ui.rootCategory", "Ana Kategori")}</option>
                  {categories.filter(c => c.id !== form.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t("label.description", "Açıklama")}</label>
                <RichTextEditor
                  value={form.description}
                  onChange={v => setForm(f => ({ ...f, description: v }))}
                  placeholder={t("ui.categoryDescPlaceholder", "Kategori açıklaması (isteğe bağlı)...")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t("ui.sortOrder", "Sıra")}</label>
                  <input type="number" className={INPUT} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
                </div>
                <div className="flex flex-col justify-end pb-1">
                  {modal === "edit" && (
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                      {t("status.active", "Aktif")}
                    </label>
                  )}
                </div>
              </div>

              {/* ── Müşteri'de Görünüm ──────────────────────────────────────── */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Müşteri&apos;de Nerede Görünsün?</p>
                <div className="border border-slate-200 rounded-xl bg-slate-50/60 divide-y divide-slate-100">
                  <label className="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-100/60 transition rounded-t-xl">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-teal-600"
                      checked={form.showInMenu}
                      onChange={e => setForm(f => ({ ...f, showInMenu: e.target.checked }))}
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-800">Anasayfa / Kategori Menüsü</span>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Ana navigasyonda ve anasayfanın kategori bölümünde görünür.</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-3 transition rounded-b-xl ${form.parentCategoryId ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-orange-50/60"}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-orange-500"
                      checked={form.showInVehicleNav}
                      disabled={!!form.parentCategoryId}
                      onChange={e => setForm(f => ({ ...f, showInVehicleNav: e.target.checked }))}
                    />
                    <div>
                      <span className="text-sm font-medium text-orange-700 flex items-center gap-1.5 flex-wrap">
                        Üst Otomotiv Menüsü
                        <span className="text-[10px] bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded font-semibold">Yedek Parça</span>
                      </span>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {form.parentCategoryId
                          ? "Yalnızca ana kategoriler (üst kategorisi olmayan) otomotiv menüsüne eklenebilir."
                          : "Bu ana kategori araç markası olarak üst menüde görünür; alt kategorileri model olarak listelenir."}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => setModal(null)} className="px-5 py-2 rounded-xl border border-slate-300 text-sm text-slate-600 hover:bg-slate-50">{t("action.cancel", "Vazgeç")}</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                  {saving ? t("action.saving", "Kaydediliyor...") : modal === "create" ? t("action.create", "Oluştur") : t("action.update", "Güncelle")}
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

      {/* Lightbox */}
      {zoomUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomUrl(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomUrl} alt="Resim önizleme" className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
            <button
              onClick={() => setZoomUrl(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
