"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import {
  FolderOpen, Trash2, Copy, Check, ExternalLink,
  ChevronLeft, ChevronRight, Search, X, Filter,
  FileText, Image as ImageIcon, Video, File,
  User, Calendar, Tag,
} from "lucide-react";

interface UploadedFile {
  id: string;
  fileName: string;
  url: string;
  contentType: string;
  fileSize: number;
  uploadedByEmail?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  notes?: string;
  isOrphaned: boolean;
  createdDate: string;
  updatedDate?: string;
}

interface PagedResult {
  items: UploadedFile[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith("image/")) return <ImageIcon size={20} className="text-blue-500" />;
  if (contentType.startsWith("video/")) return <Video size={20} className="text-purple-500" />;
  if (contentType === "application/pdf") return <FileText size={20} className="text-red-500" />;
  if (contentType.includes("word") || contentType.includes("document")) return <FileText size={20} className="text-blue-600" />;
  if (contentType.includes("excel") || contentType.includes("spreadsheet")) return <FileText size={20} className="text-green-600" />;
  return <File size={20} className="text-slate-400" />;
}

function TypeLabel({ contentType }: { contentType: string }) {
  if (contentType.startsWith("image/")) return <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Görsel</span>;
  if (contentType.startsWith("video/")) return <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Video</span>;
  if (contentType === "application/pdf") return <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">PDF</span>;
  if (contentType.includes("word") || contentType.includes("document")) return <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">Word</span>;
  if (contentType.includes("excel") || contentType.includes("spreadsheet")) return <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Excel</span>;
  if (contentType.startsWith("text/")) return <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full">Metin</span>;
  return <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">Dosya</span>;
}

export default function BelgelerPage() {
  const [data, setData] = useState<PagedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UploadedFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("search", search);
      const res = await api.get<PagedResult>(`/api/admin/media/files?${params}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, search]);

  useEffect(() => { load(); }, [load]);

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

  const copyUrl = async (file: UploadedFile) => {
    await navigator.clipboard.writeText(file.url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/media/files/${deleteTarget.id}`);
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
          <h1 className="text-xl font-bold text-slate-800">Dosya Yönetimi</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload edilen tüm dosyalar — görseller, videolar, dokümanlar
          </p>
        </div>
        <div className="text-sm text-slate-500">{total} dosya</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-60 relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Dosya adı, bağlı kaynak veya yükleyen ara..."
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
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Tüm Tipler</option>
            <option value="image">Görseller</option>
            <option value="video">Videolar</option>
            <option value="document">Dokümanlar</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 font-medium">Dosya bulunamadı</p>
          {(search || typeFilter) && (
            <button onClick={() => { clearSearch(); setTypeFilter(""); }} className="mt-2 text-sm text-teal-600 hover:underline">
              Filtreleri temizle
            </button>
          )}
          {!search && !typeFilter && (
            <p className="text-slate-400 text-sm mt-1">
              Upload edilen dosyalar burada görünecek
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dosya</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tip</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Boyut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bağlı Kaynak</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Yükleyen</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarih</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.items.map(file => (
                <tr key={file.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail for images */}
                      {file.contentType.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={file.url}
                          alt=""
                          className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-200"
                          onError={e => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <FileTypeIcon contentType={file.contentType} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate max-w-[180px]">{file.fileName}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{file.url.split("/").pop()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TypeLabel contentType={file.contentType} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatBytes(file.fileSize)}</td>
                  <td className="px-4 py-3">
                    {file.entityName ? (
                      <div>
                        <p className="text-slate-700 text-xs font-medium">{file.entityName}</p>
                        {file.entityType && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                            <Tag size={9} />
                            {file.entityType}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {file.uploadedByEmail ? (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <User size={11} />
                        <span className="truncate max-w-[120px]">{file.uploadedByEmail}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar size={11} />
                      {new Date(file.createdDate).toLocaleDateString("tr-TR")}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => copyUrl(file)}
                        title="URL Kopyala"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        {copiedId === file.id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Dosyayı aç"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        <ExternalLink size={13} />
                      </a>
                      <button
                        onClick={() => setDeleteTarget(file)}
                        title="Sil"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total} dosya
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Dosyayı Sil</h2>
                <p className="text-xs text-slate-500">Bu işlem geri alınamaz</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                <FileTypeIcon contentType={deleteTarget.contentType} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-800 text-sm">{deleteTarget.fileName}</p>
                <p className="text-xs text-slate-400">{formatBytes(deleteTarget.fileSize)}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">
              Bu dosya kaydını silmek istediğinizden emin misiniz? Fiziksel dosya sunucudan silinmez.
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Vazgeç
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-xl transition"
              >
                {deleting ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
