"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Package, Server, Database, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Save, Loader2, Settings, Globe, Shield } from "lucide-react";

const CARD = "bg-white rounded-xl border border-slate-200 p-5";
const INPUT = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const BTN_PRIMARY = "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

interface VersionInfo {
  api: { version: string; environment: string };
  customer: { version: string; template: string };
  maintenance: boolean;
  db: { lastAppliedMigration: string | null; pendingMigrations: string | null };
  generatedAt: string;
}

interface Settings {
  CustomerVersion?: string;
  CustomerTemplate?: string;
  MaintenanceMode?: string;
  Msg_MaintenanceMode?: string;
  [key: string]: string | undefined;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {label}
    </span>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs text-slate-800 text-right break-all ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}

export default function VersiyonlarPage() {
  const [info, setInfo] = useState<VersionInfo | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerVersion, setCustomerVersion] = useState("");
  const [maintenanceMsgEdit, setMaintenanceMsgEdit] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vInfo, sData] = await Promise.all([
        api("/api/version") as Promise<VersionInfo>,
        api("/api/admin/settings") as Promise<Settings>,
      ]);
      setInfo(vInfo);
      setSettings(sData);
      setCustomerVersion(sData.CustomerVersion ?? "1.0.0");
      setMaintenanceMsgEdit(sData.Msg_MaintenanceMode ?? "Site bakım çalışması yapılıyor. Lütfen daha sonra tekrar deneyin.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Veri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveVersionSettings() {
    setSaving(true);
    setSaved(false);
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          ...settings,
          CustomerVersion: customerVersion,
          Msg_MaintenanceMode: maintenanceMsgEdit,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
    } catch {
      setError("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleMaintenance() {
    const next = settings.MaintenanceMode === "true" ? "false" : "true";
    setSaving(true);
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ ...settings, MaintenanceMode: next }),
      });
      await load();
    } catch {
      setError("Bakım modu değiştirilemedi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Yükleniyor…</span>
      </div>
    );
  }

  const isMaintenance = settings.MaintenanceMode === "true";
  const hasPending = !!info?.db.pendingMigrations;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Versiyon Yönetimi</h1>
          <p className="text-sm text-slate-500 mt-0.5">Sistem bileşenlerinin versiyon bilgileri ve bakım modu kontrolü</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
          <RefreshCw size={14} />
          Yenile
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Bakım Modu */}
      <div className={`${CARD} ${isMaintenance ? "border-red-300 bg-red-50" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isMaintenance ? "bg-red-100" : "bg-slate-100"}`}>
              <Shield size={18} className={isMaintenance ? "text-red-600" : "text-slate-500"} />
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">Bakım Modu</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {isMaintenance
                  ? "Aktif — Müşteri ekranlarına erişim engellendi"
                  : "Pasif — Müşteri ekranları normal çalışıyor"}
              </div>
            </div>
          </div>
          <button
            onClick={toggleMaintenance}
            disabled={saving}
            className={`relative w-12 h-6 rounded-full transition-colors ${isMaintenance ? "bg-red-500" : "bg-slate-300"}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isMaintenance ? "left-7" : "left-1"}`} />
          </button>
        </div>
        {isMaintenance && (
          <div className="mt-4 space-y-2">
            <label className="block text-xs font-medium text-slate-600">Bakım Mesajı</label>
            <textarea
              className={`${INPUT} resize-none`}
              rows={2}
              value={maintenanceMsgEdit}
              onChange={e => setMaintenanceMsgEdit(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Versiyon Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API */}
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-3">
            <Server size={16} className="text-blue-500" />
            <span className="font-semibold text-slate-700 text-sm">API</span>
            <StatusBadge ok label={`v${info?.api.version ?? "?"}`} />
          </div>
          <InfoRow label="Sürüm" value={`v${info?.api.version}`} mono />
          <InfoRow label="Ortam" value={info?.api.environment} />
          <InfoRow label="Oluşturuldu" value={info?.generatedAt ? new Date(info.generatedAt).toLocaleTimeString("tr-TR") : "—"} />
        </div>

        {/* Müşteri Frontend */}
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-purple-500" />
            <span className="font-semibold text-slate-700 text-sm">Müşteri Ekranı</span>
            <StatusBadge ok label={`v${info?.customer.version ?? "?"}`} />
          </div>
          <InfoRow label="Sürüm" value={`v${info?.customer.version}`} mono />
          <InfoRow label="Şablon" value={info?.customer.template} />
          <div className="mt-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Versiyon Güncelle</label>
            <input
              className={INPUT}
              value={customerVersion}
              onChange={e => setCustomerVersion(e.target.value)}
              placeholder="örn: 1.0.0"
            />
          </div>
        </div>

        {/* Veritabanı */}
        <div className={`${CARD} ${hasPending ? "border-yellow-300" : ""}`}>
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className={hasPending ? "text-yellow-500" : "text-green-500"} />
            <span className="font-semibold text-slate-700 text-sm">Veritabanı</span>
            <StatusBadge ok={!hasPending} label={hasPending ? "Bekleyen" : "Güncel"} />
          </div>
          <InfoRow label="Son Migrasyon" value={info?.db.lastAppliedMigration?.replace(/^\d{14}_/, "") ?? "—"} mono />
          {hasPending && (
            <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
              Bekleyen: {info?.db.pendingMigrations}
            </div>
          )}
          <InfoRow label="Durum" value={hasPending ? `${info?.db.pendingMigrations?.split(",").length ?? 1} bekleyen migrasyon` : "Tüm migrasyonlar uygulandı"} />
        </div>
      </div>

      {/* Aktif Ayarlar Özeti */}
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={16} className="text-slate-500" />
          <span className="font-semibold text-slate-700 text-sm">Aktif Sistem Ayarları</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Şablon</div>
            <div className="font-semibold text-slate-800 text-sm">{settings.CustomerTemplate || "modern"}</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Müşteri Versiyonu</div>
            <div className="font-semibold text-slate-800 text-sm font-mono">{settings.CustomerVersion || "1.0.0"}</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Bakım Modu</div>
            <div className={`font-semibold text-sm ${isMaintenance ? "text-red-600" : "text-green-600"}`}>
              {isMaintenance ? "Aktif" : "Pasif"}
            </div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">API Sürümü</div>
            <div className="font-semibold text-slate-800 text-sm font-mono">v{info?.api.version || "—"}</div>
          </div>
        </div>
      </div>

      {/* Kaydet */}
      <div className="flex items-center gap-3">
        <button onClick={saveVersionSettings} disabled={saving} className={BTN_PRIMARY}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Kaydediliyor…" : "Versiyon Ayarlarını Kaydet"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 size={14} />
            Kaydedildi
          </span>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Müşteri versiyonu, admin paneli versiyon takibi içindir — mağaza işlevini etkilemez.
        Bakım modunu etkinleştirdiğinizde, tüm müşteri sayfaları bakım ekranı gösterir.
      </p>
    </div>
  );
}
