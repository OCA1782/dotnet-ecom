"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import {
  Image as ImageIcon, Trash2, Copy, Check, ExternalLink,
  ChevronLeft, ChevronRight, ChevronFirst, ChevronLast,
  Search, X, Package, Layers, Tag, Megaphone, Eye, Users, Upload,
  ArrowUpDown,
} from "lucide-react";

interface MediaImage {
  id: string;
  url: string;
  sourceType: "product" | "category" | "brand" | "announcement" | "user";
  sourceId: string;
  sourceName: string;
  altText?: string;
  isMain: boolean;
  sortOrder: number;
  createdDate: string;
}

interface PagedResult {
  items: MediaImage[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const SOURCE_LABELS: Record<string, string> = {
  product: "Ürün",
  category: "Kategori",
  brand: "Marka",
  announcement: "Duyuru",
  user: "Kullanıcı",
};

const SOURCE_COLORS: Record<string, string> = {
  product: "bg-blue-100 text-blue-700",
  category: "bg-green-100 text-green-700",
  brand: "bg-purple-100 text-purple-700",
  announcement: "bg-orange-100 text-orange-700",
  user: "bg-teal-100 text-teal-700",
};

const SOURCE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  product: Package,
  category: Layers,
  brand: Tag,
  announcement: Megaphone,
  user: Users,
};

function SourceBadge({ type }: { type: string }) {
  const Icon = SOURCE_ICONS[type] ?? ImageIcon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${SOURCE_COLORS[type] ?? "bg-slate-100 text-slate-600"}`}>
      <Icon size={9} />
      {SOURCE_LABELS[type] ?? type}
    </span>
  );
}

const SOURCE_TABS = [
  { key: "",             label: "Tümü" },
  { key: "product",      label: "Ürün" },
  { key: "category",     label: "Kategori" },
  { key: "brand",        label: "Marka" },
  { key: "announcement", label: "Duyuru" },
  { key: "user",         label: "Kullanıcı" },
];

const PAGE_SIZES = [12, 24, 48, 96];

function getPageNumbers(current: number, total: number): (number | -1)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | -1)[] = [];
  const delta = 2;
  const left = current - delta;
  const right = current + delta;
  let prev = 0;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= left && i <= right)) {
      if (prev && i - prev > 1) pages.push(-1);
      pages.push(i);
      prev = i;
    }
  }
  return pages;
}

export default function ImajlarPage() {
  const { t } = useI18n();
  const [data, setData] = useState<PagedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sourceFilter, setSourceFilter] = useState("product");
  const [sort, setSort] = useState("newest");
  const [pageSize, setPageSize] = useState(24);
  const [isMainOnly, setIsMainOnly] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<MediaImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const pageCache = useRef(new Map<string, PagedResult>());

  const load = useCallback(async () => {
    const cacheKey = `${page}:${search}:${sourceFilter}:${sort}:${pageSize}:${isMainOnly}`;
    const cached = pageCache.current.get(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort,
        excludeNoImage: "true",
      });
      if (sourceFilter) params.set("source", sourceFilter);
      if (search) params.set("search", search);
      if (isMainOnly) params.set("isMain", "true");
      const res = await api.get<PagedResult>(`/api/admin/media/images?${params}`);
      pageCache.current.set(cacheKey, res);
      setData(res);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Görseller yüklenemedi.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, search, sourceFilter, sort, pageSize, isMainOnly]);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  function resetFilters(keepSearch = false) {
    pageCache.current.clear();
    setPage(1);
    if (!keepSearch) { setSearch(""); setSearchInput(""); }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetFilters(true);
    setSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    resetFilters();
  };

  const handleSourceChange = (src: string) => { resetFilters(true); setSourceFilter(src); };
  const handleSortChange = (s: string) => { resetFilters(true); setSort(s); };
  const handlePageSizeChange = (ps: number) => { resetFilters(true); setPageSize(ps); };
  const handleIsMainChange = (v: boolean) => { resetFilters(true); setIsMainOnly(v); };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token") ?? ""}` },
        body: form,
      });
      resetFilters(true);
      void load();
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async (img: MediaImage) => {
    await navigator.clipboard.writeText(img.url);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/media/images/${deleteTarget.sourceType}/${deleteTarget.id}`);
      if (deleteTarget.sourceType === "user") {
        window.dispatchEvent(new CustomEvent("ecom:avatar-changed", { detail: { userId: deleteTarget.sourceId, avatarUrl: deleteTarget.url } }));
      }
      setDeleteTarget(null);
      pageCache.current.clear();
      void load();
    } finally {
      setDeleting(false);
    }
  };

  const total = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const pageNumbers = getPageNumbers(page, totalPages);

  const btnBase = "w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition disabled:opacity-40";
  const btnPage = `${btnBase} border-slate-200 hover:bg-slate-50`;
  const btnPageActive = `${btnBase} bg-teal-600 text-white border-teal-600`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t("nav./imajlar", "İmaj Yönetimi")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {total > 0 ? `${total.toLocaleString("tr-TR")} görsel` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition ${uploading ? "bg-slate-100 text-slate-400" : "bg-teal-600 text-white hover:bg-teal-700"}`}>
            <Upload size={14} />
            {uploading ? "Yükleniyor..." : "Görsel Yükle"}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleUpload} />
          </label>
        </div>
      </div>

      {/* Source tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {SOURCE_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSourceChange(key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              sourceFilter === key
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search + Sort + Filters row */}
      <div className="flex flex-wrap gap-2 items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-52 relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Ürün adı veya URL ara..."
            className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {searchInput && (
            <button type="button" onClick={clearSearch} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </form>

        {/* Sort */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <ArrowUpDown size={12} className="text-slate-400" />
          <select
            value={sort}
            onChange={e => handleSortChange(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
          >
            <option value="newest">Yeniden Eskiye</option>
            <option value="oldest">Eskiden Yeniye</option>
          </select>
        </div>

        {/* isMain toggle */}
        {sourceFilter === "product" || sourceFilter === "" ? (
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isMainOnly}
              onChange={e => handleIsMainChange(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            Sadece Ana
          </label>
        ) : null}

        {/* Page size */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-slate-400 mr-0.5">Sayfa:</span>
          {PAGE_SIZES.map(ps => (
            <button
              key={ps}
              onClick={() => handlePageSizeChange(ps)}
              className={`px-2 py-1 text-xs rounded-lg border transition ${
                pageSize === ps
                  ? "bg-slate-700 text-white border-slate-700"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}
            >
              {ps}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {loadError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">Hata:</span> {loadError}
          <button onClick={() => { void load(); }} className="ml-auto text-red-500 hover:text-red-700 underline text-xs">Tekrar dene</button>
        </div>
      )}

      {/* Image Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: pageSize < 24 ? pageSize : 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 font-medium">Görsel bulunamadı</p>
          {(search || isMainOnly) && (
            <button onClick={() => { setSearch(""); setSearchInput(""); setIsMainOnly(false); pageCache.current.clear(); setPage(1); }}
              className="mt-2 text-sm text-teal-600 hover:underline">
              Filtreleri Temizle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {data?.items.map(img => (
            <div key={img.id} className="flex flex-col gap-1.5">
              <div className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.altText ?? img.sourceName}
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3Ctext x='50' y='55' text-anchor='middle' font-size='12' fill='%2394a3b8'%3E404%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100">
                  <div className="flex items-start justify-between gap-1 flex-wrap">
                    <SourceBadge type={img.sourceType} />
                    {img.isMain && (
                      <span className="text-[10px] font-semibold bg-teal-500 text-white px-1.5 py-0.5 rounded-full">Ana</span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setLightbox(img)} title="Önizle"
                      className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white rounded-lg flex items-center justify-center transition">
                      <Eye size={12} />
                    </button>
                    <button onClick={() => copyUrl(img)} title="URL Kopyala"
                      className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white rounded-lg flex items-center justify-center transition">
                      {copiedId === img.id ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <a href={img.url} target="_blank" rel="noreferrer" title="Yeni sekmede aç"
                      className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white rounded-lg flex items-center justify-center transition">
                      <ExternalLink size={12} />
                    </a>
                    <button onClick={() => setDeleteTarget(img)} title="Kaldır"
                      className="w-7 h-7 bg-red-500/70 hover:bg-red-500 text-white rounded-lg flex items-center justify-center transition">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-0.5 space-y-0.5">
                <div className="flex items-center gap-1 flex-wrap">
                  <SourceBadge type={img.sourceType} />
                  {img.isMain && <span className="text-[10px] font-semibold text-teal-600">Ana</span>}
                </div>
                <p className="text-[11px] font-medium text-slate-700 truncate" title={img.sourceName}>{img.sourceName}</p>
                <p className="text-[10px] text-slate-400">{new Date(img.createdDate).toLocaleDateString("tr-TR")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-slate-500">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total.toLocaleString("tr-TR")} görsel
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page <= 1} className={btnPage} title="İlk sayfa">
              <ChevronFirst size={13} />
            </button>
            <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className={btnPage}>
              <ChevronLeft size={14} />
            </button>
            {pageNumbers.map((p, i) =>
              p === -1 ? (
                <span key={`e${i}`} className="w-8 flex items-center justify-center text-slate-400 text-sm">…</span>
              ) : (
                <button key={p} onClick={() => setPage(p)} className={p === page ? btnPageActive : btnPage}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className={btnPage}>
              <ChevronRight size={14} />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className={btnPage} title="Son sayfa">
              <ChevronLast size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.url} alt={lightbox.altText ?? lightbox.sourceName}
              className="max-w-full max-h-[80vh] object-contain rounded-xl mx-auto block" />
            <div className="mt-3 text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <SourceBadge type={lightbox.sourceType} />
                <span className="text-white font-medium text-sm">{lightbox.sourceName}</span>
                {lightbox.isMain && (
                  <span className="text-[10px] font-semibold bg-teal-500 text-white px-1.5 py-0.5 rounded-full">Ana görsel</span>
                )}
              </div>
              <p className="text-slate-400 text-xs break-all">{lightbox.url}</p>
            </div>
            <button onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Görseli Kaldır</h2>
                <p className="text-xs text-slate-500">Bu işlem geri alınamaz.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-slate-50 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={deleteTarget.url} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1"><SourceBadge type={deleteTarget.sourceType} /></div>
                <p className="font-medium text-slate-800 text-sm truncate">{deleteTarget.sourceName}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{deleteTarget.url}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">
              Bu görseli <strong>{SOURCE_LABELS[deleteTarget.sourceType] ?? deleteTarget.sourceType}</strong> kaydından kaldırmak istediğinizden emin misiniz?
              {deleteTarget.sourceType === "product" && " Ürün görsel kaydı silinecek."}
              {deleteTarget.sourceType !== "product" && " Kayıtta görsel alanı boşaltılacak."}
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                Vazgeç
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-xl transition">
                {deleting ? "Kaldırılıyor..." : "Kaldır"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
