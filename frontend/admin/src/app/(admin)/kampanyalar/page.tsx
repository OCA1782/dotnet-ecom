"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight, Megaphone, Image as ImageIcon, Palette, Type } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string;
  colorScheme: string;
  imageUrl: string | null;
  stylesJson: string | null;
  linkUrl: string | null;
  linkText: string | null;
  displayOrder: number;
  isActive: boolean;
  createdDate: string;
}

interface CampaignStyles {
  titleColor?: string;
  titleFontSize?: string;
  titleFontWeight?: string;
  subtitleColor?: string;
  subtitleFontSize?: string;
  linkTextColor?: string;
  linkBgColor?: string;
}

interface FormState {
  title: string;
  subtitle: string;
  icon: string;
  colorScheme: string;
  imageUrl: string;
  linkUrl: string;
  linkText: string;
  displayOrder: number;
  isActive: boolean;
  styles: CampaignStyles;
}

const DEFAULT_STYLES: CampaignStyles = {
  titleColor: "#ffffff",
  titleFontSize: "28",
  titleFontWeight: "800",
  subtitleColor: "rgba(255,255,255,0.85)",
  subtitleFontSize: "14",
  linkTextColor: "#0f172a",
  linkBgColor: "#ffffff",
};

const empty: FormState = {
  title: "", subtitle: "", icon: "🏷️", colorScheme: "orange",
  imageUrl: "", linkUrl: "", linkText: "", displayOrder: 0, isActive: true,
  styles: { ...DEFAULT_STYLES },
};

const inp = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 bg-white";
const lbl = "block text-xs font-semibold text-slate-600 mb-1";

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: "İndirim & Fiyat", emojis: ["🏷️", "%", "💰", "💸", "🤑", "💲", "🪙", "#1"] },
  { label: "Kargo & Teslimat", emojis: ["🚚", "📦", "✈️", "🛵", "🏃", "⚡", "∞", "🚀"] },
  { label: "Özel & Kalite",   emojis: ["⭐", "🌟", "💎", "👑", "🔥", "✨", "🎯", "★"] },
  { label: "Alışveriş",       emojis: ["🛍️", "🛒", "🧺", "💳", "🎁", "🎀", "🎊", "🎉"] },
  { label: "Ürün Grubu",      emojis: ["👗", "👟", "📱", "🏠", "🌸", "🍕", "⚽", "📚"] },
  { label: "Mevsim & Tema",   emojis: ["❄️", "☀️", "🌺", "🍂", "🎃", "🎄", "💝", "🌈"] },
];

const COLOR_SCHEMES: { value: string; label: string; previewBg: string; badgeBg: string; badgeText: string; gradient: string }[] = [
  { value: "orange", label: "Turuncu", previewBg: "bg-gradient-to-br from-orange-500 to-red-500",    badgeBg: "bg-orange-100", badgeText: "text-orange-700",  gradient: "linear-gradient(135deg,#f97316,#ef4444)" },
  { value: "teal",   label: "Teal",    previewBg: "bg-gradient-to-br from-teal-500 to-cyan-500",     badgeBg: "bg-teal-100",   badgeText: "text-teal-700",    gradient: "linear-gradient(135deg,#14b8a6,#06b6d4)" },
  { value: "navy",   label: "Lacivert",previewBg: "bg-gradient-to-br from-slate-700 to-blue-900",   badgeBg: "bg-slate-200",  badgeText: "text-slate-700",   gradient: "linear-gradient(135deg,#334155,#1e3a8a)" },
  { value: "amber",  label: "Kehribar",previewBg: "bg-gradient-to-br from-amber-400 to-orange-500", badgeBg: "bg-amber-100",  badgeText: "text-amber-700",   gradient: "linear-gradient(135deg,#fbbf24,#f97316)" },
  { value: "purple", label: "Mor",     previewBg: "bg-gradient-to-br from-purple-500 to-violet-600",badgeBg: "bg-purple-100", badgeText: "text-purple-700",  gradient: "linear-gradient(135deg,#a855f7,#7c3aed)" },
  { value: "green",  label: "Yeşil",   previewBg: "bg-gradient-to-br from-emerald-500 to-teal-600", badgeBg: "bg-emerald-100",badgeText: "text-emerald-700", gradient: "linear-gradient(135deg,#10b981,#0d9488)" },
  { value: "rose",   label: "Gül",     previewBg: "bg-gradient-to-br from-rose-500 to-pink-600",    badgeBg: "bg-rose-100",   badgeText: "text-rose-700",    gradient: "linear-gradient(135deg,#f43f5e,#db2777)" },
  { value: "sky",    label: "Gök",     previewBg: "bg-gradient-to-br from-sky-400 to-blue-600",     badgeBg: "bg-sky-100",    badgeText: "text-sky-700",     gradient: "linear-gradient(135deg,#38bdf8,#2563eb)" },
];

function getScheme(value: string) { return COLOR_SCHEMES.find(s => s.value === value) ?? COLOR_SCHEMES[0]; }

function parseStyles(json: string | null | undefined): CampaignStyles {
  if (!json) return { ...DEFAULT_STYLES };
  try { return { ...DEFAULT_STYLES, ...JSON.parse(json) }; }
  catch { return { ...DEFAULT_STYLES }; }
}

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <div className="flex gap-2 items-center">
        <input type="color" value={value ?? "#ffffff"} onChange={e => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white" />
        <input value={value ?? ""} onChange={e => onChange(e.target.value)}
          placeholder="#ffffff" className={inp + " flex-1 font-mono text-xs"} />
      </div>
    </div>
  );
}

export default function KampanyalarPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "style">("content");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.get<Campaign[]>("/api/admin/campaigns") ?? []); }
    catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditId(null); setForm(empty); setFormError(null); setActiveTab("content"); setShowForm(true);
  }

  function openEdit(item: Campaign) {
    setEditId(item.id);
    setForm({
      title: item.title, subtitle: item.subtitle ?? "", icon: item.icon,
      colorScheme: item.colorScheme, imageUrl: item.imageUrl ?? "",
      linkUrl: item.linkUrl ?? "", linkText: item.linkText ?? "",
      displayOrder: item.displayOrder, isActive: item.isActive,
      styles: parseStyles(item.stylesJson),
    });
    setFormError(null); setActiveTab("content"); setShowForm(true);
  }

  async function save() {
    if (!form.title.trim()) { setFormError("Başlık zorunludur."); return; }
    setSaving(true); setFormError(null);
    try {
      const body = {
        title: form.title.trim(), subtitle: form.subtitle.trim() || null, icon: form.icon,
        colorScheme: form.colorScheme, imageUrl: form.imageUrl.trim() || null,
        stylesJson: JSON.stringify(form.styles),
        linkUrl: form.linkUrl.trim() || null, linkText: form.linkText.trim() || null,
        displayOrder: form.displayOrder, isActive: form.isActive,
      };
      if (editId) await api.put(`/api/admin/campaigns/${editId}`, body);
      else await api.post("/api/admin/campaigns", body);
      setShowForm(false);
      await load();
    } catch (e) {
      setFormError((e as Error).message || "Bir hata oluştu.");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try { await api.delete(`/api/admin/campaigns/${id}`); setConfirmDelete(null); await load(); }
    catch { }
    finally { setDeleting(false); }
  }

  const scheme = getScheme(form.colorScheme);
  const activeCount = items.filter(i => i.isActive).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 flex items-center justify-center">
            <Megaphone size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Kampanyalar</h1>
            <p className="text-xs text-slate-500">{items.length} kampanya · {activeCount} aktif</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
          <Plus size={16} /> Yeni Kampanya
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="rounded-2xl border border-slate-100 bg-white animate-pulse h-48" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Megaphone size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Henüz kampanya yok</p>
          <button onClick={openCreate} className="mt-4 text-sm text-teal-600 font-semibold hover:underline">İlk kampanyayı oluştur →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.slice().sort((a, b) => a.displayOrder - b.displayOrder).map(item => {
            const s = getScheme(item.colorScheme);
            const st = parseStyles(item.stylesJson);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                {/* Preview strip */}
                <div className="relative h-24 flex items-center justify-start overflow-hidden px-5"
                  style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: s.gradient }}>
                  {item.imageUrl && <div className="absolute inset-0 bg-black/40" />}
                  <div className="relative z-10 flex items-center gap-3">
                    <span className="text-3xl drop-shadow select-none">{item.icon}</span>
                    <div>
                      <p className="font-extrabold leading-tight drop-shadow"
                        style={{ color: st.titleColor, fontSize: `${Math.min(Number(st.titleFontSize ?? 20), 20)}px`, fontWeight: st.titleFontWeight }}>
                        {item.title}
                      </p>
                      {item.subtitle && <p className="text-xs drop-shadow" style={{ color: st.subtitleColor }}>{item.subtitle}</p>}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 ${item.isActive ? "text-green-700" : "text-slate-500"}`}>
                      {item.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/30 text-white">#{item.displayOrder}</span>
                  </div>
                </div>
                <div className="p-4">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${s.badgeBg} ${s.badgeText}`}>{s.label}</span>
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-1 mb-0.5">{item.title}</h3>
                  {item.subtitle && <p className="text-xs text-slate-500 line-clamp-1 mb-2">{item.subtitle}</p>}
                  {item.linkUrl && (
                    <div className="text-[10px] text-teal-600 mb-3 truncate">{item.linkText || item.linkUrl}</div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => openEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50 py-1.5 rounded-lg transition">
                      <Pencil size={12} /> Düzenle
                    </button>
                    <button onClick={() => setConfirmDelete(item.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 hover:text-red-500 hover:bg-red-50 py-1.5 rounded-lg transition">
                      <Trash2 size={12} /> Sil
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
            <h3 className="font-bold text-slate-800 mb-2">Kampanyayı sil?</h3>
            <p className="text-sm text-slate-500 mb-5">Bu kampanya kalıcı olarak silinecek.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">İptal</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={deleting} className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60">
                {deleting ? "Siliniyor…" : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal — two-panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">{editId ? "Kampanyayı Düzenle" : "Yeni Kampanya"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left: Form */}
              <div className="flex-1 overflow-y-auto border-r border-slate-100">
                {/* Tabs */}
                <div className="flex border-b border-slate-100 sticky top-0 bg-white z-10">
                  {[
                    { id: "content", label: "İçerik", icon: <Type size={13} /> },
                    { id: "style",   label: "Stil",   icon: <Palette size={13} /> },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as "content" | "style")}
                      className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold border-b-2 transition ${activeTab === tab.id ? "border-teal-500 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                      {tab.icon}{tab.label}
                    </button>
                  ))}
                </div>

                <div className="px-5 py-4 space-y-4">
                  {activeTab === "content" && (
                    <>
                      <div>
                        <label className={lbl}>Başlık *</label>
                        <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Kampanya başlığı" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Alt Başlık</label>
                        <input value={form.subtitle} onChange={e => setForm(f => ({...f, subtitle: e.target.value}))} placeholder="Kısa açıklama" className={inp} />
                      </div>

                      {/* Icon */}
                      <div>
                        <label className={lbl}>İkon / Emoji</label>
                        <input value={form.icon} onChange={e => setForm(f => ({...f, icon: e.target.value}))} placeholder="Emoji veya kısa metin" className={inp + " text-lg mb-2"} />
                        <div className="space-y-2 mt-1">
                          {EMOJI_GROUPS.map(group => (
                            <div key={group.label}>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{group.label}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {group.emojis.map(emoji => (
                                  <button key={emoji} type="button" onClick={() => setForm(f => ({...f, icon: emoji}))}
                                    className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition border font-bold ${form.icon === emoji ? "border-teal-400 bg-teal-50 ring-1 ring-teal-200" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Color scheme */}
                      <div>
                        <label className={lbl}>Renk Şeması</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {COLOR_SCHEMES.map(s => (
                            <button key={s.value} type="button" onClick={() => setForm(f => ({...f, colorScheme: s.value}))} title={s.label}
                              className={`relative w-9 h-9 rounded-xl ${s.previewBg} transition border-2 ${form.colorScheme === s.value ? "border-slate-700 scale-110 shadow-md" : "border-transparent hover:scale-105"}`}>
                              {form.colorScheme === s.value && <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Seçili: <span className="font-semibold text-slate-600">{scheme.label}</span></p>
                      </div>

                      {/* Image URL */}
                      <div>
                        <label className={lbl}><ImageIcon size={11} className="inline mr-1" />Arka Plan Görseli (URL)</label>
                        <input value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl: e.target.value}))} placeholder="https://cdn.example.com/banner.jpg" className={inp} />
                        <p className="text-[10px] text-slate-400 mt-1">Görsel varsa renk şeması üzerine bindirme olarak gösterilir.</p>
                      </div>

                      {/* Links */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Bağlantı URL</label>
                          <input value={form.linkUrl} onChange={e => setForm(f => ({...f, linkUrl: e.target.value}))} placeholder="/urunler" className={inp} />
                        </div>
                        <div>
                          <label className={lbl}>Bağlantı Metni</label>
                          <input value={form.linkText} onChange={e => setForm(f => ({...f, linkText: e.target.value}))} placeholder="İncele →" className={inp} />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className={lbl}>Sıralama</label>
                          <input type="number" min={0} value={form.displayOrder} onChange={e => setForm(f => ({...f, displayOrder: Number(e.target.value)}))} className={inp} />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                          <button type="button" onClick={() => setForm(f => ({...f, isActive: !f.isActive}))} className="flex items-center gap-2">
                            {form.isActive ? <ToggleRight size={28} className="text-teal-500" /> : <ToggleLeft size={28} className="text-slate-400" />}
                            <span className={`text-sm font-semibold ${form.isActive ? "text-teal-600" : "text-slate-500"}`}>{form.isActive ? "Aktif" : "Pasif"}</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "style" && (
                    <>
                      <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">Yazı renk ve boyut ayarları önizlemede anlık yansır.</p>
                      <div>
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Başlık</p>
                        <div className="space-y-3">
                          <ColorField label="Renk" value={form.styles.titleColor} onChange={v => setForm(f => ({...f, styles: {...f.styles, titleColor: v}}))} />
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={lbl}>Boyut (px)</label>
                              <input type="number" min={12} max={60} value={form.styles.titleFontSize ?? "28"} onChange={e => setForm(f => ({...f, styles: {...f.styles, titleFontSize: e.target.value}}))} className={inp} />
                            </div>
                            <div>
                              <label className={lbl}>Kalınlık</label>
                              <select value={form.styles.titleFontWeight ?? "800"} onChange={e => setForm(f => ({...f, styles: {...f.styles, titleFontWeight: e.target.value}}))} className={inp}>
                                {["400","500","600","700","800","900"].map(w => <option key={w} value={w}>{w}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Alt Başlık</p>
                        <div className="space-y-3">
                          <ColorField label="Renk" value={form.styles.subtitleColor} onChange={v => setForm(f => ({...f, styles: {...f.styles, subtitleColor: v}}))} />
                          <div>
                            <label className={lbl}>Boyut (px)</label>
                            <input type="number" min={10} max={32} value={form.styles.subtitleFontSize ?? "14"} onChange={e => setForm(f => ({...f, styles: {...f.styles, subtitleFontSize: e.target.value}}))} className={inp} />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Buton</p>
                        <div className="space-y-3">
                          <ColorField label="Yazı Rengi" value={form.styles.linkTextColor} onChange={v => setForm(f => ({...f, styles: {...f.styles, linkTextColor: v}}))} />
                          <ColorField label="Arka Plan" value={form.styles.linkBgColor} onChange={v => setForm(f => ({...f, styles: {...f.styles, linkBgColor: v}}))} />
                        </div>
                      </div>
                    </>
                  )}

                  {formError && <div className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{formError}</div>}
                  <div className="flex gap-3 pt-2 pb-1">
                    <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">İptal</button>
                    <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition disabled:opacity-60">
                      {saving ? "Kaydediliyor…" : editId ? "Güncelle" : "Oluştur"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Live Preview */}
              <div className="w-72 flex flex-col bg-slate-50 overflow-y-auto">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 pt-4 pb-2">Canlı Önizleme</p>
                {form.title ? (
                  <div className="mx-3 rounded-2xl overflow-hidden shadow-lg">
                    {/* Card preview — customer tarafındaki görünümü */}
                    <div className="relative overflow-hidden p-7 text-white"
                      style={form.imageUrl
                        ? { backgroundImage: `url(${form.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center", minHeight: "180px" }
                        : { background: scheme.gradient, minHeight: "180px" }}>
                      {form.imageUrl && <div className="absolute inset-0 bg-black/45" />}
                      {/* Decorative big icon */}
                      <div className="absolute right-3 bottom-1 text-[80px] font-black opacity-10 leading-none select-none">{form.icon}</div>
                      <div className="relative z-10">
                        {form.subtitle && (
                          <p className="text-xs font-semibold opacity-80 mb-1"
                            style={{ color: form.styles.subtitleColor, fontSize: `${form.styles.subtitleFontSize ?? 12}px` }}>
                            {form.subtitle}
                          </p>
                        )}
                        <h3 className="mb-4 leading-tight drop-shadow"
                          style={{ color: form.styles.titleColor, fontSize: `${form.styles.titleFontSize ?? 28}px`, fontWeight: form.styles.titleFontWeight ?? "800" }}>
                          {form.title}
                        </h3>
                        {form.linkUrl && (
                          <div className="inline-block font-bold text-xs px-5 py-2 rounded-xl"
                            style={{ backgroundColor: form.styles.linkBgColor ?? "#ffffff", color: form.styles.linkTextColor ?? "#0f172a" }}>
                            {form.linkText || "İncele →"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mx-3 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center h-40 text-slate-300 text-xs">
                    Başlık girin
                  </div>
                )}
                <div className="px-4 pt-3 pb-4 space-y-1.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Kart Özeti</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{form.icon || "🏷️"}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-700 leading-tight">{form.title || "—"}</p>
                      {form.subtitle && <p className="text-[10px] text-slate-400">{form.subtitle}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${scheme.badgeBg} ${scheme.badgeText}`}>{scheme.label}</span>
                    {form.imageUrl && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Görsel</span>}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${form.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{form.isActive ? "Aktif" : "Pasif"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
