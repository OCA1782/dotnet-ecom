"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import type { PaginatedList } from "@/types";
import {
  Bot, Plus, Play, Square, RotateCcw, Trash2, X, Upload,
  CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronUp,
  Image as ImageIcon, AlertTriangle, FileText, Zap, Bug, Lightbulb,
  Search, Filter, Eye, EyeOff,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AiTaskImage { id: string; imageUrl: string; fileName: string; sortOrder: number; }

interface AiTask {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  resultText?: string;
  errorMessage?: string;
  runCount: number;
  startedAt?: string;
  completedAt?: string;
  createdDate: string;
  images: AiTaskImage[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TASK_TYPES = [
  { value: "Bug",      label: "Bug",       icon: Bug,        color: "text-red-600 bg-red-50 border-red-200" },
  { value: "Feature",  label: "Özellik",   icon: Lightbulb,  color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "Task",     label: "Görev",     icon: FileText,   color: "text-slate-600 bg-slate-50 border-slate-200" },
  { value: "Analysis", label: "Analiz",    icon: Search,     color: "text-purple-600 bg-purple-50 border-purple-200" },
  { value: "Refactor", label: "Refactor",  icon: Zap,        color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "Review",   label: "İnceleme",  icon: Eye,        color: "text-teal-600 bg-teal-50 border-teal-200" },
  { value: "Design",   label: "Tasarım",   icon: ImageIcon,  color: "text-pink-600 bg-pink-50 border-pink-200" },
];

const STATUS_CONFIG = {
  Pending:   { label: "Bekliyor",    icon: Clock,     cls: "bg-slate-100 text-slate-600 border-slate-200" },
  Running:   { label: "Çalışıyor",   icon: Loader2,   cls: "bg-amber-100 text-amber-700 border-amber-200" },
  Completed: { label: "Tamamlandı",  icon: CheckCircle, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  Failed:    { label: "Hata",        icon: XCircle,   cls: "bg-red-100 text-red-700 border-red-200" },
  Cancelled: { label: "İptal",       icon: XCircle,   cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const INPUT_CLS = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition";
const BTN_GHOST = "flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition";
const BTN_DANGER = "flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d?: string) {
  return d ? new Date(d).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "—";
}

function getTypeConfig(type: string) {
  return TASK_TYPES.find(t => t.value === type) ?? TASK_TYPES[2];
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.Pending;
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status);
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <Icon size={11} className={status === "Running" ? "animate-spin" : ""} />
      {cfg.label}
    </span>
  );
}

// ── Type Badge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const cfg = getTypeConfig(type);
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel }: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className={BTN_GHOST}>İptal</button>
          <button onClick={onConfirm} className={BTN_DANGER}>Onayla</button>
        </div>
      </div>
    </div>
  );
}

// ── New Task Modal ────────────────────────────────────────────────────────────

function NewTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Bug");
  const [images, setImages] = useState<{ url: string; fileName: string; sortOrder: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const res = await api.upload(file);
        setImages(prev => [...prev, { url: res.url, fileName: file.name, sortOrder: prev.length }]);
      }
    } catch {
      setError("Görsel yüklenemedi.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx).map((img, i) => ({ ...img, sortOrder: i })));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Başlık gerekli."); return; }
    setSaving(true);
    setError("");
    try {
      await api.post("/api/admin/ai-tasks", { title, description, type, images });
      onCreated();
      onClose();
    } catch {
      setError("Kayıt oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Bot size={18} className="text-teal-600" />
            Yeni AI Görevi
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Kayıt Türü</label>
            <div className="grid grid-cols-4 gap-2">
              {TASK_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-semibold transition ${type === t.value ? t.color + " ring-2 ring-offset-1 ring-teal-400" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    <Icon size={16} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Başlık *</label>
            <input className={INPUT_CLS} value={title} onChange={e => setTitle(e.target.value)} placeholder="Kısa, açıklayıcı başlık..." />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Açıklama</label>
            <textarea
              className={INPUT_CLS + " resize-none"}
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={type === "Bug" ? "Hatanın detayı, hangi adımlarda oluşuyor, beklenen davranış..." : "Görev detayları, bağlam, beklentiler..."}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Görseller</label>
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-teal-400 transition"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={20} className="mx-auto text-slate-400 mb-1" />
              <p className="text-sm text-slate-500">{uploading ? "Yükleniyor..." : "Görsel eklemek için tıkla"}</p>
              <p className="text-xs text-slate-400">PNG, JPEG, WebP — maks. 5 MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.fileName} className="w-full aspect-square object-cover rounded-xl border border-slate-200" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={onClose} className={BTN_GHOST}>İptal</button>
          <button onClick={handleSubmit} disabled={saving || uploading} className={BTN_PRIMARY}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Oluştur
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onRun, onStop, onDelete,
}: {
  task: AiTask;
  onRun: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const canRun = task.status !== "Running";
  const canStop = task.status === "Running" || task.status === "Pending";
  const isCompleted = task.status === "Completed";
  const hasResult = !!task.resultText;

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <TypeBadge type={task.type} />
            <StatusBadge status={task.status} />
            {task.runCount > 0 && (
              <span className="text-xs text-slate-400">#{task.runCount} çalıştırma</span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{formatDate(task.createdDate)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.images.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <ImageIcon size={12} /> {task.images.length}
            </span>
          )}
          {canRun && (
            <button
              onClick={e => { e.stopPropagation(); onRun(task.id); }}
              title={isCompleted ? "Tekrar Çalıştır" : "Çalıştır"}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition"
            >
              {isCompleted ? <RotateCcw size={13} /> : <Play size={13} />}
              {isCompleted ? "Tekrar" : "Çalıştır"}
            </button>
          )}
          {canStop && (
            <button
              onClick={e => { e.stopPropagation(); onStop(task.id); }}
              title="Durdur"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition"
            >
              <Square size={13} />
              Durdur
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1.5 text-slate-400 hover:text-red-500 transition"
            title="Sil"
          >
            <Trash2 size={15} />
          </button>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-3">
          {task.description && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Açıklama</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {task.images.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Görseller</p>
              <div className="flex gap-2 flex-wrap">
                {task.images.map(img => (
                  <a key={img.id} href={img.imageUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt={img.fileName} className="w-16 h-16 object-cover rounded-xl border border-slate-200 hover:border-teal-400 transition" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {task.errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-600 mb-1">Hata Mesajı</p>
              <p className="text-xs text-red-700 font-mono whitespace-pre-wrap">{task.errorMessage}</p>
            </div>
          )}

          {hasResult && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">AI Yanıtı</p>
                <button
                  onClick={() => setShowResult(p => !p)}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                >
                  {showResult ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showResult ? "Gizle" : "Göster"}
                </button>
              </div>
              {showResult && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 max-h-96 overflow-y-auto">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono text-xs leading-relaxed">{task.resultText}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-500">
            <div><span className="font-semibold text-slate-400">Oluşturuldu:</span><br />{formatDate(task.createdDate)}</div>
            <div><span className="font-semibold text-slate-400">Başladı:</span><br />{formatDate(task.startedAt)}</div>
            <div><span className="font-semibold text-slate-400">Tamamlandı:</span><br />{formatDate(task.completedAt)}</div>
            <div><span className="font-semibold text-slate-400">Çalıştırma:</span><br />{task.runCount}x</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AiGorevlerPage() {
  const [tasks, setTasks] = useState<AiTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<{ msg: string; fn: () => void } | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const PAGE_SIZE = 20;

  const loadRef = useRef<((silent?: boolean) => Promise<void>) | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("type", filterType);
      if (search) params.set("search", search);
      const data: PaginatedList<AiTask> = await api.get(`/api/admin/ai-tasks?${params}`);
      setTasks(data.items as AiTask[]);
      setTotal(data.totalCount);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, filterStatus, filterType, search]);

  useEffect(() => { loadRef.current = load; }, [load]);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  // Poll while any task is running
  useEffect(() => {
    const hasRunning = tasks.some(t => t.status === "Running");
    if (hasRunning) {
      pollRef.current = setInterval(() => loadRef.current?.(true), 3000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [tasks]);

  const handleRun = async (id: string) => {
    await api.post(`/api/admin/ai-tasks/${id}/run`, {});
    await load(true);
  };

  const handleStop = (id: string) => {
    setConfirm({
      msg: "Bu görevi durdurmak istiyor musunuz?",
      fn: async () => {
        setConfirm(null);
        await api.post(`/api/admin/ai-tasks/${id}/cancel`, {});
        await load(true);
      },
    });
  };

  const handleDelete = (id: string) => {
    setConfirm({
      msg: "Bu görevi silmek istiyor musunuz? Bu işlem geri alınamaz.",
      fn: async () => {
        setConfirm(null);
        await api.delete(`/api/admin/ai-tasks/${id}`);
        await load(true);
      },
    });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bot size={22} className="text-teal-600" />
            <h1 className="text-xl font-bold text-slate-800">AI Görevler</h1>
          </div>
          <p className="text-sm text-slate-500">Görseller ve açıklama ile Claude AI&apos;ya görev ver</p>
        </div>
        <button onClick={() => setShowNew(true)} className={BTN_PRIMARY}>
          <Plus size={16} />
          Yeni Görev
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={INPUT_CLS + " pl-8"}
            placeholder="Başlık veya açıklama ara..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1); }}
          >
            <option value="">Tür: Tümü</option>
            {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">Durum: Tümü</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <span className="text-xs text-slate-400 ml-auto">{total} kayıt</span>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-teal-500" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20">
          <Bot size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 text-sm">Henüz görev yok. &quot;Yeni Görev&quot; ile başlayın.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onRun={handleRun}
              onStop={handleStop}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={BTN_GHOST + " disabled:opacity-40"}>Önceki</button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className={BTN_GHOST + " disabled:opacity-40"}>Sonraki</button>
        </div>
      )}

      {/* Modals */}
      {showNew && <NewTaskModal onClose={() => setShowNew(false)} onCreated={() => load()} />}
      {confirm && <ConfirmModal message={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
