"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import {
  Clock, Play, Pause, RefreshCw, Terminal, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, AlertTriangle, Loader2, History, X,
  Timer, RotateCcw, Activity, Zap, Pencil, Check,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface JobState {
  name: string;
  description: string;
  type: string;
  isPaused: boolean;
  isRunning: boolean;
  manualTriggerRequested: boolean;
  lastRunAt: string | null;
  lastRunResult: string | null;
  lastRunSuccess: boolean | null;
  runCount: number;
  startedAt: string;
}

interface Job {
  name: string;
  description: string;
  intervalMinutes: number;
  defaultIntervalMinutes: number;
  state: JobState | null;
}

interface JobLog {
  id: string;
  jobName: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  durationMs: number | null;
  errorMessage: string | null;
  isManualTrigger: boolean;
  output?: string;
}

interface JobLogsResult {
  total: number;
  page: number;
  logs: JobLog[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

function intervalLabel(minutes: number) {
  if (minutes < 60) return `${minutes} dk`;
  if (minutes === 60) return "1 sa";
  if (minutes < 1440) return `${minutes / 60} sa`;
  if (minutes === 1440) return "Günlük";
  return `${Math.round(minutes / 1440)} gün`;
}

function timeAgo(dt: string | null) {
  if (!dt) return "—";
  const diff = Date.now() - new Date(dt).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s önce`;
  if (s < 3600) return `${Math.floor(s / 60)}dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa önce`;
  return `${Math.floor(s / 86400)}g önce`;
}

function fmtDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "success") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={11} /> Başarılı
    </span>
  );
  if (status === "failed") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      <XCircle size={11} /> Başarısız
    </span>
  );
  if (status === "running") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      <Loader2 size={11} className="animate-spin" /> Çalışıyor
    </span>
  );
  return <span className="text-xs text-slate-400">{status}</span>;
}

// ── SSE Terminal Modal ────────────────────────────────────────────────────────

function TerminalModal({ jobName, onClose }: { jobName: string; onClose: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [finalStatus, setFinalStatus] = useState<"success" | "failed" | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const abortCtrl = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `${API}/api/admin/jobs/${encodeURIComponent(jobName)}/stream`,
          { headers: { Authorization: `Bearer ${token ?? ""}` }, signal: abortCtrl.signal }
        );
        if (!res.body) {
          setLines(["⚠ Stream başlatılamadı."]);
          setDone(true);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.startsWith("data: ") ? part.slice(6) : part;
            if (!line.trim()) continue;
            if (line === "__NOTRUNNING__") {
              setLines(["⚠ Job şu anda çalışmıyor. 'Çalıştır' butonuna tıklayın."]);
              setDone(true);
              return;
            }
            if (line.startsWith("__DONE__")) {
              const st = line.slice(8) as "success" | "failed";
              setFinalStatus(st);
              setDone(true);
              return;
            }
            setLines(prev => [...prev, line.replace(/\\n/g, "\n")]);
          }
        }
      } catch (err) {
        if (!abortCtrl.signal.aborted) {
          setLines(prev => [...prev, "⚠ Bağlantı kesildi."]);
          setDone(true);
        }
      }
    })();

    return () => abortCtrl.abort();
  }, [jobName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-[#0d1117] rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col"
        style={{ maxHeight: "80vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#161b22]">
          <div className="flex items-center gap-2.5">
            <Terminal size={16} className="text-teal-400" />
            <span className="text-sm font-semibold text-white">{jobName}</span>
            {!done && <Loader2 size={13} className="animate-spin text-slate-500 ml-1" />}
            {done && finalStatus === "success" && <CheckCircle2 size={14} className="text-emerald-400 ml-1" />}
            {done && finalStatus === "failed" && <XCircle size={14} className="text-red-400 ml-1" />}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        {/* Terminal output */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 leading-relaxed">
          {lines.length === 0 && !done && (
            <span className="text-slate-600">Bağlanılıyor...</span>
          )}
          {lines.map((line, i) => (
            <div key={i} className={`whitespace-pre-wrap ${
              line.includes("❌") || line.includes("HATA") ? "text-red-400" :
              line.includes("✓") || line.includes("✅") ? "text-emerald-400" :
              line.includes("⚠") ? "text-amber-400" :
              line.startsWith("[") ? "text-slate-500" :
              "text-slate-300"
            }`}>
              {line}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {done && (
          <div className={`px-5 py-3 border-t border-white/10 text-xs font-medium flex items-center gap-2 ${
            finalStatus === "success" ? "bg-emerald-950/50 text-emerald-400" :
            finalStatus === "failed" ? "bg-red-950/50 text-red-400" :
            "bg-slate-900 text-slate-400"
          }`}>
            {finalStatus === "success" ? <CheckCircle2 size={13} /> : finalStatus === "failed" ? <XCircle size={13} /> : <AlertTriangle size={13} />}
            {finalStatus === "success" ? "Job başarıyla tamamlandı" :
             finalStatus === "failed" ? "Job başarısız oldu" :
             "Job durdu"}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Job History Modal ─────────────────────────────────────────────────────────

function HistoryModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const [data, setData] = useState<JobLogsResult | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<JobLog | null>(null);
  const [logOutput, setLogOutput] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = await api.get<JobLogsResult>(`/api/admin/jobs/${encodeURIComponent(job.name)}/logs?page=${p}`);
      setData(result);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [job.name]);

  useEffect(() => { load(1); }, [load]);

  async function openLog(log: JobLog) {
    setSelectedLog(log);
    if (!log.output) {
      const full = await api.get<JobLog>(`/api/admin/jobs/${encodeURIComponent(job.name)}/logs/${log.id}`);
      setLogOutput(full.output ?? null);
    } else {
      setLogOutput(log.output);
    }
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <History size={17} className="text-teal-500" />
              {job.name} — Çalışma Geçmişi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{job.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition p-1.5 rounded-lg hover:bg-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Log detail panel */}
        {selectedLog && (
          <div className="bg-[#0d1117] border-b border-white/10 px-5 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <StatusBadge status={selectedLog.status} />
                <span>{fmtDate(selectedLog.startedAt)}</span>
                <span>·</span>
                <span>{fmtDuration(selectedLog.durationMs)}</span>
                {selectedLog.isManualTrigger && <span className="px-1.5 py-0.5 bg-violet-900/40 text-violet-300 rounded text-[10px]">Manuel</span>}
              </div>
              <button onClick={() => { setSelectedLog(null); setLogOutput(null); }}
                className="text-slate-600 hover:text-white transition text-xs">
                <X size={14} />
              </button>
            </div>
            <div className="font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {logOutput ?? <span className="text-slate-600">Yükleniyor...</span>}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : !data || data.logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
              <History size={32} className="opacity-30" />
              <p className="text-sm">Henüz çalışma kaydı yok</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Başlangıç</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Süre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tür</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.logs.map(log => (
                  <tr key={log.id}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedLog?.id === log.id ? "bg-teal-50" : ""}`}
                    onClick={() => openLog(log)}
                  >
                    <td className="px-6 py-3 text-slate-700 font-mono text-xs">{fmtDate(log.startedAt)}</td>
                    <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{fmtDuration(log.durationMs)}</td>
                    <td className="px-4 py-3">
                      {log.isManualTrigger
                        ? <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-medium">Manuel</span>
                        : <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">Otomatik</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.errorMessage && (
                        <span className="text-xs text-red-500 max-w-[200px] truncate block text-right">{log.errorMessage}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-500">{data?.total ?? 0} kayıt</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Önceki
              </button>
              <span className="text-xs text-slate-600 font-medium">{page} / {totalPages}</span>
              <button
                onClick={() => load(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, onTrigger, onToggle, onOpenTerminal, onOpenHistory, onUpdateInterval }: {
  job: Job;
  onTrigger: () => void;
  onToggle: () => void;
  onOpenTerminal: () => void;
  onOpenHistory: () => void;
  onUpdateInterval: (minutes: number) => Promise<void>;
}) {
  const { state } = job;
  const isRunning = state?.isRunning ?? false;
  const isPaused = state?.isPaused ?? false;
  const lastSuccess = state?.lastRunSuccess;
  const [triggering, setTriggering] = useState(false);
  const [editingInterval, setEditingInterval] = useState(false);
  const [intervalInput, setIntervalInput] = useState(String(job.intervalMinutes));
  const [savingInterval, setSavingInterval] = useState(false);

  async function saveInterval() {
    const v = parseInt(intervalInput, 10);
    if (isNaN(v) || v < 1 || v > 10080) { setIntervalInput(String(job.intervalMinutes)); setEditingInterval(false); return; }
    setSavingInterval(true);
    try { await onUpdateInterval(v); } finally { setSavingInterval(false); setEditingInterval(false); }
  }

  async function handleTrigger() {
    setTriggering(true);
    try {
      await onTrigger();
      onOpenTerminal();
    } finally {
      setTimeout(() => setTriggering(false), 1000);
    }
  }

  const statusDot = isRunning
    ? "bg-blue-400 animate-pulse"
    : isPaused
    ? "bg-amber-400"
    : lastSuccess === false
    ? "bg-red-400"
    : lastSuccess === true
    ? "bg-emerald-400"
    : "bg-slate-300";

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md ${
      isRunning ? "border-blue-200 shadow-blue-50 shadow-sm" :
      isPaused ? "border-amber-200/60 opacity-75" :
      "border-slate-200"
    }`}>
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${statusDot}`} />
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate">{job.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{job.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {editingInterval ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={10080}
                  value={intervalInput}
                  onChange={e => setIntervalInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveInterval(); if (e.key === "Escape") { setEditingInterval(false); setIntervalInput(String(job.intervalMinutes)); } }}
                  className="w-16 text-[11px] border border-teal-400 rounded-lg px-1.5 py-0.5 focus:outline-none text-center"
                />
                <span className="text-[10px] text-slate-400">dk</span>
                <button onClick={saveInterval} disabled={savingInterval}
                  className="p-0.5 text-emerald-600 hover:text-emerald-800 transition">
                  {savingInterval ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                </button>
                <button onClick={() => { setEditingInterval(false); setIntervalInput(String(job.intervalMinutes)); }}
                  className="p-0.5 text-slate-400 hover:text-slate-600 transition">
                  <X size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingInterval(true); setIntervalInput(String(job.intervalMinutes)); }}
                title="Aralığı düzenle"
                className="group inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full border border-slate-200 transition-colors"
              >
                <Timer size={10} />
                {intervalLabel(job.intervalMinutes)}
                {job.intervalMinutes !== job.defaultIntervalMinutes && (
                  <span className="text-[9px] text-teal-600 font-bold">*</span>
                )}
                <Pencil size={8} className="opacity-0 group-hover:opacity-60 transition-opacity" />
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1">
            <Clock size={11} />
            <span>Son: {timeAgo(state?.lastRunAt ?? null)}</span>
          </div>
          {state && (
            <div className="flex items-center gap-1">
              <Activity size={11} />
              <span>{state.runCount} çalışma</span>
            </div>
          )}
          {isRunning && (
            <span className="flex items-center gap-1 text-blue-600 font-medium">
              <Loader2 size={11} className="animate-spin" /> Çalışıyor...
            </span>
          )}
          {isPaused && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Pause size={11} /> Duraklatıldı
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Trigger */}
          <button
            onClick={handleTrigger}
            disabled={isRunning || triggering || isPaused}
            title="Manuel çalıştır"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {triggering || isRunning ? (
              <><Loader2 size={12} className="animate-spin" /> Çalışıyor</>
            ) : (
              <><Zap size={12} /> Çalıştır</>
            )}
          </button>

          {/* Watch live */}
          <button
            onClick={onOpenTerminal}
            title="Canlı log"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Terminal size={12} /> Log
          </button>

          {/* History */}
          <button
            onClick={onOpenHistory}
            title="Çalışma geçmişi"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <History size={12} />
          </button>

          {/* Pause/Resume */}
          <button
            onClick={onToggle}
            title={isPaused ? "Devam ettir" : "Duraklat"}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
              isPaused
                ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                : "text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = "Onayla", confirmClass = "bg-teal-600 hover:bg-teal-700 text-white" }: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" | "info" }) {
  const colors = {
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-slate-800 text-white",
  };
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 ${colors[type]} animate-in slide-in-from-bottom-4 duration-300`}>
      {type === "success" && <CheckCircle2 size={15} />}
      {type === "error" && <XCircle size={15} />}
      {type === "info" && <Loader2 size={15} className="animate-spin" />}
      {message}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function JoblarPage() {
  const { t } = useI18n();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminalJob, setTerminalJob] = useState<string | null>(null);
  const [historyJob, setHistoryJob] = useState<Job | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Job | null>(null);
  const [confirmTriggerAll, setConfirmTriggerAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "running" | "paused" | "failed">("all");
  const [search, setSearch] = useState("");
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function showToast(message: string, type: "success" | "error" | "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const loadJobs = useCallback(async () => {
    try {
      const data = await api.get<Job[]>("/api/admin/jobs");
      setJobs(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Joblar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
    refreshRef.current = setInterval(loadJobs, 5000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [loadJobs]);

  async function handleTrigger(job: Job) {
    try {
      await api.post(`/api/admin/jobs/${encodeURIComponent(job.name)}/trigger`, {});
      showToast(`${job.name} kuyruğa alındı`, "info");
      setTimeout(loadJobs, 800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Tetikleme başarısız";
      showToast(msg, "error");
      throw e;
    }
  }

  async function handleTriggerAll() {
    setConfirmTriggerAll(false);
    try {
      const r = await api.post<{ triggered: string[]; skipped: string[] }>("/api/admin/jobs/trigger-all", {});
      showToast(`${r.triggered.length} job kuyruğa alındı${r.skipped.length ? `, ${r.skipped.length} atlandı` : ""}`, "info");
      setTimeout(loadJobs, 1000);
    } catch {
      showToast("İşlem başarısız", "error");
    }
  }

  async function handleUpdateInterval(job: Job, minutes: number) {
    await api.put(`/api/admin/jobs/${encodeURIComponent(job.name)}`, { intervalMinutes: minutes });
    showToast(`${job.name} aralığı ${intervalLabel(minutes)} olarak güncellendi`, "success");
    await loadJobs();
  }

  async function handleToggle(job: Job) {
    try {
      const result = await api.put<{ paused: boolean }>(`/api/admin/jobs/${encodeURIComponent(job.name)}/toggle`, {});
      showToast(result.paused ? `${job.name} duraklatıldı` : `${job.name} devam ettirildi`, "success");
      await loadJobs();
    } catch {
      showToast("İşlem başarısız", "error");
    }
    setConfirmToggle(null);
  }

  const filteredJobs = jobs.filter(j => {
    if (search && !j.name.toLowerCase().includes(search.toLowerCase()) && !j.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "running") return j.state?.isRunning;
    if (filter === "paused") return j.state?.isPaused;
    if (filter === "failed") return j.state?.lastRunSuccess === false;
    return true;
  });

  const runningCount = jobs.filter(j => j.state?.isRunning).length;
  const pausedCount = jobs.filter(j => j.state?.isPaused).length;
  const failedCount = jobs.filter(j => j.state?.lastRunSuccess === false && !j.state?.isRunning).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-teal-500" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <XCircle size={40} className="text-red-400" />
      <p className="text-slate-600">{error}</p>
      <button onClick={loadJobs} className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition">
        <RotateCcw size={14} /> Yenile
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Clock size={24} className="text-teal-500" />
            {t("page./joblar", "Arka Plan İşleri")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {jobs.length} job kayıtlı
            {runningCount > 0 && <> · <span className="text-blue-600 font-medium">{runningCount} çalışıyor</span></>}
            {pausedCount > 0 && <> · <span className="text-amber-600 font-medium">{pausedCount} duraklatılmış</span></>}
            {failedCount > 0 && <> · <span className="text-red-600 font-medium">{failedCount} hatalı</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmTriggerAll(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Zap size={14} /> Hepsini Çalıştır
          </button>
          <button
            onClick={loadJobs}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} /> Yenile
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Job ara..."
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition w-48"
        />
        {(["all", "running", "paused", "failed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
              filter === f
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f === "all" ? "Tümü" : f === "running" ? `Çalışanlar (${runningCount})` : f === "paused" ? `Duraklatılmış (${pausedCount})` : `Hatalı (${failedCount})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Clock size={40} className="opacity-30" />
          <p className="text-sm">Filtreyle eşleşen job bulunamadı</p>
          <button onClick={() => { setFilter("all"); setSearch(""); }} className="text-xs text-teal-600 hover:underline">Filtreleri Temizle</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map(job => (
            <JobCard
              key={job.name}
              job={job}
              onTrigger={() => handleTrigger(job)}
              onToggle={() => setConfirmToggle(job)}
              onOpenTerminal={() => setTerminalJob(job.name)}
              onOpenHistory={() => setHistoryJob(job)}
              onUpdateInterval={minutes => handleUpdateInterval(job, minutes)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {terminalJob && (
        <TerminalModal jobName={terminalJob} onClose={() => setTerminalJob(null)} />
      )}
      {historyJob && (
        <HistoryModal job={historyJob} onClose={() => setHistoryJob(null)} />
      )}
      {confirmTriggerAll && (
        <ConfirmModal
          title="Hepsini Çalıştır"
          message={`Duraklatılmış ve zaten çalışan joblar hariç tüm joblar kuyruğa alınacak (${jobs.filter(j => !j.state?.isPaused && !j.state?.isRunning).length} job). Devam?`}
          confirmLabel="Tümünü Çalıştır"
          confirmClass="bg-teal-600 hover:bg-teal-700 text-white"
          onConfirm={handleTriggerAll}
          onCancel={() => setConfirmTriggerAll(false)}
        />
      )}
      {confirmToggle && (
        <ConfirmModal
          title={confirmToggle.state?.isPaused ? "Job'u devam ettir" : "Job'u duraklat"}
          message={
            confirmToggle.state?.isPaused
              ? `${confirmToggle.name} job'u yeniden zamanlamaya alınsın mı? Bir sonraki periyotta otomatik çalışmaya başlayacak.`
              : `${confirmToggle.name} job'u duraklatılsın mı? Manuel tetiklenene veya devam ettirilene kadar çalışmayacak.`
          }
          confirmLabel={confirmToggle.state?.isPaused ? "Devam Ettir" : "Duraklat"}
          confirmClass={confirmToggle.state?.isPaused ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}
          onConfirm={() => handleToggle(confirmToggle)}
          onCancel={() => setConfirmToggle(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
