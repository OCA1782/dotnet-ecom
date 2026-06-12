"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import {
  Rocket, Server, Plus, Pencil, Trash2, Play, Wifi, Container,
  CheckCircle, XCircle, Clock, Loader2, ChevronDown,
  RefreshCw, Terminal, History, X, Save, Eye, EyeOff, AlertTriangle,
  ChevronLeft, ChevronRight, Filter, Copy, Download, ArrowDown,
  GitBranch, Globe, KeyRound, FolderOpen, ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeployServer {
  id: string;
  name: string;
  environment: string;
  host: string;
  port: number;
  username: string;
  authType: string;
  deployPath: string;
  composeFile: string;
  healthCheckUrl?: string;
  branch: string;
  isActive: boolean;
  notes?: string;
  lastDeployAt?: string;
  lastDeployStatus?: string;
  lastDeployDurationSeconds?: number;
}

interface DeployLog {
  id: string;
  serverId: string;
  serverName: string;
  serverEnv: string;
  triggeredBy?: string;
  startedAt: string;
  finishedAt?: string;
  status: string;
  durationSeconds?: number;
  errorMessage?: string;
  branch: string;
  commitHash?: string;
}

interface ServerFormData {
  name: string;
  environment: string;
  host: string;
  port: number;
  username: string;
  authType: string;
  plaintextCredential: string;
  deployPath: string;
  composeFile: string;
  healthCheckUrl: string;
  branch: string;
  isActive: boolean;
  notes: string;
}

const EMPTY_FORM: ServerFormData = {
  name: "", environment: "dev", host: "", port: 22, username: "root",
  authType: "password", plaintextCredential: "", deployPath: "/opt/ecom",
  composeFile: "docker-compose.yml", healthCheckUrl: "", branch: "main",
  isActive: true, notes: "",
};

const ENV_COLORS: Record<string, string> = {
  dev:     "bg-slate-100 text-slate-600 border-slate-200",
  staging: "bg-blue-100 text-blue-700 border-blue-200",
  prod:    "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICON = {
  running: <Loader2 size={14} className="animate-spin text-amber-500" />,
  success: <CheckCircle size={14} className="text-emerald-500" />,
  failed:  <XCircle size={14} className="text-red-500" />,
};

// STATUS_LABEL is defined inside components that use t() to allow translation

const INPUT_CLS = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white";
const BTN_PRIMARY = "px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition";
const BTN_GHOST = "px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d?: string) {
  return d ? new Date(d).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "—";
}
function formatDur(s?: number) {
  if (!s) return "";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}d ${s % 60}s`;
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function Field({ label, children, className = "", required = false }: {
  label: string; children: React.ReactNode; className?: string; required?: boolean;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Info({ label, value, mono = false, className = "" }: {
  label: string; value: string; mono?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-slate-700 text-xs ${mono ? "font-mono" : ""} truncate`}>{value}</div>
    </div>
  );
}

// ── Log row (shared between tabs and inline panels) ───────────────────────────

function LogRow({ log, onViewLog }: { log: DeployLog; onViewLog: (id: string) => void }) {
  const { t } = useI18n();
  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    running: { label: t("status.running", "Çalışıyor"), cls: "bg-amber-100 text-amber-700 border-amber-200" },
    success: { label: t("auto.basarili", "Başarılı"),   cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    failed:  { label: t("auto.hatali", "Hatalı"),       cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const st = STATUS_LABEL[log.status] ?? STATUS_LABEL.failed;
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 transition group">
      <div className="shrink-0 w-5 flex justify-center">
        {STATUS_ICON[log.status as keyof typeof STATUS_ICON] ?? <Clock size={14} className="text-slate-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${st.cls}`}>
            {st.label}
          </span>
          <span className="text-xs font-mono text-slate-500">{log.branch}{log.commitHash ? ` @${log.commitHash}` : ""}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
          <span>{formatDate(log.startedAt)}</span>
          {log.durationSeconds ? <span>· {formatDur(log.durationSeconds)}</span> : null}
          {log.triggeredBy ? <span>· {log.triggeredBy}</span> : null}
          {log.errorMessage && (
            <span className="text-red-500 truncate max-w-[200px]" title={log.errorMessage}>
              · {log.errorMessage}
            </span>
          )}
        </div>
      </div>
      <button onClick={() => onViewLog(log.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-2 py-1 rounded-lg transition">
        <Terminal size={11} />
        Log
      </button>
    </div>
  );
}

// ── Server Mini History (shown in expanded panel) ─────────────────────────────

function ServerHistory({ serverId, onViewLog }: { serverId: string; onViewLog: (id: string) => void }) {
  const { t } = useI18n();
  const [logs, setLogs] = useState<DeployLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ logs: DeployLog[] }>(`/api/admin/deploy/logs?serverId=${serverId}&page=1`);
      setLogs(data.logs.slice(0, 8));
    } catch { } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  // Auto-refresh while any log is "running"
  useEffect(() => {
    const hasRunning = logs.some(l => l.status === "running");
    if (!hasRunning) return;
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [logs, load]);

  if (loading) return <div className="flex items-center gap-2 text-xs text-slate-400 py-2"><Loader2 size={12} className="animate-spin" /> {t("action.loading", "Yükleniyor...")}</div>;
  if (logs.length === 0) return <p className="text-xs text-slate-400 py-2">{t("table.noData", "Kayıt bulunamadı")}</p>;

  return (
    <div className="space-y-0.5">
      {logs.map(log => <LogRow key={log.id} log={log} onViewLog={onViewLog} />)}
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function ConfirmDeleteModal({ server, onConfirm, onClose }: {
  server: DeployServer;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-900">{t("action.delete", "Sil")}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t("msg.irreversible", "Bu işlem geri alınamaz.")}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Server identity */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
              <Server size={16} className="text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900">{server.name}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ENV_COLORS[server.environment] ?? ENV_COLORS.dev}`}>
                  {server.environment}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                {server.username}@{server.host}:{server.port}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{t("msg.confirmDelete", "Silmek istediğinizden emin misiniz?")} {t("msg.irreversible", "Bu işlem geri alınamaz.")}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50/60 rounded-b-2xl">
          <button onClick={onClose} className={BTN_GHOST}>{t("action.cancel", "İptal")}</button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition"
          >
            <Trash2 size={14} />
            {t("action.yes", "Evet")}, {t("action.delete", "Sil")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Deploy Confirm Modal ──────────────────────────────────────────────────────

function ConfirmDeployModal({ server, onConfirm, onClose }: {
  server: DeployServer;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const isProd = server.environment === "prod";

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isProd ? "bg-red-600" : "bg-teal-600"}`}>
            <Rocket size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-900">{t("action.run", "Çalıştır")}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t("msg.confirmDelete", "Silmek istediğinizden emin misiniz?")}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Server identity card */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
              <Server size={16} className="text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900">{server.name}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ENV_COLORS[server.environment] ?? ENV_COLORS.dev}`}>
                  {server.environment}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                {server.username}@{server.host}:{server.port}
              </div>
            </div>
          </div>

          {/* Branch + path */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Branch</div>
              <div className="text-sm font-mono font-semibold text-slate-800 flex items-center gap-1.5">
                <GitBranch size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{server.branch}</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Deploy {t("col.path", "Yol")}</div>
              <div className="text-sm font-mono font-semibold text-slate-800 flex items-center gap-1.5">
                <FolderOpen size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{server.deployPath}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          {isProd ? (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
              <ShieldAlert size={15} className="shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold">{t("status.error", "Hata")}</div>
                <div className="text-xs text-red-600/80 mt-0.5">{t("msg.irreversible", "Bu işlem geri alınamaz.")}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle size={14} className="shrink-0" />
              {t("msg.irreversible", "Bu işlem geri alınamaz.")}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50/60 rounded-b-2xl">
          <button onClick={onClose} className={BTN_GHOST}>{t("action.cancel", "İptal")}</button>
          <button
            onClick={onConfirm}
            className={`flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl transition ${
              isProd ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            <Rocket size={14} />
            {isProd ? `${t("action.yes", "Evet")}, Production'a ${t("auto.deployEt", "Deploy Et")}` : t("action.run", "Çalıştır")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section header for form groups ───────────────────────────────────────────

function SectionHeader({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 col-span-2 pt-2">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-slate-600" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        {description && <div className="text-xs text-slate-400 mt-0.5">{description}</div>}
      </div>
    </div>
  );
}

// ── Server Form Modal ─────────────────────────────────────────────────────────

function ServerModal({ server, onClose, onSaved }: {
  server?: DeployServer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<ServerFormData>(
    server ? {
      name: server.name, environment: server.environment, host: server.host,
      port: server.port, username: server.username, authType: server.authType,
      plaintextCredential: "", deployPath: server.deployPath,
      composeFile: server.composeFile, healthCheckUrl: server.healthCheckUrl ?? "",
      branch: server.branch, isActive: server.isActive, notes: server.notes ?? "",
    } : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [showCred, setShowCred] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof ServerFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  // ESC to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  async function save() {
    setSaving(true); setError("");
    try {
      const body = { ...form, port: Number(form.port) };
      if (server) {
        await api.put(`/api/admin/deploy/servers/${server.id}`, body);
      } else {
        await api.post("/api/admin/deploy/servers", body);
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu"));
    } finally {
      setSaving(false);
    }
  }

  const isProd = form.environment === "prod";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b shrink-0">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
            <Server size={18} className="text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              {server ? `${t("action.edit", "Düzenle")} — ${server.name}` : t("action.add", "Ekle")}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">SSH {t("ui.testConnection", "Bağlantı Test Et")}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Prod warning */}
        {isProd && (
          <div className="mx-6 mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm shrink-0">
            <ShieldAlert size={15} className="shrink-0 mt-0.5" />
            <span><strong>Production {t("col.environment", "Ortam")}.</strong> {t("msg.irreversible", "Bu işlem geri alınamaz.")}</span>
          </div>
        )}

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">

            {/* Section 1: Bağlantı */}
            <SectionHeader icon={Globe} title={t("ui.testConnection", "Bağlantı Test Et")} description={t("col.environment", "Ortam")} />
            <div className="col-span-2 grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4">
              <Field label={t("col.name", "Ad")} required>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  className={INPUT_CLS} placeholder="prod-web-01" autoFocus />
              </Field>
              <Field label={t("col.environment", "Ortam")}>
                <select value={form.environment} onChange={e => set("environment", e.target.value)} className={INPUT_CLS}>
                  <option value="dev">🟢 Development</option>
                  <option value="staging">🔵 Staging</option>
                  <option value="prod">🔴 Production</option>
                </select>
              </Field>
              <Field label="Host / IP" required>
                <input value={form.host} onChange={e => set("host", e.target.value)}
                  className={INPUT_CLS} placeholder="192.168.1.100 veya server.example.com" />
              </Field>
              <Field label="SSH Port">
                <input type="number" value={form.port} onChange={e => set("port", e.target.value)}
                  className={INPUT_CLS} min={1} max={65535} />
              </Field>
            </div>

            {/* Section 2: Kimlik */}
            <SectionHeader icon={KeyRound} title="SSH" description="SSH" />
            <div className="col-span-2 grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4">
              <Field label={t("col.name", "Ad")}>
                <input value={form.username} onChange={e => set("username", e.target.value)}
                  className={INPUT_CLS} placeholder="deploy" />
              </Field>
              <Field label={t("col.method", "Metot")}>
                <select value={form.authType} onChange={e => set("authType", e.target.value)} className={INPUT_CLS}>
                  <option value="password">🔑 {t("auto.sifre", "Şifre")}</option>
                  <option value="sshkey">🗝 SSH {t("auto.anahtarDosyasi", "Anahtar Dosyası")}</option>
                </select>
              </Field>
              <div className="col-span-2">
                <Field label={form.authType === "sshkey" ? "Private Key" : `SSH ${t("auto.sifresi", "Şifresi")}`}>
                  <div className="relative">
                    {form.authType === "sshkey" ? (
                      <>
                        <textarea value={form.plaintextCredential} onChange={e => set("plaintextCredential", e.target.value)}
                          className={`${INPUT_CLS} font-mono text-xs h-28 resize-none`}
                          placeholder={"-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEA...\n-----END OPENSSH PRIVATE KEY-----"} />
                        <p className="text-[11px] text-slate-400 mt-1">{t("auto.pemFormatAciklama", "PEM formatında tam private key içeriğini yapıştırın. Şifreli olmamalı.")}</p>
                      </>
                    ) : (
                      <input type={showCred ? "text" : "password"} value={form.plaintextCredential}
                        onChange={e => set("plaintextCredential", e.target.value)}
                        className={`${INPUT_CLS} pr-10`}
                        placeholder={server ? t("auto.degistirmemekIcinBos", "Değiştirmemek için boş bırakın") : t("auto.sifre", "Şifre")} />
                    )}
                    {form.authType === "password" && (
                      <button type="button" onClick={() => setShowCred(s => !s)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition">
                        {showCred ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    )}
                  </div>
                </Field>
              </div>
            </div>

            {/* Section 3: Deploy */}
            <SectionHeader icon={FolderOpen} title="Deploy" description={t("col.path", "Yol")} />
            <div className="col-span-2 grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4">
              <Field label={`Deploy ${t("col.path", "Yol")}`}>
                <input value={form.deployPath} onChange={e => set("deployPath", e.target.value)}
                  className={`${INPUT_CLS} font-mono text-sm`} placeholder="/opt/ecom" />
              </Field>
              <Field label="Compose">
                <input value={form.composeFile} onChange={e => set("composeFile", e.target.value)}
                  className={`${INPUT_CLS} font-mono text-sm`} placeholder="docker-compose.yml" />
              </Field>
              <Field label="Branch">
                <div className="relative">
                  <GitBranch size={13} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input value={form.branch} onChange={e => set("branch", e.target.value)}
                    className={`${INPUT_CLS} pl-8`} placeholder="main" />
                </div>
              </Field>
              <Field label="Health Check URL">
                <input value={form.healthCheckUrl} onChange={e => set("healthCheckUrl", e.target.value)}
                  className={INPUT_CLS} placeholder="https://api.example.com/health" />
              </Field>
              <div className="col-span-2">
                <Field label="Not">
                  <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                    className={`${INPUT_CLS} resize-none h-14`} placeholder={t("auto.aciklamaHatirlatic", "Açıklama, hatırlatıcı...")} />
                </Field>
              </div>
              <label className="col-span-2 flex items-center gap-3 cursor-pointer p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-300 transition select-none">
                <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)}
                  className="w-4 h-4 accent-teal-600" />
                <div>
                  <div className="text-sm font-medium text-slate-800">{t("status.active", "Aktif")}</div>
                  <div className="text-xs text-slate-400">{t("status.disabled", "Devre Dışı")}</div>
                </div>
                <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  form.isActive ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-slate-100 text-slate-500 border-slate-200"
                }`}>{form.isActive ? t("status.active", "Aktif") : t("status.passive", "Pasif")}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 shrink-0">
            <AlertTriangle size={14} className="shrink-0" />{error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/60 rounded-b-2xl shrink-0">
          <p className="text-xs text-slate-400">{t("auto.kimlikBilgileriSifreli", "Kimlik bilgileri şifrelenmiş olarak saklanır.")}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className={BTN_GHOST}>{t("action.cancel", "İptal")}</button>
            <button onClick={save} disabled={saving || !form.name || !form.host}
              className={`${BTN_PRIMARY} flex items-center gap-2`}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? t("action.saving", "Kaydediliyor...") : server ? t("action.update", "Güncelle") : t("action.save", "Kaydet")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Deploy Stream Modal ───────────────────────────────────────────────────────

// DEPLOY_STEPS is defined inside DeployStreamModal to allow t() calls

function logLineCls(line: string) {
  if (line.includes("✅") || line.includes("TAMAMLANDI")) return "text-emerald-400 font-semibold";
  if (line.includes("❌") || line.includes("HATA"))       return "text-red-400 font-semibold";
  if (line.includes("⚠"))                                 return "text-amber-400";
  if (line.startsWith("  [err]"))                         return "text-red-400/80";
  if (line.startsWith("[ADIM"))                           return "text-teal-300 font-bold";
  if (line.includes("───"))                               return "text-slate-700";
  if (line.startsWith("  →") || line.startsWith("  ✓"))  return "text-slate-400";
  return "text-slate-300";
}

function DeployStreamModal({ logId, serverName, serverEnv, onClose }: {
  logId: string;
  serverName: string;
  serverEnv: string;
  onClose: (finalStatus: "success" | "failed" | "running" | null) => void;
}) {
  const { t } = useI18n();
  const DEPLOY_STEPS = [
    t("auto.sshBaglanti", "SSH Bağlantı"),
    "Git Fetch",
    "Docker Build",
    "Docker Up",
    t("auto.temizlik", "Temizlik"),
    t("auto.saglik", "Sağlık"),
  ];
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState<"running" | "success" | "failed">("running");
  const [currentStep, setCurrentStep] = useState(0);
  const [visualPercent, setVisualPercent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<number | null>(null);
  const currentStepRef = useRef(0);
  const doneRef = useRef(false);

  // Elapsed timer
  useEffect(() => {
    if (done) return;
    const startedAt = startRef.current ?? Date.now();
    if (startRef.current === null) startRef.current = startedAt;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [done]);

  // Keep refs in sync for smooth animation
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { doneRef.current = done; }, [done]);

  // Smooth progress bar animation
  useEffect(() => {
    if (done) {
      const id = window.setTimeout(() => setVisualPercent(100), 0);
      return () => window.clearTimeout(id);
    }

    let frameId: number;
    let lastTime = performance.now();

    function tick(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setVisualPercent(prev => {
        if (doneRef.current) return 100;
        const step = currentStepRef.current;
        // Real floor: position of current step
        const realFloor = (step / 6) * 100;
        // Cap: never show more than 92% of next step unless real step arrives
        const cap = ((step + 0.92) / 6) * 100;

        if (prev < realFloor) {
          // Snap up to real floor quickly
          return Math.min(realFloor, prev + 15 * dt);
        }
        if (prev >= cap) return prev;

        // Slow creep toward cap: starts fast, decelerates
        const remaining = cap - prev;
        const speed = Math.max(0.3, remaining * 0.08); // 8% of remaining per second
        return Math.min(cap, prev + speed * dt);
      });

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [done]);

  // SSE stream
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (!token) return;
    const abortCtrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/admin/deploy/logs/${logId}/stream`,
          { headers: { Authorization: `Bearer ${token}` }, signal: abortCtrl.signal }
        );
        if (!res.body) return;
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
            if (line.startsWith("__DONE__")) {
              const s = line.replace("__DONE__", "") as "success" | "failed";
              setStatus(s);
              setDone(true);
              return;
            }
            // Track current step
            const stepMatch = line.match(/\[ADIM (\d+)\/6\]/);
            if (stepMatch) setCurrentStep(Number(stepMatch[1]));
            setLines(prev => [...prev, line.replace(/\\n/g, "\n")]);
          }
        }
      } catch { /* aborted */ }
    })();
    return () => abortCtrl.abort();
  }, [logId]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, autoScroll]);

  // ESC only when done
  useEffect(() => {
    if (!done) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(status); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [done, status, onClose]);

  // Detect manual scroll up → disable auto-scroll
  function handleScroll() {
    const el = logRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (!atBottom) setAutoScroll(false);
    else setAutoScroll(true);
  }

  function copyLog() {
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#0d1117] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col border border-white/5">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                <Terminal size={14} className="text-teal-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm leading-tight">{serverName}</span>
                  {serverEnv && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${ENV_COLORS[serverEnv] ?? ENV_COLORS.dev}`}>
                      {serverEnv}
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-0.5">{t("tab.logs", "Loglar")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Status */}
              {!done ? (
                <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                  <Loader2 size={11} className="animate-spin" />
                  {formatDur(elapsed) || "0s"}
                </span>
              ) : status === "success" ? (
                <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                  <CheckCircle size={12} /> {t("status.success", "Başarılı")} · {formatDur(elapsed)}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                  <XCircle size={12} /> {t("status.error", "Hata")} · {formatDur(elapsed)}
                </span>
              )}
              {done && (
                <button onClick={() => onClose(status)}
                  className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Smooth continuous progress bar with step markers */}
          <div className="flex flex-col gap-1.5">
            {/* Bar */}
            <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-[width] ${
                  done && status === "failed" ? "bg-red-500" :
                  done ? "bg-teal-400" :
                  "bg-gradient-to-r from-teal-600 to-teal-400"
                }`}
                style={{ width: `${visualPercent.toFixed(1)}%` }}
              />
              {/* Step marker lines */}
              {DEPLOY_STEPS.map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-y-0 w-px bg-black/30"
                  style={{ left: `${((i + 1) / DEPLOY_STEPS.length) * 100}%` }}
                />
              ))}
            </div>
            {/* Step labels */}
            <div className="hidden sm:flex items-center">
              {DEPLOY_STEPS.map((step, i) => {
                const stepPct = ((i + 1) / DEPLOY_STEPS.length) * 100;
                const isReached = visualPercent >= stepPct - 0.5;
                const isCurrent = currentStep === i + 1 && !done;
                return (
                  <div key={step} className="flex-1 text-center">
                    <span className={`text-[9px] font-medium transition-colors ${
                      done && status === "failed" && currentStep === i + 1 ? "text-red-400" :
                      isReached ? "text-teal-400" :
                      isCurrent ? "text-teal-300" :
                      "text-slate-700"
                    }`}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Log body */}
        <div
          ref={logRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-5 font-mono text-xs leading-5 space-y-px"
        >
          {lines.map((line, i) => (
            <div key={i} className={logLineCls(line)}>{line || " "}</div>
          ))}
          {!done && <div className="text-slate-600 animate-pulse mt-1">▌</div>}
          <div ref={bottomRef} />
        </div>

        {/* Footer toolbar */}
        <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-3 shrink-0 bg-white/2">
          <div className="flex items-center gap-2">
            {/* Copy */}
            <button onClick={copyLog}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition">
              <Copy size={11} />
              {copied ? t("action.copy", "Kopyala") + "d!" : t("action.copy", "Kopyala")}
            </button>
            {/* Auto-scroll toggle */}
            {!done && (
              <button onClick={() => {
                setAutoScroll(s => !s);
                if (!autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              }} className={`flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg transition ${
                autoScroll
                  ? "text-teal-400 border-teal-500/30 bg-teal-500/10"
                  : "text-slate-500 border-white/10 hover:text-white"
              }`}>
                <ArrowDown size={11} />
                {autoScroll ? t("auto.otomatik", "Otomatik") : t("auto.manuel", "Manuel")}
              </button>
            )}
          </div>

          {done ? (
            <button onClick={() => onClose(status)}
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition ${
                status === "success"
                  ? "bg-teal-600 hover:bg-teal-500 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}>
              {status === "success" ? t("tab.history", "Geçmiş") : t("action.close", "Kapat")}
            </button>
          ) : (
            <span className="text-xs text-slate-600">{t("action.processing", "İşleniyor...")}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Full Log Modal ────────────────────────────────────────────────────────────

interface FullLogData {
  fullLog?: string;
  serverName?: string;
  serverEnv?: string;
  status?: string;
  startedAt?: string;
  finishedAt?: string;
  durationSeconds?: number;
  branch?: string;
  commitHash?: string;
  errorMessage?: string;
}

function FullLogModal({ logId, onClose }: { logId: string; onClose: () => void }) {
  const { t } = useI18n();
  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    running: { label: t("status.running", "Çalışıyor"), cls: "bg-amber-100 text-amber-700 border-amber-200" },
    success: { label: t("auto.basarili", "Başarılı"),   cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    failed:  { label: t("auto.hatali", "Hatalı"),       cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const [log, setLog] = useState<FullLogData | null>(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<FullLogData>(`/api/admin/deploy/logs/${logId}`).then(setLog).catch(() => {});
  }, [logId]);

  // ESC to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  function copyLog() {
    if (!log?.fullLog) return;
    navigator.clipboard.writeText(log.fullLog).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadLog() {
    if (!log?.fullLog) return;
    const blob = new Blob([log.fullLog], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deploy-${log.serverName ?? logId}-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const rawLines = log?.fullLog?.split("\n") ?? [];
  const filteredLines = search
    ? rawLines.map((l, i) => ({ l, i, match: l.toLowerCase().includes(search.toLowerCase()) }))
    : rawLines.map((l, i) => ({ l, i, match: true }));
  const matchCount = filteredLines.filter(x => x.match).length;

  const st = log?.status ? STATUS_LABEL[log.status] : null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0d1117] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col border border-white/5">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <Terminal size={14} className="text-teal-400" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm leading-tight">
                  {log?.serverName ?? "Deploy"} — {t("tab.history", "Geçmiş")} {t("tab.logs", "Loglar")}
                </div>
                {log && (
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {log.serverEnv && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${ENV_COLORS[log.serverEnv] ?? ENV_COLORS.dev}`}>
                        {log.serverEnv}
                      </span>
                    )}
                    {st && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${st.cls}`}>
                        {st.label}
                      </span>
                    )}
                    {log.branch && (
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <GitBranch size={9} />{log.branch}{log.commitHash ? ` @${log.commitHash}` : ""}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Meta row */}
          {log && (log.startedAt || log.durationSeconds || log.errorMessage) && (
            <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
              {log.startedAt && (
                <span className="flex items-center gap-1">
                  <Clock size={10} />{formatDate(log.startedAt)}
                  {log.finishedAt && <> → {formatDate(log.finishedAt)}</>}
                </span>
              )}
              {log.durationSeconds && (
                <span className="flex items-center gap-1 text-teal-600/80">
                  ⏱ {formatDur(log.durationSeconds)}
                </span>
              )}
              {log.errorMessage && (
                <span className="text-red-400 truncate max-w-xs" title={log.errorMessage}>
                  ❌ {log.errorMessage}
                </span>
              )}
            </div>
          )}

          {/* Search */}
          {rawLines.length > 0 && (
            <div className="relative">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t("filter.search", "Ara...")}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:bg-white/8 transition"
              />
              {search && (
                <div className="absolute right-2 top-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">{matchCount} {t("auto.satir", "satır")}</span>
                  <button onClick={() => setSearch("")} className="text-slate-600 hover:text-slate-300 transition"><X size={12} /></button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Log content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 font-mono text-xs leading-5">
          {log == null ? (
            <div className="flex items-center gap-2 text-slate-500 py-4">
              <Loader2 size={14} className="animate-spin" />{t("action.loading", "Yükleniyor...")}
            </div>
          ) : log.status === "running" ? (
            <div className="flex items-center gap-2 text-amber-400 py-4">
              <Loader2 size={14} className="animate-spin" />{t("action.processing", "İşleniyor...")}
            </div>
          ) : rawLines.length === 0 ? (
            <span className="text-slate-600">{t("table.noData", "Kayıt bulunamadı")}</span>
          ) : (
            <div className="space-y-px">
              {filteredLines.map(({ l, i, match }) => (
                <div key={i} className={`flex gap-3 ${!match && search ? "opacity-20" : ""} ${match && search ? "bg-yellow-500/5 rounded" : ""}`}>
                  <span className="text-slate-700 select-none w-9 text-right shrink-0">{i + 1}</span>
                  <span className={logLineCls(l)}>{
                    match && search
                      ? l.split(new RegExp(`(${search})`, "gi")).map((part, pi) =>
                          part.toLowerCase() === search.toLowerCase()
                            ? <mark key={pi} className="bg-yellow-400/30 text-yellow-300 rounded px-0.5">{part}</mark>
                            : part
                        )
                      : (l || " ")
                  }</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={copyLog} disabled={!log?.fullLog}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition disabled:opacity-30">
              <Copy size={11} />{copied ? t("action.copy", "Kopyala") + "d!" : t("action.copy", "Kopyala")}
            </button>
            <button onClick={downloadLog} disabled={!log?.fullLog}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition disabled:opacity-30">
              <Download size={11} />{t("action.download", "İndir")}
            </button>
            {rawLines.length > 0 && (
              <span className="text-xs text-slate-700">{rawLines.length} {t("auto.satir", "satır")}</span>
            )}
          </div>
          <button onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-xl transition">
            {t("action.close", "Kapat")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "servers" | "logs";

export default function DeployPage() {
  const { t } = useI18n();
  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    running: { label: t("status.running", "Çalışıyor"), cls: "bg-amber-100 text-amber-700 border-amber-200" },
    success: { label: t("auto.basarili", "Başarılı"),   cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    failed:  { label: t("auto.hatali", "Hatalı"),       cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const [tab, setTab] = useState<Tab>("servers");
  const [servers, setServers] = useState<DeployServer[]>([]);
  const [logs, setLogs] = useState<DeployLog[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [filterServerId, setFilterServerId] = useState<string>("");
  const [loadingServers, setLoadingServers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [serverModal, setServerModal] = useState<DeployServer | null | "new">(null);
  const [confirmDeployServer, setConfirmDeployServer] = useState<DeployServer | null>(null);
  const [streamLogId, setStreamLogId] = useState<string | null>(null);
  const [streamServerName, setStreamServerName] = useState("");
  const [streamServerEnv, setStreamServerEnv] = useState("");
  const [fullLogId, setFullLogId] = useState<string | null>(null);
  const [deploying, setDeploying] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [containerResults, setContainerResults] = useState<Record<string, string>>({});
  const [loadingContainers, setLoadingContainers] = useState<Record<string, boolean>>({});
  const [expandedServer, setExpandedServer] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmServer, setDeleteConfirmServer] = useState<DeployServer | null>(null);

  const loadServers = useCallback(async () => {
    setLoadingServers(true);
    try {
      const data = await api.get<DeployServer[]>("/api/admin/deploy/servers");
      setServers(data);
    } catch { } finally {
      setLoadingServers(false);
    }
  }, []);

  const loadLogs = useCallback(async (page = 1, serverId = "") => {
    setLoadingLogs(true);
    try {
      const qs = new URLSearchParams({ page: String(page) });
      if (serverId) qs.set("serverId", serverId);
      const data = await api.get<{ total: number; page: number; logs: DeployLog[] }>(
        `/api/admin/deploy/logs?${qs}`
      );
      setLogs(data.logs);
      setLogTotal(data.total);
      setLogPage(page);
    } catch { } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => { loadServers(); }, [loadServers]);
  useEffect(() => {
    if (tab === "logs") loadLogs(1, filterServerId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, loadLogs]);

  // Auto-poll while any visible log is still "running"
  useEffect(() => {
    if (tab !== "logs") return;
    const hasRunning = logs.some(l => l.status === "running");
    if (!hasRunning) return;
    const id = setInterval(() => loadLogs(logPage, filterServerId), 4000);
    return () => clearInterval(id);
  }, [tab, logs, logPage, filterServerId, loadLogs]);

  function startDeploy(server: DeployServer) {
    setConfirmDeployServer(server);
  }

  async function executeDeploy(server: DeployServer) {
    setConfirmDeployServer(null);
    setDeploying(d => ({ ...d, [server.id]: true }));
    try {
      const res = await api.post<{ logId: string }>(`/api/admin/deploy/servers/${server.id}/deploy`, {});
      setStreamLogId(res.logId);
      setStreamServerName(server.name);
      setStreamServerEnv(server.environment);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu"));
    } finally {
      setDeploying(d => ({ ...d, [server.id]: false }));
    }
  }

  function handleStreamClose() {
    setStreamLogId(null);
    loadServers();
    // Switch to logs tab and reload
    setTab("logs");
    setFilterServerId("");
    loadLogs(1, "");
  }

  async function testConnection(server: DeployServer) {
    setTesting(t => ({ ...t, [server.id]: true }));
    setTestResults(r => ({ ...r, [server.id]: "" }));
    try {
      const res = await api.post<{ result: string }>(`/api/admin/deploy/servers/${server.id}/test-connection`, {});
      setTestResults(r => ({ ...r, [server.id]: res.result }));
    } catch (e: unknown) {
      setTestResults(r => ({ ...r, [server.id]: `${t("status.error", "Hata")}: ${e instanceof Error ? e.message : t("msg.error", "Bir hata oluştu")}` }));
    } finally {
      setTesting(t => ({ ...t, [server.id]: false }));
    }
  }

  async function loadContainers(server: DeployServer) {
    setLoadingContainers(l => ({ ...l, [server.id]: true }));
    try {
      const res = await api.get<{ result: string }>(`/api/admin/deploy/servers/${server.id}/container-status`);
      setContainerResults(r => ({ ...r, [server.id]: res.result }));
    } catch (e: unknown) {
      setContainerResults(r => ({ ...r, [server.id]: `${t("status.error", "Hata")}: ${e instanceof Error ? e.message : t("msg.loadFailed", "Yüklenemedi.")}` }));
    } finally {
      setLoadingContainers(l => ({ ...l, [server.id]: false }));
    }
  }

  async function executeDelete(server: DeployServer) {
    setDeleteConfirmServer(null);
    setDeleting(server.id);
    try {
      await api.delete(`/api/admin/deploy/servers/${server.id}`);
      await loadServers();
    } catch { } finally {
      setDeleting(null);
    }
  }

  const totalPages = Math.ceil(logTotal / 20);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Rocket size={24} className="text-teal-600" />
            {t("page./deploy", "Deploy Yönetimi")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t("tab.deploy", "Deploy")}</p>
        </div>
        {tab === "servers" && (
          <button onClick={() => setServerModal("new")} className={`${BTN_PRIMARY} flex items-center gap-2`}>
            <Plus size={16} />{t("action.add", "Ekle")}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          ["servers", Server, t("auto.sunucular", "Sunucular")],
          ["logs",    History, `${t("tab.history", "Geçmiş")}${logTotal > 0 ? ` (${logTotal})` : ""}`],
        ] as [Tab, React.ComponentType<{size?: number; className?: string}>, string][]).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── Servers Tab ──────────────────────────────────────────────────────── */}
      {tab === "servers" && (
        <div className="space-y-4">
          {loadingServers ? (
            <div className="flex justify-center py-16 text-slate-400"><Loader2 size={24} className="animate-spin" /></div>
          ) : servers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              {/* Illustration */}
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <Server size={40} className="text-slate-300" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center shadow-md">
                  <Plus size={16} className="text-white" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-1">{t("table.noData", "Kayıt bulunamadı")}</h3>
              <p className="text-sm text-slate-400 max-w-sm mb-6">
                {t("msg.loadFailed", "Yüklenemedi.")}
              </p>

              {/* Feature list */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 w-full max-w-lg">
                {[
                  { icon: Wifi,      label: t("ui.testConnection", "Bağlantı Test Et") },
                  { icon: Terminal,  label: t("tab.logs", "Loglar") },
                  { icon: History,   label: t("tab.history", "Geçmiş") },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <Icon size={15} className="text-teal-500 shrink-0" />
                    <span className="text-xs text-slate-600 font-medium">{label}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setServerModal("new")}
                className={`${BTN_PRIMARY} flex items-center gap-2 px-6 py-2.5`}
              >
                <Plus size={16} />
                {t("action.add", "Ekle")}
              </button>
            </div>
          ) : (
            servers.map(server => (
              <div key={server.id} className={`bg-white rounded-2xl border shadow-sm transition ${!server.isActive ? "opacity-60" : ""}`}>
                {/* Card header */}
                <div className="flex items-center gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                    <Server size={18} className="text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{server.name}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ENV_COLORS[server.environment] ?? ENV_COLORS.dev}`}>
                        {server.environment}
                      </span>
                      {!server.isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200">{t("status.passive", "Pasif")}</span>
                      )}
                      {server.lastDeployStatus === "running" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />{t("status.running", "Çalışıyor")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {server.username}@{server.host}:{server.port} — {server.deployPath}
                    </div>
                  </div>

                  {/* Last deploy info */}
                  {server.lastDeployAt && (
                    <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 shrink-0">
                      {STATUS_ICON[server.lastDeployStatus as keyof typeof STATUS_ICON] ?? <Clock size={14} />}
                      <span>{formatDate(server.lastDeployAt)}</span>
                      {server.lastDeployDurationSeconds && (
                        <span className="text-slate-400">({formatDur(server.lastDeployDurationSeconds)})</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startDeploy(server)}
                      disabled={deploying[server.id] || !server.isActive}
                      className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl transition">
                      {deploying[server.id] ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                      Deploy
                    </button>
                    <button onClick={() => {
                      const newId = expandedServer === server.id ? null : server.id;
                      setExpandedServer(newId);
                    }} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition">
                      <ChevronDown size={16} className={`transition-transform ${expandedServer === server.id ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => setServerModal(server)}
                      className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition"
                      title={t("action.edit", "Düzenle")}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteConfirmServer(server)} disabled={deleting === server.id}
                      className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition"
                      title={t("action.delete", "Sil")}>
                      {deleting === server.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded panel */}
                {expandedServer === server.id && (
                  <div className="px-5 pb-5 border-t pt-4 space-y-5">
                    {/* Config info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Info label="Branch" value={server.branch} mono />
                      <Info label="Compose" value={server.composeFile} mono />
                      <Info label="Auth" value={server.authType === "sshkey" ? t("auto.sshAnahtar", "SSH Anahtar") : t("auto.sifre", "Şifre")} />
                      {server.healthCheckUrl && <Info label="Health URL" value={server.healthCheckUrl} mono />}
                      {server.notes && <Info label="Not" value={server.notes} className="col-span-2 md:col-span-4" />}
                    </div>

                    {/* Tools row */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => testConnection(server)} disabled={testing[server.id]}
                          className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition bg-white">
                          {testing[server.id] ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
                          {t("ui.testConnection", "Bağlantı Test Et")}
                        </button>
                        <button onClick={() => loadContainers(server)} disabled={loadingContainers[server.id]}
                          className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition bg-white">
                          {loadingContainers[server.id] ? <Loader2 size={12} className="animate-spin" /> : <Container size={12} />}
                          Container {t("col.status", "Durum")}
                        </button>
                        <button onClick={() => { setTab("logs"); setFilterServerId(server.id); loadLogs(1, server.id); }}
                          className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition bg-white">
                          <History size={12} />
                          {t("ui.viewLogs", "Logları Gör")}
                        </button>
                        <button onClick={loadServers}
                          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">
                          <RefreshCw size={12} />
                          {t("action.refresh", "Yenile")}
                        </button>
                      </div>
                      {testResults[server.id] && (
                        <pre className={`text-xs p-3 rounded-xl font-mono whitespace-pre-wrap ${
                          testResults[server.id].startsWith(t("status.error", "Hata")) || testResults[server.id].startsWith("❌")
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                        }`}>{testResults[server.id]}</pre>
                      )}
                      {containerResults[server.id] && (
                        <pre className="text-xs p-3 rounded-xl font-mono whitespace-pre-wrap bg-slate-900 text-slate-200">
                          {containerResults[server.id]}
                        </pre>
                      )}
                    </div>

                    {/* Inline deploy history */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <History size={13} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("tab.history", "Geçmiş")}</span>
                      </div>
                      <ServerHistory serverId={server.id} onViewLog={setFullLogId} />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Logs Tab ─────────────────────────────────────────────────────────── */}
      {tab === "logs" && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b flex-wrap">
            <div className="flex items-center gap-2 text-slate-600">
              <Filter size={14} />
              <span className="text-sm font-semibold">{t("tab.history", "Geçmiş")}</span>
              {logTotal > 0 && <span className="text-xs text-slate-400">({logTotal} {t("table.perPage", "kayıt")})</span>}
            </div>

            {/* Server filter */}
            {servers.length > 0 && (
              <select
                value={filterServerId}
                onChange={e => {
                  const v = e.target.value;
                  setFilterServerId(v);
                  loadLogs(1, v);
                }}
                className="ml-auto text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">{t("filter.all", "Tümü")}</option>
                {servers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.environment})</option>
                ))}
              </select>
            )}

            {/* Running badge */}
            {logs.some(l => l.status === "running") && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                {t("status.running", "Çalışıyor")} — {t("action.refresh", "Yenile")}
              </span>
            )}

            <button onClick={() => loadLogs(logPage, filterServerId)}
              className="text-slate-400 hover:text-slate-700 transition p-1.5 rounded-lg hover:bg-slate-100"
              title={t("action.refresh", "Yenile")}>
              <RefreshCw size={15} />
            </button>
          </div>

          {/* List */}
          {loadingLogs ? (
            <div className="flex justify-center py-12 text-slate-400"><Loader2 size={24} className="animate-spin" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t("table.noData", "Kayıt bulunamadı")}</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map(log => {
                const st = STATUS_LABEL[log.status] ?? STATUS_LABEL.failed;
                return (
                  <div key={log.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition group">
                    <div className="shrink-0">{STATUS_ICON[log.status as keyof typeof STATUS_ICON] ?? <Clock size={14} className="text-slate-400" />}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">{log.serverName}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ENV_COLORS[log.serverEnv] ?? ENV_COLORS.dev}`}>
                          {log.serverEnv}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${st.cls}`}>
                          {st.label}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {log.branch}{log.commitHash ? ` @${log.commitHash}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                        <span><Clock size={10} className="inline mr-1" />{formatDate(log.startedAt)}</span>
                        {log.finishedAt && <span>→ {formatDate(log.finishedAt)}</span>}
                        {log.durationSeconds ? <span>· {formatDur(log.durationSeconds)}</span> : null}
                        {log.triggeredBy ? <span>· {log.triggeredBy}</span> : null}
                      </div>
                      {log.errorMessage && (
                        <div className="mt-1 text-xs text-red-500 truncate">{log.errorMessage}</div>
                      )}
                    </div>
                    {log.status === "running" ? (
                      <span className="shrink-0 text-xs text-amber-500 flex items-center gap-1 animate-pulse">
                        <Loader2 size={11} className="animate-spin" /> {t("status.running", "Çalışıyor")}
                      </span>
                    ) : (
                      <button onClick={() => setFullLogId(log.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition">
                        <Terminal size={12} />{t("ui.viewLogs", "Logları Gör")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination — always visible when there are logs */}
          {logTotal > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t bg-slate-50/50">
              <span className="text-xs text-slate-400">
                {logPage} / {Math.max(totalPages, 1)} · {logTotal} {t("table.perPage", "kayıt")}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button disabled={logPage <= 1} onClick={() => loadLogs(logPage - 1, filterServerId)}
                    className="p-1.5 rounded-lg border text-slate-500 hover:bg-white disabled:opacity-40 transition">
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i + 1 : i < 3 ? i + 1 : i === 3 ? logPage : totalPages - 2 + (i - 4);
                    if (i === 3 && totalPages > 7) return <span key="dots" className="px-1 text-slate-400 text-xs">···</span>;
                    return (
                      <button key={p} onClick={() => loadLogs(p, filterServerId)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition ${p === logPage ? "bg-teal-600 text-white" : "border text-slate-600 hover:bg-white"}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button disabled={logPage >= totalPages} onClick={() => loadLogs(logPage + 1, filterServerId)}
                    className="p-1.5 rounded-lg border text-slate-500 hover:bg-white disabled:opacity-40 transition">
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {serverModal && (
        <ServerModal
          server={serverModal === "new" ? null : serverModal}
          onClose={() => setServerModal(null)}
          onSaved={() => { setServerModal(null); loadServers(); }}
        />
      )}
      {deleteConfirmServer && (
        <ConfirmDeleteModal
          server={deleteConfirmServer}
          onConfirm={() => executeDelete(deleteConfirmServer)}
          onClose={() => setDeleteConfirmServer(null)}
        />
      )}
      {confirmDeployServer && (
        <ConfirmDeployModal
          server={confirmDeployServer}
          onConfirm={() => executeDeploy(confirmDeployServer)}
          onClose={() => setConfirmDeployServer(null)}
        />
      )}
      {streamLogId && (
        <DeployStreamModal
          logId={streamLogId}
          serverName={streamServerName}
          serverEnv={streamServerEnv}
          onClose={handleStreamClose}
        />
      )}
      {fullLogId && (
        <FullLogModal
          logId={fullLogId}
          onClose={() => setFullLogId(null)}
        />
      )}
    </div>
  );
}
