"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import {
  Plus, Pencil, Trash2, Search, X, Upload, Link2,
  Image, Video, FileText, Megaphone,
  Calendar, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { PreviewPanel, PreviewToggleButton } from "@/components/previews/PreviewPanel";
import AnnouncementPreview from "@/components/previews/AnnouncementPreview";

interface Announcement {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string;
  category: string;
  linkUrl: string | null;
  linkText: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  displayOrder: number;
  createdDate: string;
  updatedDate: string | null;
  dataSource?: string;
  createdByAdminEmail?: string;
}

interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const CATEGORIES = [
  { value: "duyuru",         label: "Duyuru",         color: "bg-blue-100 text-blue-700" },
  { value: "kampanya",       label: "Kampanya",        color: "bg-orange-100 text-orange-700" },
  { value: "bilgilendirme",  label: "Bilgilendirme",   color: "bg-teal-100 text-teal-700" },
  { value: "etkinlik",       label: "Etkinlik",        color: "bg-purple-100 text-purple-700" },
];

const MEDIA_TYPES = [
  { value: "none",  label: "Yok",    icon: FileText },
  { value: "image", label: "Görsel", icon: Image },
  { value: "gif",   label: "GIF",    icon: Image },
  { value: "video", label: "Video",  icon: Video },
];

interface FormState {
  title: string;
  summary: string;
  content: string;
  mediaUrl: string;
  mediaType: string;
  category: string;
  linkUrl: string;
  linkText: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  displayOrder: number;
}

const empty: FormState = {
  title: "", summary: "", content: "", mediaUrl: "",
  mediaType: "none", category: "duyuru", linkUrl: "", linkText: "",
  isActive: true, startsAt: "", endsAt: "", displayOrder: 0,
};

const inp = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 bg-white";
const label = "block text-xs font-semibold text-slate-600 mb-1";

type SortField = "createdDate" | "dataSource";
function buildSortKey(field: SortField, dir: "asc" | "desc") { return `${field}-${dir}`; }

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: "asc" | "desc" }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-30 ml-1 inline-block" />;
  return sortDir === "asc" ? <ChevronUp size={12} className="text-teal-600 ml-1 inline-block" /> : <ChevronDown size={12} className="text-teal-600 ml-1 inline-block" />;
}

function catInfo(cat: string) {
  return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[0];
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function MediaPreview({ url, type }: { url: string; type: string }) {
  if (!url) return null;
  if (type === "video") {
    return (
      <video src={url} className="w-full h-32 object-cover rounded-lg" controls muted />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="önizleme" className="w-full h-32 object-cover rounded-lg" />
  );
}

export default function DuyurularPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) qs.set("search", search);
      if (catFilter) qs.set("category", catFilter);
      if (activeFilter !== "") qs.set("isActive", activeFilter);
      if (sortField) qs.set("sortBy", buildSortKey(sortField, sortDir));
      const data = await api.get<PaginatedList<Announcement>>(`/api/admin/announcements?${qs}`);
      setItems(data.items);
      setTotal(data.totalCount);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, catFilter, activeFilter, sortField, sortDir]);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  function openCreate() {
    setEditId(null);
    setForm(empty);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(item: Announcement) {
    setEditId(item.id);
    setForm({
      title: item.title,
      summary: item.summary ?? "",
      content: item.content ?? "",
      mediaUrl: item.mediaUrl ?? "",
      mediaType: item.mediaType,
      category: item.category,
      linkUrl: item.linkUrl ?? "",
      linkText: item.linkText ?? "",
      isActive: item.isActive,
      startsAt: item.startsAt ? item.startsAt.slice(0, 16) : "",
      endsAt: item.endsAt ? item.endsAt.slice(0, 16) : "",
      displayOrder: item.displayOrder,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function save() {
    if (!form.title.trim()) { setFormError(t("label.title", "Başlık") + " zorunludur."); return; }
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        title: form.title.trim(),
        summary: form.summary || null,
        content: form.content || null,
        mediaUrl: form.mediaUrl || null,
        mediaType: form.mediaType,
        category: form.category,
        linkUrl: form.linkUrl || null,
        linkText: form.linkText || null,
        isActive: form.isActive,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        displayOrder: form.displayOrder,
      };
      if (editId) {
        await api.put(`/api/admin/announcements/${editId}`, body);
      } else {
        await api.post(`/api/admin/announcements`, body);
      }
      setShowForm(false);
      await load();
    } catch (e) {
      setFormError((e as Error).message || t("msg.error", "Bir hata oluştu"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/admin/announcements/${id}`);
      setConfirmDelete(null);
      await load();
    } catch { /* silent */ }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const res = await api.upload(file);
      const type = file.type.startsWith("video/") ? "video" : file.type === "image/gif" ? "gif" : "image";
      setForm(f => ({ ...f, mediaUrl: res.url, mediaType: type }));
    } catch (e) {
      setFormError((e as Error).message || t("msg.error", "Bir hata oluştu"));
    } finally {
      setUploading(false);
    }
  }

  const totalPages = Math.ceil(total / pageSize);
  const activeCount = items.filter(i => i.isActive).length;

  return (
    <div className="space-y-5">

      {/* Başlık */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 flex items-center justify-center">
            <Megaphone size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t("page./duyurular", "Duyurular & Bültenler")}</h1>
            <p className="text-xs text-slate-500">{total} {t("table.perPage", "kayıt")} · {activeCount} {t("status.active", "Aktif").toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} /> {t("ui.newAnnouncement", "Yeni Duyuru")}
        </button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            placeholder={t("filter.search", "Ara...")}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-400"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
          className="text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-teal-400 bg-white">
          <option value="">{t("filter.allTypes", "Tüm Türler")}</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
          className="text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-teal-400 bg-white">
          <option value="">{t("filter.allStatus", "Tüm Durumlar")}</option>
          <option value="true">{t("status.active", "Aktif")}</option>
          <option value="false">{t("status.passive", "Pasif")}</option>
        </select>
        <button onClick={() => handleSort("createdDate")} className="flex items-center gap-1 text-xs border border-slate-200 rounded-xl px-3 py-2 hover:border-teal-400 hover:text-teal-600 transition select-none bg-white">
          {t("col.createdAt", "Oluşturma")} Tarihi <SortIcon field="createdDate" sortField={sortField} sortDir={sortDir} />
        </button>
        <button onClick={() => handleSort("dataSource")} className="flex items-center gap-1 text-xs border border-slate-200 rounded-xl px-3 py-2 hover:border-teal-400 hover:text-teal-600 transition select-none bg-white">
          Kaynak <SortIcon field="dataSource" sortField={sortField} sortDir={sortDir} />
        </button>
      </div>

      {/* İçerik */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white animate-pulse h-56" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Megaphone size={40} className="mb-3 opacity-30" />
          <p className="text-sm">{t("table.noData", "Kayıt bulunamadı")}</p>
          <button onClick={openCreate} className="mt-4 text-sm text-teal-600 font-semibold hover:underline">
            {t("ui.newAnnouncement", "Yeni Duyuru")} →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => {
            const cat = catInfo(item.category);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                {/* Medya */}
                {item.mediaUrl && (
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    {item.mediaType === "video" ? (
                      <video src={item.mediaUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                      {item.mediaType === "video" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800/70 text-white">▶ Video</span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      {item.isActive
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">{t("status.active", "Aktif")}</span>
                        : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-400 text-white">{t("status.passive", "Pasif")}</span>
                      }
                    </div>
                  </div>
                )}

                <div className="p-4">
                  {!item.mediaUrl && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                      {item.isActive
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{t("status.active", "Aktif")}</span>
                        : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{t("status.passive", "Pasif")}</span>
                      }
                    </div>
                  )}

                  <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-1">{item.title}</h3>
                  {item.summary && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.summary}</p>
                  )}

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-3">
                    <Calendar size={10} />
                    {item.startsAt || item.endsAt
                      ? <span>{formatDate(item.startsAt)} — {formatDate(item.endsAt)}</span>
                      : <span>Tarih sınırı yok</span>
                    }
                  </div>

                  {item.linkUrl && (
                    <div className="flex items-center gap-1 text-[10px] text-teal-600 mb-3 truncate">
                      <Link2 size={10} />
                      <span className="truncate">{item.linkText || item.linkUrl}</span>
                    </div>
                  )}

                  {/* Oluşturulma Tarihi + Kaynak + Oluşturan */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.createdDate).toLocaleDateString("tr-TR")}
                    </span>
                    {item.dataSource && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">{item.dataSource}</span>
                    )}
                    {item.createdByAdminEmail && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={item.createdByAdminEmail}>{item.createdByAdminEmail}</span>
                    )}
                  </div>

                  {/* Aksiyonlar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openEdit(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50 py-1.5 rounded-lg transition"
                    >
                      <Pencil size={12} /> {t("action.edit", "Düzenle")}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 hover:text-red-500 hover:bg-red-50 py-1.5 rounded-lg transition"
                    >
                      <Trash2 size={12} /> {t("action.delete", "Sil")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{total} {t("table.perPage", "kayıt")}tan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} gösteriliyor</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-teal-400 disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 rounded-lg border border-teal-400 bg-teal-50 text-teal-700 font-medium text-xs">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-teal-400 disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Silme onay modalı */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
            <h3 className="font-bold text-slate-800 mb-2">{t("ui.deleteAnnouncement", "Duyuruyu Sil")}</h3>
            <p className="text-sm text-slate-500 mb-5">{t("msg.irreversible", "Bu işlem geri alınamaz.")}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">{t("action.cancel", "İptal")}</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold">{t("action.delete", "Sil")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Duyuru Formu Modalı */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[92vh] transition-all duration-200 ${showPreview ? "max-w-5xl" : "max-w-3xl"}`}>

            {/* Modal başlık */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <h2 className="font-bold text-slate-800">{editId ? t("ui.editAnnouncement", "Duyuruyu Düzenle") : t("ui.newAnnouncement", "Yeni Duyuru")}</h2>
              <div className="flex items-center gap-2">
                <PreviewToggleButton open={showPreview} onToggle={() => setShowPreview(p => !p)} />
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-w-0">

              {/* Başlık + Kategori */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={label}>{t("label.title", "Başlık")} *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Duyuru başlığı" className={inp} />
                </div>
                <div>
                  <label className={label}>{t("label.type", "Tür")}</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Özet */}
              <div>
                <label className={label}>Kısa Özet</label>
                <input value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                  placeholder="Kart görünümünde gösterilecek kısa metin" className={inp} />
              </div>

              {/* İçerik */}
              <div>
                <label className={label}>{t("label.description", "Açıklama")} (tam metin)</label>
                <RichTextEditor
                  value={form.content}
                  onChange={v => setForm(f => ({ ...f, content: v }))}
                  placeholder="Duyurunun tam içeriği…"
                  minHeight={180}
                />
              </div>

              {/* Medya yükleme */}
              <div>
                <label className={label}>Medya (görsel / GIF / video)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-teal-300 transition"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleUpload(file);
                  }}>
                  {form.mediaUrl ? (
                    <div className="space-y-2">
                      <MediaPreview url={form.mediaUrl} type={form.mediaType} />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 truncate flex-1">{form.mediaUrl}</span>
                        <button onClick={() => setForm(f => ({ ...f, mediaUrl: "", mediaType: "none" }))}
                          className="text-xs text-red-400 hover:text-red-600">Kaldır</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <Upload size={24} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-xs text-slate-400 mb-3">
                        Sürükle bırak veya seç<br />
                        <span className="text-slate-300">JPG, PNG, GIF, WebP, MP4, WebM</span>
                      </p>
                      <button onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="text-xs font-medium text-teal-600 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition">
                        {uploading ? t("action.loading", "Yükleniyor...") : "Dosya Seç"}
                      </button>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm"
                  className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />

                {/* Veya URL gir */}
                <div className="mt-2">
                  <input value={form.mediaUrl} onChange={e => setForm(f => ({ ...f, mediaUrl: e.target.value }))}
                    placeholder="veya medya URL'si yapıştır…" className={inp + " text-xs"} />
                </div>
              </div>

              {/* Medya türü */}
              <div>
                <label className={label}>{t("label.type", "Tür")}</label>
                <div className="flex gap-2 flex-wrap">
                  {MEDIA_TYPES.map(mt => {
                    const Icon = mt.icon;
                    return (
                      <button key={mt.value}
                        onClick={() => setForm(f => ({ ...f, mediaType: mt.value }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                          form.mediaType === mt.value
                            ? "border-teal-400 bg-teal-50 text-teal-700"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}>
                        <Icon size={12} /> {mt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>CTA Bağlantı URL</label>
                  <div className="relative">
                    <Link2 size={13} className="absolute left-3 top-2.5 text-slate-400" />
                    <input value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                      placeholder="https://…" className={inp + " pl-8"} />
                  </div>
                </div>
                <div>
                  <label className={label}>CTA Buton Metni</label>
                  <input value={form.linkText} onChange={e => setForm(f => ({ ...f, linkText: e.target.value }))}
                    placeholder="İncele, Detaylar…" className={inp} />
                </div>
              </div>

              {/* Tarih aralığı */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>{t("label.startDate", "Başlangıç Tarihi")}</label>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-2.5 text-slate-400" />
                    <input type="datetime-local" value={form.startsAt}
                      onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                      className={inp + " pl-8"} />
                  </div>
                </div>
                <div>
                  <label className={label}>{t("label.endDate", "Bitiş Tarihi")}</label>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-2.5 text-slate-400" />
                    <input type="datetime-local" value={form.endsAt}
                      onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
                      className={inp + " pl-8"} />
                  </div>
                </div>
              </div>

              {/* Sıralama + Durum */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className={label}>Sıralama</label>
                  <input type="number" min={0} value={form.displayOrder}
                    onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))}
                    className={inp} />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className="flex items-center gap-2">
                    {form.isActive
                      ? <><ToggleRight size={28} className="text-teal-500" /><span className="text-sm font-semibold text-teal-600">{t("status.active", "Aktif")}</span></>
                      : <><ToggleLeft size={28} className="text-slate-400" /><span className="text-sm text-slate-500">{t("status.passive", "Pasif")}</span></>
                    }
                  </button>
                </div>
              </div>

              {formError && (
                <div className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{formError}</div>
              )}

              {/* Butonlar */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                  {t("action.cancel", "İptal")}
                </button>
                <button onClick={save} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition disabled:opacity-60">
                  {saving ? t("action.saving", "Kaydediliyor...") : editId ? t("action.update", "Güncelle") : t("action.publish", "Yayınla")}
                </button>
              </div>
            </div>

            {/* Preview panel */}
            <PreviewPanel open={showPreview}>
              <AnnouncementPreview form={form} />
            </PreviewPanel>

            </div>{/* /flex */}
          </div>
        </div>
      )}
    </div>
  );
}
