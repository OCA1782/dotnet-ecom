"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  Mail, Loader2, CheckCircle, Eye,
  Save, RotateCcw, AlertTriangle, Info,
  Zap, Clock, Code2, Server, Globe, KeyRound, X,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────── */
type MailTemplate = {
  id: string;
  name: string;
  displayName: string;
  source: string;
  sourceDetail: string;
  trigger: string;
  triggerPath: string;
  subject: string;
  bodyHtml: string;
  defaultBodyHtml: string;
  fromName: string;
  fromAddress: string;
  ccEmails: string;
  bccEmails: string;
  variables: string;
  sampleVariables: string;
  isBodyEditable: boolean;
  isEnabled: boolean;
  updatedAt: string;
  hasBodyOverride?: boolean;
};

type PreviewData = { subject: string; bodyHtml: string } | null;

/* ─── Source badge ────────────────────────────────────────────── */
function SourceBadge({ source }: { source: string }) {
  const cfg =
    source.includes("Job")      ? { bg: "bg-violet-100 text-violet-700", icon: <Clock size={10} /> } :
    source.includes("Consumer") ? { bg: "bg-blue-100 text-blue-700",     icon: <Zap size={10} /> }   :
    source.includes("Licen")    ? { bg: "bg-orange-100 text-orange-700", icon: <KeyRound size={10} /> } :
    source.includes("Admin")    ? { bg: "bg-teal-100 text-teal-700",     icon: <Server size={10} /> } :
    source.includes("Public")   ? { bg: "bg-slate-100 text-slate-600",   icon: <Globe size={10} /> }  :
                                  { bg: "bg-indigo-100 text-indigo-700", icon: <Code2 size={10} /> };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg}`}>
      {cfg.icon} {source}
    </span>
  );
}

/* ─── Textarea helper ─────────────────────────────────────────── */
const inp = "w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white";

export default function MaillerPage() {
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<MailTemplate | null>(null);
  const [editing, setEditing]     = useState<Partial<MailTemplate>>({});
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [resetting, setResetting] = useState(false);
  const [preview, setPreview]     = useState<PreviewData>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<MailTemplate[]>("/api/admin/mail-templates");
      setTemplates(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function selectTemplate(tpl: MailTemplate) {
    // Load full detail (includes bodyHtml)
    try {
      const detail = await api.get<MailTemplate>(`/api/admin/mail-templates/${tpl.name}`);
      setSelected(detail);
      setEditing({
        displayName:  detail.displayName,
        subject:      detail.subject,
        bodyHtml:     detail.bodyHtml,
        fromName:     detail.fromName,
        fromAddress:  detail.fromAddress,
        ccEmails:     detail.ccEmails,
        bccEmails:    detail.bccEmails,
        isEnabled:    detail.isEnabled,
      });
      setPreview(null);
      setPreviewOpen(false);
    } catch { /* ignore */ }
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/mail-templates/${selected.name}`, editing);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
      // Refresh selected
      const detail = await api.get<MailTemplate>(`/api/admin/mail-templates/${selected.name}`);
      setSelected(detail);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function reset() {
    if (!selected || !confirm("Şablonu varsayılan değerlere sıfırlamak istiyor musunuz?")) return;
    setResetting(true);
    try {
      await api.post(`/api/admin/mail-templates/${selected.name}/reset`, {});
      const detail = await api.get<MailTemplate>(`/api/admin/mail-templates/${selected.name}`);
      setSelected(detail);
      setEditing({
        displayName: detail.displayName, subject: detail.subject,
        bodyHtml: detail.bodyHtml, fromName: detail.fromName,
        fromAddress: detail.fromAddress, ccEmails: detail.ccEmails,
        bccEmails: detail.bccEmails, isEnabled: detail.isEnabled,
      });
      setPreview(null);
      await load();
    } catch { /* ignore */ }
    finally { setResetting(false); }
  }

  async function loadPreview() {
    if (!selected) return;
    setPreviewLoading(true);
    try {
      const data = await api.post<{ subject: string; bodyHtml: string }>(
        `/api/admin/mail-templates/${selected.name}/preview`, null
      );
      setPreview(data);
      setPreviewOpen(true);
    } catch { /* ignore */ }
    finally { setPreviewLoading(false); }
  }

  // Render preview into iframe when it opens
  useEffect(() => {
    if (previewOpen && preview && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) { doc.open(); doc.write(preview.bodyHtml); doc.close(); }
    }
  }, [previewOpen, preview]);

  const sources = [...new Set(templates.map(t => t.source.split("+")[0].trim()))];

  const filtered = templates.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q || t.displayName.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.source.toLowerCase().includes(q);
    const matchS = !filterSource || t.source.startsWith(filterSource);
    return matchQ && matchS;
  });

  let variables: string[] = [];
  if (selected) {
    try { variables = JSON.parse(selected.variables); } catch { variables = []; }
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-120px)] min-h-0">

      {/* ── Sol: şablon listesi ── */}
      <div className="w-80 shrink-0 flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mail Şablonları</h1>
          <p className="text-xs text-slate-500 mt-0.5">{templates.length} şablon — kaynak / tetikleyici / içerik yönetimi</p>
        </div>

        {/* Filtreler */}
        <div className="flex flex-col gap-2">
          <input
            placeholder="Şablon ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={inp}
          />
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className={inp}>
            <option value="">Tüm Kaynaklar</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
          ) : filtered.map(tpl => (
            <button key={tpl.name} onClick={() => void selectTemplate(tpl)}
              className={`w-full text-left p-3 rounded-xl border transition ${
                selected?.name === tpl.name
                  ? "border-teal-400 bg-teal-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-sm font-semibold text-slate-800 leading-tight">{tpl.displayName}</span>
                <span className={`shrink-0 w-2 h-2 rounded-full mt-1 ${tpl.isEnabled ? "bg-emerald-400" : "bg-red-400"}`} />
              </div>
              <SourceBadge source={tpl.source} />
              {tpl.hasBodyOverride && (
                <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Özel İçerik</span>
              )}
              <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-1">{tpl.trigger}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Sağ: detay / edit paneli ── */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <Mail size={40} strokeWidth={1} />
            <p className="text-sm">Sol listeden bir şablon seçin</p>
          </div>
        ) : (
          <div className="space-y-5 pb-8">

            {/* Başlık */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selected.displayName}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => void loadPreview()} disabled={previewLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-600 transition disabled:opacity-50">
                  {previewLoading ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />} Önizle
                </button>
                <button onClick={() => void reset()} disabled={resetting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-600 transition disabled:opacity-50">
                  {resetting ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Sıfırla
                </button>
                <button onClick={() => void save()} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-semibold text-white transition disabled:opacity-50">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Kaydet
                </button>
              </div>
            </div>

            {saved && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-700">
                <CheckCircle size={14} /> Kaydedildi
              </div>
            )}

            {/* Kaynak Bilgisi */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><Info size={12} /> Kaynak Bilgisi (Salt Okunur)</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div>
                  <p className="text-slate-400 mb-0.5">Kaynak Tipi</p>
                  <SourceBadge source={selected.source} />
                </div>
                <div>
                  <p className="text-slate-400 mb-0.5">Kaynak Servis / Job</p>
                  <p className="text-slate-700 font-mono">{selected.sourceDetail}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 mb-0.5">Tetikleyici</p>
                  <p className="text-slate-700">{selected.trigger}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 mb-0.5">Endpoint / Path</p>
                  <p className="text-slate-700 font-mono text-[11px] bg-white rounded-lg px-2 py-1 border border-slate-200">{selected.triggerPath}</p>
                </div>
              </div>

              {/* Değişkenler */}
              {variables.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs mb-1.5">Kullanılabilir Değişkenler</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.map(v => (
                      <code key={v} className="text-[11px] bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-lg font-mono">
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Konu ve içerik alanlarında bu değişkenleri kullanabilirsiniz.</p>
                </div>
              )}
            </div>

            {/* Düzenlenebilir Alanlar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mail Ayarları</p>

              {/* Enabled toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setEditing(e => ({ ...e, isEnabled: !e.isEnabled }))}
                  className={`relative w-10 h-5 rounded-full transition ${editing.isEnabled ? "bg-teal-500" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editing.isEnabled ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-sm text-slate-700">Gönderim Aktif</span>
                {!editing.isEnabled && <span className="text-xs text-red-500 font-medium">— Devre dışı olduğunda bu şablon gönderilmez</span>}
              </label>

              {/* From */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Gönderen Ad <span className="text-slate-400">(boş = SMTP config)</span></label>
                  <input value={editing.fromName ?? ""} onChange={e => setEditing(v => ({ ...v, fromName: e.target.value }))}
                    placeholder={`Varsayılan: SMTP config`} className={inp} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Gönderen E-posta <span className="text-slate-400">(boş = SMTP config)</span></label>
                  <input value={editing.fromAddress ?? ""} onChange={e => setEditing(v => ({ ...v, fromAddress: e.target.value }))}
                    placeholder="ornek@alan.com" className={inp} />
                </div>
              </div>

              {/* CC / BCC */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">CC <span className="text-slate-400">(virgülle ayır)</span></label>
                  <input value={editing.ccEmails ?? ""} onChange={e => setEditing(v => ({ ...v, ccEmails: e.target.value }))}
                    placeholder="cc1@alan.com, cc2@alan.com" className={inp} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">BCC <span className="text-slate-400">(virgülle ayır)</span></label>
                  <input value={editing.bccEmails ?? ""} onChange={e => setEditing(v => ({ ...v, bccEmails: e.target.value }))}
                    placeholder="bcc@alan.com" className={inp} />
                </div>
              </div>

              {/* Konu */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Konu</label>
                <input value={editing.subject ?? ""} onChange={e => setEditing(v => ({ ...v, subject: e.target.value }))}
                  className={inp} />
              </div>
            </div>

            {/* İçerik (Body) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">HTML İçerik (Body)</p>
                {!selected.isBodyEditable && (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                    <AlertTriangle size={10} /> Dinamik — düzenleme sınırlı
                  </span>
                )}
              </div>

              {selected.isBodyEditable ? (
                <>
                  {editing.bodyHtml === "" && (
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700">
                      <Info size={12} /> Boş bırakılırsa sistem varsayılan HTML kullanılır. Önizle ile görebilirsiniz.
                    </div>
                  )}
                  {(editing.bodyHtml ?? "") !== "" && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                      <AlertTriangle size={12} /> Özel içerik aktif. &ldquo;Sıfırla&rdquo; ile varsayılana dönebilirsiniz.
                    </div>
                  )}
                  <textarea
                    value={editing.bodyHtml ?? ""}
                    onChange={e => setEditing(v => ({ ...v, bodyHtml: e.target.value }))}
                    rows={20}
                    placeholder="Boş bırakın = sistem varsayılan HTML&#10;&#10;Özel HTML girin = bu içerik kullanılır.&#10;{{değişken}} kullanabilirsiniz — örn: Merhaba {{name}}"
                    className={`${inp} font-mono text-xs leading-relaxed resize-y`}
                  />
                  <p className="text-[11px] text-slate-400">
                    Tam HTML (DOCTYPE dahil) veya sadece iç içerik girebilirsiniz.
                    Sistem wrapper (&lt;html&gt;, header, footer) zaten uygulanmış şekilde gelir.
                  </p>
                </>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 space-y-1.5">
                  <p>Bu şablonun içeriği çalışma zamanında dinamik olarak oluşturulur (örn: tablo satırları, çoklu alıcı vs).</p>
                  <p className="text-xs text-slate-400">Düzenleme için backend kaynak koduna bakın: <code className="bg-white border border-slate-200 px-1 rounded font-mono">{selected.sourceDetail}</code></p>
                  <p className="text-xs text-slate-400">Önizle butonu ile örnek görünümü inceleyebilirsiniz.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Önizleme Modal ── */}
      {previewOpen && preview && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <div>
                <p className="text-sm font-bold text-slate-900">Önizleme — {selected?.displayName}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Konu: {preview.subject}</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <iframe
                ref={iframeRef}
                className="w-full h-full rounded-xl border border-slate-200"
                style={{ minHeight: 400 }}
                title="Mail önizleme"
                sandbox="allow-same-origin"
              />
            </div>
            <div className="px-5 py-3 border-t border-slate-200 flex justify-end">
              <button onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-600 transition">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
