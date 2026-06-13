"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import type { Lang } from "@/lib/i18n";
import { api } from "@/lib/api";
import {
  Clock, Play, Pause, RefreshCw, Terminal,
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

type UiLang = "tr" | "en" | "de" | "es";

const JOB_META: Record<string, Record<UiLang, { title: string; description: string }>> = {
  I18nPageScannerJob: {
    tr: { title: "Admin i18n tarayıcı", description: "Admin .tsx sayfalarını tarar, güvenli modda anahtar önerileri üretir." },
    en: { title: "Admin i18n scanner", description: "Scans admin .tsx pages and produces safe key suggestions." },
    de: { title: "Admin-i18n-Scanner", description: "Durchsucht Admin-.tsx-Seiten und erzeugt sichere Schlüsselvorschläge." },
    es: { title: "Escáner i18n de admin", description: "Analiza páginas .tsx de admin y genera sugerencias seguras de claves." },
  },
  I18nDictionaryBuilderJob: {
    tr: { title: "Admin i18n sözlük oluşturucu", description: "Admin ekranları için sözlük çıktısını üretir." },
    en: { title: "Admin i18n dictionary builder", description: "Builds the dictionary output for admin screens." },
    de: { title: "Admin-i18n-Wörterbuchgenerator", description: "Erstellt das Wörterbuch für Admin-Bildschirme." },
    es: { title: "Generador de diccionario i18n de admin", description: "Genera el diccionario para las pantallas de admin." },
  },
  CustomerI18nPageScannerJob: {
    tr: { title: "Customer i18n tarayıcı", description: "Customer ekranlarını tarar, güvenli modda log/cache raporu üretir." },
    en: { title: "Customer i18n scanner", description: "Scans customer screens and produces safe log/cache reports." },
    de: { title: "Customer-i18n-Scanner", description: "Durchsucht Kundenbildschirme und erzeugt sichere Log-/Cache-Berichte." },
    es: { title: "Escáner i18n de customer", description: "Analiza pantallas de cliente y genera informes seguros de log/caché." },
  },
  CustomerI18nDictionaryBuilderJob: {
    tr: { title: "Customer i18n sözlük oluşturucu", description: "Customer ekranları için sözlük çıktısını üretir." },
    en: { title: "Customer i18n dictionary builder", description: "Builds the dictionary output for customer screens." },
    de: { title: "Customer-i18n-Wörterbuchgenerator", description: "Erstellt das Wörterbuch für Kundenbildschirme." },
    es: { title: "Generador de diccionario i18n de customer", description: "Genera el diccionario para las pantallas de cliente." },
  },
  FrontendHealthJob: {
    tr: { title: "Frontend sağlık kontrolü", description: "Customer ve Admin servislerinin HTTP sağlık durumunu denetler." },
    en: { title: "Frontend health check", description: "Checks the HTTP health of Customer and Admin services." },
    de: { title: "Frontend-Gesundheitsprüfung", description: "Prüft den HTTP-Zustand von Customer- und Admin-Diensten." },
    es: { title: "Comprobación de salud del frontend", description: "Comprueba la salud HTTP de los servicios Customer y Admin." },
  },
  ModuleHealthCheckJob: {
    tr: { title: "Modül sağlık kontrolü", description: "Modül sağlık durumlarını kontrol eder, sorun varsa uyarı gönderir." },
    en: { title: "Module health check", description: "Checks module health and sends alerts if something is wrong." },
    de: { title: "Modul-Gesundheitsprüfung", description: "Prüft den Modulzustand und sendet Warnungen bei Problemen." },
    es: { title: "Comprobación de salud del módulo", description: "Verifica la salud de los módulos y envía alertas si hay problemas." },
  },
  QueueMonitorJob: {
    tr: { title: "Kuyruk izleme", description: "Outbox, saga ve RabbitMQ istatistiklerini izler." },
    en: { title: "Queue monitor", description: "Monitors Outbox, saga, and RabbitMQ statistics." },
    de: { title: "Queue-Überwachung", description: "Überwacht Outbox-, Saga- und RabbitMQ-Statistiken." },
    es: { title: "Monitor de colas", description: "Supervisa estadísticas de Outbox, saga y RabbitMQ." },
  },
  SystemHealthJob: {
    tr: { title: "Sistem sağlık kontrolü", description: "Servis sağlık durumlarını kontrol eder." },
    en: { title: "System health check", description: "Checks service health states." },
    de: { title: "System-Gesundheitsprüfung", description: "Prüft den Gesundheitszustand der Dienste." },
    es: { title: "Comprobación de salud del sistema", description: "Comprueba el estado de salud de los servicios." },
  },
  StockAlertJob: {
    tr: { title: "Stok uyarı job'ı", description: "Kritik stok altındaki ürünleri kontrol eder ve toplu e-posta gönderir." },
    en: { title: "Stock alert job", description: "Checks critical stock items and sends a batch email." },
    de: { title: "Lagerwarnungs-Job", description: "Prüft kritische Lagerstände und sendet eine Sammel-E-Mail." },
    es: { title: "Job de alerta de stock", description: "Revisa productos críticos y envía un correo masivo." },
  },
  DocsRefreshJob: {
    tr: { title: "Doküman yenileme", description: "Dokümanlar sekmesi için GitHub önbelleğini yeniler." },
    en: { title: "Docs refresh", description: "Refreshes the GitHub cache for the Documents tab." },
    de: { title: "Dokumenten-Aktualisierung", description: "Aktualisiert den GitHub-Cache für den Dokumente-Tab." },
    es: { title: "Actualización de documentos", description: "Renueva la caché de GitHub para la pestaña Documentos." },
  },
  TodoVerificationJob: {
    tr: { title: "TODO doğrulama", description: "TODO_DONE.md maddelerini doğrular ve VERIFICATION_LOG.md'ye yazar." },
    en: { title: "TODO verification", description: "Verifies TODO_DONE.md items and writes VERIFICATION_LOG.md." },
    de: { title: "TODO-Verifizierung", description: "Überprüft TODO_DONE.md-Einträge und schreibt nach VERIFICATION_LOG.md." },
    es: { title: "Verificación de TODO", description: "Verifica elementos de TODO_DONE.md y escribe en VERIFICATION_LOG.md." },
  },
  AdminLintAuditJob: {
    tr: { title: "Admin lint denetimi", description: "Admin panel lint uyarılarını tarar ve öncelikli aksiyonları yazar." },
    en: { title: "Admin lint audit", description: "Scans admin lint warnings and writes prioritized actions." },
    de: { title: "Admin-Lint-Audit", description: "Scannt Admin-Lint-Warnungen und schreibt priorisierte Aktionen." },
    es: { title: "Auditoría de lint de admin", description: "Analiza advertencias de lint del admin y escribe acciones prioritarias." },
  },
  BusinessProcessDocsJob: {
    tr: { title: "İş süreçleri dokümanı", description: "İş süreçleri belgesini otomatik günceller." },
    en: { title: "Business process docs", description: "Automatically updates the business process document." },
    de: { title: "Geschäftsprozess-Dokumente", description: "Aktualisiert das Geschäftsprozessdokument automatisch." },
    es: { title: "Documentos de proceso de negocio", description: "Actualiza automáticamente el documento de procesos de negocio." },
  },
  TechAnalysisDocsJob: {
    tr: { title: "Teknik analiz dokümanı", description: "Teknik Analiz belgesini otomatik günceller." },
    en: { title: "Technical analysis docs", description: "Automatically updates the Technical Analysis document." },
    de: { title: "Technische Analyse-Dokumente", description: "Aktualisiert das Dokument zur technischen Analyse automatisch." },
    es: { title: "Documentos de análisis técnico", description: "Actualiza automáticamente el documento de análisis técnico." },
  },
  WorkNotesDocsJob: {
    tr: { title: "Çalışma notları dokümanı", description: "Son iş logları ve hatalardan Çalışma Notları belgesini günceller." },
    en: { title: "Work notes docs", description: "Updates Work Notes from recent logs and errors." },
    de: { title: "Arbeitsnotizen-Dokumente", description: "Aktualisiert die Arbeitsnotizen aus letzten Logs und Fehlern." },
    es: { title: "Documentos de notas de trabajo", description: "Actualiza las Notas de trabajo desde logs y errores recientes." },
  },
  ChangelogDocsJob: {
    tr: { title: "Değişiklik günlüğü", description: "Git geçmişinden değişiklik günlüğünü otomatik günceller." },
    en: { title: "Changelog docs", description: "Automatically updates the changelog from Git history." },
    de: { title: "Änderungsprotokoll", description: "Aktualisiert das Änderungsprotokoll automatisch aus dem Git-Verlauf." },
    es: { title: "Registro de cambios", description: "Actualiza automáticamente el changelog desde el historial Git." },
  },
  AuditLogRetentionJob: {
    tr: { title: "Audit log temizleme", description: "Eski denetim loglarını temizler." },
    en: { title: "Audit log retention", description: "Cleans old audit logs." },
    de: { title: "Audit-Log-Aufbewahrung", description: "Bereinigt alte Audit-Logs." },
    es: { title: "Retención de audit logs", description: "Limpia registros antiguos de auditoría." },
  },
  ErrorLogRetentionJob: {
    tr: { title: "Hata log temizleme", description: "Eski hata loglarını temizler." },
    en: { title: "Error log retention", description: "Cleans old error logs." },
    de: { title: "Fehlerprotokoll-Aufbewahrung", description: "Bereinigt alte Fehlerprotokolle." },
    es: { title: "Retención de logs de error", description: "Limpia logs de error antiguos." },
  },
  SessionCleanupJob: {
    tr: { title: "Oturum temizleme", description: "Süresi dolmuş misafir sepetlerini ve oturum verilerini temizler." },
    en: { title: "Session cleanup", description: "Cleans expired guest carts and session data." },
    de: { title: "Sitzungsbereinigung", description: "Bereinigt abgelaufene Gastwarenkörbe und Sitzungsdaten." },
    es: { title: "Limpieza de sesiones", description: "Limpia carritos de invitado y datos de sesión caducados." },
  },
  TokenCleanupJob: {
    tr: { title: "Refresh token temizleme", description: "Süresi dolmuş refresh token kayıtlarını temizler." },
    en: { title: "Refresh token cleanup", description: "Cleans expired refresh token records." },
    de: { title: "Refresh-Token-Bereinigung", description: "Bereinigt abgelaufene Refresh-Token-Einträge." },
    es: { title: "Limpieza de refresh tokens", description: "Limpia registros caducados de refresh token." },
  },
  PasswordReminderJob: {
    tr: { title: "Şifre hatırlatma", description: "Şifresini değiştirmeyen kullanıcılara e-posta ve Telegram hatırlatması gönderir." },
    en: { title: "Password reminder", description: "Sends email and Telegram reminders to users who haven't changed passwords." },
    de: { title: "Passwort-Erinnerung", description: "Sendet E-Mail- und Telegram-Erinnerungen an Nutzer ohne Passwortwechsel." },
    es: { title: "Recordatorio de contraseña", description: "Envía recordatorios por correo y Telegram a quienes no cambiaron su contraseña." },
  },
  VerificationReminderJob: {
    tr: { title: "Doğrulama hatırlatma", description: "Doğrulanmamış hesaplara e-posta ve Telegram hatırlatması gönderir." },
    en: { title: "Verification reminder", description: "Sends email and Telegram reminders to unverified accounts." },
    de: { title: "Verifizierungs-Erinnerung", description: "Sendet Erinnerungen an nicht verifizierte Konten per E-Mail und Telegram." },
    es: { title: "Recordatorio de verificación", description: "Envía recordatorios por correo y Telegram a cuentas no verificadas." },
  },
  OutboxRetryJob: {
    tr: { title: "Outbox yeniden deneme", description: "Başarısız outbox mesajlarını yeniden kuyruğa alır." },
    en: { title: "Outbox retry", description: "Re-queues failed outbox messages." },
    de: { title: "Outbox-Wiederholungsjob", description: "Stellt fehlgeschlagene Outbox-Nachrichten erneut in die Warteschlange." },
    es: { title: "Reintento de outbox", description: "Vuelve a encolar mensajes fallidos de outbox." },
  },
  TestSyncJob: {
    tr: { title: "Test senkronizasyonu", description: "Test ekranındaki endpoint listesini kodla senkronize eder." },
    en: { title: "Test sync", description: "Synchronizes the endpoint list with code for the Test screen." },
    de: { title: "Testsynchronisierung", description: "Synchronisiert die Endpunktliste mit dem Code für den Test-Bildschirm." },
    es: { title: "Sincronización de pruebas", description: "Sincroniza la lista de endpoints con el código para la pantalla Test." },
  },
  I18nScreenProgressJob: {
    tr: { title: "i18n ekran ilerleme takibi", description: "Admin ve Customer ekranlarını sırayla tarar, değişimi algılar, ilerlemeyi JSON dosyasına kaydeder." },
    en: { title: "i18n screen progress tracker", description: "Scans admin and customer screens incrementally, detects changes, saves progress to JSON file." },
    de: { title: "i18n-Bildschirmfortschrittsverfolgung", description: "Durchsucht Admin- und Customer-Screens schrittweise, erkennt Änderungen und speichert Fortschritt." },
    es: { title: "Seguimiento de progreso i18n", description: "Analiza pantallas de admin y customer incrementalmente, detecta cambios y guarda el progreso." },
  },
};

function normalizeLang(lang: Lang): UiLang {
  return (lang === "tr" || lang === "en" || lang === "de" || lang === "es") ? lang : "en";
}

function getJobMeta(jobName: string, lang: Lang) {
  const normalized = normalizeLang(lang);
  return JOB_META[jobName]?.[normalized] ?? {
    title: jobName,
    description: jobName,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

function intervalLabel(minutes: number, lang: Lang) {
  const l = normalizeLang(lang);
  if (l === "tr") {
    if (minutes < 60) return `${minutes} dk`;
    if (minutes === 60) return "1 sa";
    if (minutes < 1440) return `${minutes / 60} sa`;
    if (minutes === 1440) return "Günlük";
    return `${Math.round(minutes / 1440)} gün`;
  }
  if (l === "de") {
    if (minutes < 60) return `${minutes} Min.`;
    if (minutes === 60) return "1 Std.";
    if (minutes < 1440) return `${minutes / 60} Std.`;
    if (minutes === 1440) return "Täglich";
    return `${Math.round(minutes / 1440)} Tage`;
  }
  if (l === "es") {
    if (minutes < 60) return `${minutes} min`;
    if (minutes === 60) return "1 h";
    if (minutes < 1440) return `${minutes / 60} h`;
    if (minutes === 1440) return "Diario";
    return `${Math.round(minutes / 1440)} días`;
  }
  if (minutes < 60) return `${minutes} min`;
  if (minutes === 60) return "1 h";
  if (minutes < 1440) return `${minutes / 60} h`;
  if (minutes === 1440) return "Daily";
  return `${Math.round(minutes / 1440)} days`;
}

function timeAgo(dt: string | null, lang: Lang) {
  if (!dt) return "—";
  const diff = Date.now() - new Date(dt).getTime();
  const s = Math.floor(diff / 1000);
  const l = normalizeLang(lang);
  if (l === "tr") {
    if (s < 60) return `${s}s önce`;
    if (s < 3600) return `${Math.floor(s / 60)}dk önce`;
    if (s < 86400) return `${Math.floor(s / 3600)}sa önce`;
    return `${Math.floor(s / 86400)}g önce`;
  }
  if (l === "de") {
    if (s < 60) return `vor ${s}s`;
    if (s < 3600) return `vor ${Math.floor(s / 60)} Min.`;
    if (s < 86400) return `vor ${Math.floor(s / 3600)} Std.`;
    return `vor ${Math.floor(s / 86400)} Tg.`;
  }
  if (l === "es") {
    if (s < 60) return `hace ${s}s`;
    if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
    if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
    return `hace ${Math.floor(s / 86400)} d`;
  }
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtDate(dt: string | null, lang: Lang) {
  if (!dt) return "—";
  const l = normalizeLang(lang);
  const locale = l === "tr" ? "tr-TR" : l === "de" ? "de-DE" : l === "es" ? "es-ES" : "en-US";
  return new Date(dt).toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  if (status === "success") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={11} /> {t("status.success", "Başarılı")}
    </span>
  );
  if (status === "failed") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      <XCircle size={11} /> {t("status.failed", "Başarısız")}
    </span>
  );
  if (status === "running") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      <Loader2 size={11} className="animate-spin" /> {t("status.running", "Çalışıyor")}
    </span>
  );
  return <span className="text-xs text-slate-400">{status}</span>;
}

// ── SSE Terminal Modal ────────────────────────────────────────────────────────

function TerminalModal({ jobName, onClose }: { jobName: string; onClose: () => void }) {
  const { t, lang } = useI18n();
  const meta = getJobMeta(jobName, lang);
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
          setLines([t("auto.streamBaslatilamadi", "⚠ Stream başlatılamadı.")]);
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
              setLines([t("auto.jobCalismiyor", "⚠ Job şu anda çalışmıyor. 'Çalıştır' butonuna tıklayın.")]);
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
      } catch {
        if (!abortCtrl.signal.aborted) {
          setLines(prev => [...prev, t("auto.baglantiKesildi", "⚠ Bağlantı kesildi.")]);
          setDone(true);
        }
      }
    })();

    return () => abortCtrl.abort();
  }, [jobName, t]);

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
            <span className="text-sm font-semibold text-white">{meta.title}</span>
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
            <span className="text-slate-600">{t("auto.baglaniliyor", "Bağlanılıyor...")}</span>
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
            {finalStatus === "success" ? t("auto.jobTamamlandi", "Job başarıyla tamamlandı") :
             finalStatus === "failed" ? t("auto.jobBasarisiz", "Job başarısız oldu") :
             t("auto.jobDurdu", "Job durdu")}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Job History Modal ─────────────────────────────────────────────────────────

function HistoryModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const { t, lang } = useI18n();
  const meta = getJobMeta(job.name, lang);
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

  useEffect(() => {
    const id = window.setTimeout(() => { void load(1); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

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
              {meta.title} — {t("auto.calismaGecmisi", "Çalışma Geçmişi")}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
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
                <span>{fmtDate(selectedLog.startedAt, lang)}</span>
                <span>·</span>
                <span>{fmtDuration(selectedLog.durationMs)}</span>
                {selectedLog.isManualTrigger && <span className="px-1.5 py-0.5 bg-violet-900/40 text-violet-300 rounded text-[10px]">{t("auto.manuel", "Manuel")}</span>}
              </div>
              <button onClick={() => { setSelectedLog(null); setLogOutput(null); }}
                className="text-slate-600 hover:text-white transition text-xs">
                <X size={14} />
              </button>
            </div>
            <div className="font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {logOutput ?? <span className="text-slate-600">{t("action.loading", "Yükleniyor...")}</span>}
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
              <p className="text-sm">{t("auto.calismaKaydiYok", "Henüz çalışma kaydı yok")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("auto.baslangic", "Başlangıç")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("col.status", "Durum")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("col.duration", "Süre")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("col.type", "Tür")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.logs.map(log => (
                  <tr key={log.id}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedLog?.id === log.id ? "bg-teal-50" : ""}`}
                    onClick={() => openLog(log)}
                  >
                    <td className="px-6 py-3 text-slate-700 font-mono text-xs">{fmtDate(log.startedAt, lang)}</td>
                    <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{fmtDuration(log.durationMs)}</td>
                    <td className="px-4 py-3">
                      {log.isManualTrigger
                        ? <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-medium">{t("auto.manuel", "Manuel")}</span>
                        : <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{t("auto.otomatik", "Otomatik")}</span>}
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
            <span className="text-xs text-slate-500">{data?.total ?? 0} {t("table.perPage", "kayıt")}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {t("table.prev", "← Önceki")}
              </button>
              <span className="text-xs text-slate-600 font-medium">{page} / {totalPages}</span>
              <button
                onClick={() => load(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {t("table.next", "Sonraki →")}
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
  const { t, lang } = useI18n();
  const meta = getJobMeta(job.name, lang);
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
              <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate">{meta.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{meta.description}</p>
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
                <span className="text-[10px] text-slate-400">{lang === "tr" ? "dk" : lang === "de" ? "Min." : lang === "es" ? "min" : "min"}</span>
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
                title={t("auto.araligDuzenle", "Aralığı düzenle")}
                className="group inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full border border-slate-200 transition-colors"
              >
                <Timer size={10} />
                {intervalLabel(job.intervalMinutes, lang)}
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
            <span>{t("auto.sonCalisma", "Son Çalışma")}: {timeAgo(state?.lastRunAt ?? null, lang)}</span>
          </div>
          {state && (
            <div className="flex items-center gap-1">
              <Activity size={11} />
              <span>{state.runCount} {t("auto.calisma", "çalışma")}</span>
            </div>
          )}
          {isRunning && (
            <span className="flex items-center gap-1 text-blue-600 font-medium">
              <Loader2 size={11} className="animate-spin" /> {t("status.running", "Çalışıyor")}...
            </span>
          )}
          {isPaused && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Pause size={11} /> {t("auto.duraklatildi", "Duraklatıldı")}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Trigger */}
          <button
            onClick={handleTrigger}
            disabled={isRunning || triggering || isPaused}
            title={t("auto.manuelCalistir", "Manuel Çalıştır")}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {triggering || isRunning ? (
              <><Loader2 size={12} className="animate-spin" /> {t("status.running", "Çalışıyor")}</>
            ) : (
              <><Zap size={12} /> {t("action.run", "Çalıştır")}</>
            )}
          </button>

          {/* Watch live */}
          <button
            onClick={onOpenTerminal}
            title={t("auto.canliLog", "Canlı log")}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Terminal size={12} /> {lang === "tr" ? "Log" : lang === "de" ? "Protokoll" : lang === "es" ? "Registro" : "Log"}
          </button>

          {/* History */}
          <button
            onClick={onOpenHistory}
            title={t("auto.calismaGecmisi", "Çalışma Geçmişi")}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <History size={12} />
          </button>

          {/* Pause/Resume */}
          <button
            onClick={onToggle}
            title={isPaused ? t("auto.devamEt", "Devam Et") : t("action.hold", "Duraklat")}
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

function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel, confirmClass = "bg-teal-600 hover:bg-teal-700 text-white" }: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmClass?: string;
}) {
  const { t } = useI18n();
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
            {t("action.cancel", "İptal")}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition ${confirmClass}`}
          >
            {confirmLabel ?? t("action.confirm", "Onayla")}
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
  const { t, lang } = useI18n();
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
  const [intervalDrafts, setIntervalDrafts] = useState<Record<string, string>>({});
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const getMeta = useCallback((jobName: string) => getJobMeta(jobName, lang), [lang]);

  function showToast(message: string, type: "success" | "error" | "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const loadJobs = useCallback(async () => {
    try {
      const data = await api.get<Job[]>("/api/admin/jobs");
      setJobs(data);
      setIntervalDrafts(Object.fromEntries(data.map(job => [job.name, String(job.intervalMinutes)])));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("auto.jobllarYuklenemedi", "Joblar yüklenemedi"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadJobs();
      refreshRef.current = setInterval(loadJobs, 5000);
    }, 0);
    return () => {
      window.clearTimeout(id);
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [loadJobs]);

  async function handleTrigger(job: Job) {
    try {
      await api.post(`/api/admin/jobs/${encodeURIComponent(job.name)}/trigger`, {});
      showToast(`${getMeta(job.name).title} ${t("auto.kuyrugaAlindi", "kuyruğa alındı")}`, "info");
      setTimeout(loadJobs, 800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("auto.tetiklemeBasarisiz", "Tetikleme başarısız");
      showToast(msg, "error");
      throw e;
    }
  }

  async function handleTriggerAll() {
    setConfirmTriggerAll(false);
    try {
      const r = await api.post<{ triggered: string[]; skipped: string[] }>("/api/admin/jobs/trigger-all", {});
      showToast(`${r.triggered.length} ${t("auto.jobKuyrugaAlindi", "job kuyruğa alındı")}${r.skipped.length ? `, ${r.skipped.length} ${t("auto.atlandi", "atlandı")}` : ""}`, "info");
      setTimeout(loadJobs, 1000);
    } catch {
      showToast(t("auto.islemBasarisiz", "İşlem başarısız"), "error");
    }
  }

  async function handleUpdateInterval(job: Job, minutes: number) {
    await api.put(`/api/admin/jobs/${encodeURIComponent(job.name)}`, { intervalMinutes: minutes });
    showToast(`${getMeta(job.name).title} ${t("auto.araligGuncellendi", "aralığı")} ${intervalLabel(minutes, lang)} ${t("auto.olarakGuncellendi", "olarak güncellendi")}`, "success");
    await loadJobs();
  }

  async function handleToggle(job: Job) {
    try {
      const result = await api.put<{ paused: boolean }>(`/api/admin/jobs/${encodeURIComponent(job.name)}/toggle`, {});
      showToast(result.paused ? `${getMeta(job.name).title} ${t("auto.duraklatildi", "Duraklatıldı")}` : `${getMeta(job.name).title} ${t("auto.devamEttirildi", "devam ettirildi")}`, "success");
      await loadJobs();
    } catch {
      showToast(t("auto.islemBasarisiz", "İşlem başarısız"), "error");
    }
    setConfirmToggle(null);
  }

  const filteredJobs = jobs.filter(j => {
    const meta = getMeta(j.name);
    if (search) {
      const haystack = `${j.name} ${j.description} ${meta.title} ${meta.description}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    if (filter === "running") return j.state?.isRunning;
    if (filter === "paused") return j.state?.isPaused;
    if (filter === "failed") return j.state?.lastRunSuccess === false;
    return true;
  });

  const runningCount = jobs.filter(j => j.state?.isRunning).length;
  const pausedCount = jobs.filter(j => j.state?.isPaused).length;
  const failedCount = jobs.filter(j => j.state?.lastRunSuccess === false && !j.state?.isRunning).length;

  async function saveConfigInterval(job: Job) {
    const raw = intervalDrafts[job.name] ?? String(job.intervalMinutes);
    const v = parseInt(raw, 10);
    if (Number.isNaN(v) || v < 1 || v > 10080) {
      showToast(t("auto.gecersizAralik", "Geçersiz aralık"), "error");
      setIntervalDrafts(prev => ({ ...prev, [job.name]: String(job.intervalMinutes) }));
      return;
    }
    await handleUpdateInterval(job, v);
  }

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
        <RotateCcw size={14} /> {t("action.refresh", "Yenile")}
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
            {jobs.length} {t("auto.jobKayitli", "job kayıtlı")}
            {runningCount > 0 && <> · <span className="text-blue-600 font-medium">{runningCount} {t("auto.calisiyor", "çalışıyor")}</span></>}
            {pausedCount > 0 && <> · <span className="text-amber-600 font-medium">{pausedCount} {t("auto.duraklatilmis", "duraklatılmış")}</span></>}
            {failedCount > 0 && <> · <span className="text-red-600 font-medium">{failedCount} {t("auto.hatali", "hatalı")}</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmTriggerAll(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Zap size={14} /> {t("auto.hepsiniCalistir", "Hepsini Çalıştır")}
          </button>
          <button
            onClick={loadJobs}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} /> {t("action.refresh", "Yenile")}
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity size={16} className="text-teal-500" />
              {t("auto.jobKonfigAlani", "Çalışma Konfigürasyonu")}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t("auto.jobKonfigAlaniAciklama", "Aralık, duraklatma ve manuel çalıştırma ayarlarını bu tablodan yönetin. i18n davranışını ayrıntılı yönetmek için Yönetim > Otomasyon sekmesini kullanın.")}
            </p>
          </div>
          <button
            onClick={loadJobs}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <RefreshCw size={13} /> {t("action.refresh", "Yenile")}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">{t("auto.job", "Job")}</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">{t("auto.aralik", "Aralık")}</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">{t("col.status", "Durum")}</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">{t("auto.sonCalisma", "Son Çalışma")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map(job => {
                const state = job.state;
                const draft = intervalDrafts[job.name] ?? String(job.intervalMinutes);
                return (
                  <tr key={job.name} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 align-top">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{getMeta(job.name).title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{getMeta(job.name).description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={10080}
                          value={draft}
                          onChange={e => setIntervalDrafts(prev => ({ ...prev, [job.name]: e.target.value }))}
                          className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <span className="text-[11px] text-slate-400">{lang === "tr" ? "dk" : lang === "de" ? "Min." : lang === "es" ? "min" : "min"}</span>
                        <button
                          onClick={() => saveConfigInterval(job)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
                        >
                          <Check size={11} /> {t("action.save", "Kaydet")}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {state?.isRunning ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full font-medium">
                          <Loader2 size={11} className="animate-spin" /> {t("status.running", "Çalışıyor")}
                        </span>
                      ) : state?.isPaused ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full font-medium">
                          <Pause size={11} /> {t("auto.duraklatildi", "Duraklatıldı")}
                        </span>
                      ) : state?.lastRunSuccess === false ? (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full font-medium">
                          <XCircle size={11} /> {t("auto.hatali", "Hatalı")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full font-medium">
                          <Timer size={11} /> {t("auto.hazir", "Hazır")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-600">{timeAgo(state?.lastRunAt ?? null, lang)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("auto.jobAra", "Job ara...")}
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
            {f === "all" ? t("filter.all", "Tümü") : f === "running" ? `${t("auto.calısanlar", "Çalışanlar")} (${runningCount})` : f === "paused" ? `${t("auto.duraklatilmis", "Duraklatılmış")} (${pausedCount})` : `${t("auto.hatali", "Hatalı")} (${failedCount})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Clock size={40} className="opacity-30" />
          <p className="text-sm">{t("auto.filtreEslesmedi", "Filtreyle eşleşen job bulunamadı")}</p>
          <button onClick={() => { setFilter("all"); setSearch(""); }} className="text-xs text-teal-600 hover:underline">{t("filter.clearFilters", "Filtreleri Temizle")}</button>
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
          title={t("auto.hepsiniCalistir", "Hepsini Çalıştır")}
          message={`${t("auto.confirmTriggerAllMsg", "Duraklatılmış ve zaten çalışan joblar hariç tüm joblar kuyruğa alınacak")} (${jobs.filter(j => !j.state?.isPaused && !j.state?.isRunning).length} job). ${t("auto.devamMi", "Devam?")}`}
          confirmLabel={t("auto.tumunuCalistir", "Tümünü Çalıştır")}
          confirmClass="bg-teal-600 hover:bg-teal-700 text-white"
          onConfirm={handleTriggerAll}
          onCancel={() => setConfirmTriggerAll(false)}
        />
      )}
      {confirmToggle && (
        <ConfirmModal
          title={confirmToggle.state?.isPaused ? t("auto.jobDevamEttir", "Job'u devam ettir") : t("auto.jobDuraklat", "Job'u duraklat")}
          message={
            confirmToggle.state?.isPaused
              ? `${confirmToggle.name} ${t("auto.confirmResumeMsg", "job'u yeniden zamanlamaya alınsın mı? Bir sonraki periyotta otomatik çalışmaya başlayacak.")}`
              : `${confirmToggle.name} ${t("auto.confirmPauseMsg", "job'u duraklatılsın mı? Manuel tetiklenene veya devam ettirilene kadar çalışmayacak.")}`
          }
          confirmLabel={confirmToggle.state?.isPaused ? t("auto.devamEt", "Devam Et") : t("action.hold", "Duraklat")}
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
