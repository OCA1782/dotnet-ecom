"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import {
  Image as ImageIcon, Trash2, Copy, Check, ExternalLink,
  ChevronLeft, ChevronRight, Search, X, Filter, Package,
  Layers, Tag, Megaphone, Eye, Users,
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

export default function ImajlarPage() {
  const { t } = useI18n();
  const [data, setData] = useState<PagedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MediaImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<MediaImage | null>(null);
  const PAGE_SIZE = 24;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (source) params.set("source", source);
      if (search) params.set("search", search);
      const res = await api.get<PagedResult>(`/api/admin/media/images?${params}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [page, source, search]);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
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
      load();
    } finally {
      setDeleting(false);
    }
  };

  const total = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t("nav./imajlar", "İmaj Yönetimi")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("ui.imajlarSubtitle", "Ürün, kategori, marka ve duyurulardaki tüm görseller")}
          </p>
        </div>
        <div className="text-sm text-slate-500">
          {total} {t("ui.image", "görsel")}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-60 relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t("ui.imageSearchPlaceholder", "Kaynak adı veya URL ara...")}
            className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {searchInput && (
            <button type="button" onClick={clearSearch}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={source}
            onChange={e => { setSource(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">{t("filter.allSources", "Tüm Kaynaklar")}</option>
            <option value="product">{t("ui.products", "Ürünler")}</option>
            <option value="category">{t("ui.categories", "Kategoriler")}</option>
            <option value="brand">{t("ui.brands", "Markalar")}</option>
            <option value="announcement">{t("ui.announcements", "Duyurular")}</option>
            <option value="user">{t("ui.users", "Kullanıcılar")}</option>
          </select>
        </div>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 font-medium">{t("ui.imageNotFound", "Görsel bulunamadı")}</p>
          {(search || source) && (
            <button onClick={() => { clearSearch(); setSource(""); }} className="mt-2 text-sm text-teal-600 hover:underline">
              {t("filter.clearFilters", "Filtreleri Temizle")}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {data?.items.map(img => (
            <div key={img.id} className="flex flex-col gap-1.5">
              {/* Image card */}
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
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100">
                  <div className="flex items-start justify-between gap-1 flex-wrap">
                    <SourceBadge type={img.sourceType} />
                    {img.isMain && (
                      <span className="text-[10px] font-semibold bg-teal-500 text-white px-1.5 py-0.5 rounded-full">{t("ui.mainImage", "Ana")}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setLightbox(img)} title={t("action.preview", "Önizle")}
                      className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white rounded-lg flex items-center justify-center transition">
                      <Eye size={12} />
                    </button>
                    <button onClick={() => copyUrl(img)} title={t("ui.copyUrl", "URL Kopyala")}
                      className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white rounded-lg flex items-center justify-center transition">
                      {copiedId === img.id ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <a href={img.url} target="_blank" rel="noreferrer" title={t("ui.openNewTab", "Yeni sekmede aç")}
                      className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white rounded-lg flex items-center justify-center transition">
                      <ExternalLink size={12} />
                    </a>
                    <button onClick={() => setDeleteTarget(img)} title={t("ui.removeImage", "Kaldır")}
                      className="w-7 h-7 bg-red-500/70 hover:bg-red-500 text-white rounded-lg flex items-center justify-center transition">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Description below image */}
              <div className="px-0.5 space-y-0.5">
                <div className="flex items-center gap-1 flex-wrap">
                  <SourceBadge type={img.sourceType} />
                  {img.isMain && (
                    <span className="text-[10px] font-semibold text-teal-600">{t("ui.mainImage", "Ana")}</span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-700 truncate" title={img.sourceName}>
                  {img.sourceName}
                </p>
                <p className="text-[10px] text-slate-400">
                  {new Date(img.createdDate).toLocaleDateString("tr-TR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total} {t("ui.image", "görsel")}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-medium text-slate-700">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={lightbox.altText ?? lightbox.sourceName}
              className="max-w-full max-h-[80vh] object-contain rounded-xl mx-auto block"
            />
            <div className="mt-3 text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <SourceBadge type={lightbox.sourceType} />
                <span className="text-white font-medium text-sm">{lightbox.sourceName}</span>
                {lightbox.isMain && (
                  <span className="text-[10px] font-semibold bg-teal-500 text-white px-1.5 py-0.5 rounded-full">{t("ui.mainImageFull", "Ana görsel")}</span>
                )}
              </div>
              <p className="text-slate-400 text-xs break-all">{lightbox.url}</p>
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition"
            >
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
                <h2 className="font-bold text-slate-800">{t("ui.removeImageTitle", "Görseli Kaldır")}</h2>
                <p className="text-xs text-slate-500">{t("msg.irreversible", "Bu işlem geri alınamaz.")}</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-slate-50 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={deleteTarget.url}
                alt=""
                className="w-16 h-16 object-cover rounded-lg shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <SourceBadge type={deleteTarget.sourceType} />
                </div>
                <p className="font-medium text-slate-800 text-sm truncate">{deleteTarget.sourceName}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{deleteTarget.url}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">
              {t("ui.removeImageConfirmPrefix", "Bu görseli")} <strong>{SOURCE_LABELS[deleteTarget.sourceType] ?? deleteTarget.sourceType}</strong> {t("ui.removeImageConfirmSuffix", "kaydından kaldırmak istediğinizden emin misiniz?")}
              {deleteTarget.sourceType === "product" && ` ${t("ui.productImageWillDelete", "Ürün görsel kaydı silinecek.")}`}
              {deleteTarget.sourceType !== "product" && ` ${t("ui.imageFieldWillClear", "Kayıtta görsel alanı boşaltılacak.")}`}
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                {t("action.cancel", "Vazgeç")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-xl transition"
              >
                {deleting ? t("ui.removing", "Kaldırılıyor...") : t("ui.remove", "Kaldır")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
