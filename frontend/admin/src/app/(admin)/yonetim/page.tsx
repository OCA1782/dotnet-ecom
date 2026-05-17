"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  Settings, Globe, Palette, Truck, Menu, Shield, FileText,
  Save, Upload, Loader2, CheckCircle, GripVertical,
  Share2, Image as ImageIcon, Link, ChevronUp, ChevronDown,
  Plus, Trash2, HelpCircle, RefreshCw, MapPin, Clock, Phone, Mail,
  SendHorizonal, XCircle,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */
type SiteSettings = Record<string, string>;
type FaqItem = { q: string; a: string };

const DEFAULTS: SiteSettings = {
  SiteName: "", SiteUrl: "", AdminTitle: "", Currency: "TRY",
  DefaultTaxRate: "20", ContactEmail: "", ContactPhone: "",
  SocialInstagram: "", SocialTwitter: "", SocialFacebook: "",
  SocialYoutube: "", SocialLinkedin: "",
  LogoUrl: "", FaviconUrl: "",
  FreeShippingLimit: "", DefaultShippingCost: "",
  MaintenanceMode: "false", AdminMenuOrder: "",
  // Footer
  Footer_Tagline: "Keyifli alışverişin yeni adresi.\nSevdiğin ürünler, güvenli ödeme.",
  // Sayfa içerikleri
  Page_SSS: "[]",
  Page_IadeVeDegisim: "",
  Page_KargoTakibi: "",
  Page_Iletisim_Address: "",
  Page_Iletisim_Hours: "",
  Page_Iletisim_MapUrl: "",
  Page_Hakkimizda: "",
  Page_KVKK: "",
  Page_Gizlilik: "",
};

const ALL_MENU_ITEMS = [
  { href: "/dashboard",    label: "Dashboard" },
  { href: "/siparisler",   label: "Siparişler" },
  { href: "/urunler",      label: "Ürünler" },
  { href: "/kategoriler",  label: "Kategoriler" },
  { href: "/markalar",     label: "Markalar" },
  { href: "/stok",         label: "Stok" },
  { href: "/kullanicilar", label: "Kullanıcılar" },
  { href: "/kuponlar",     label: "Kuponlar" },
  { href: "/yorumlar",     label: "Yorumlar" },
  { href: "/hareketler",   label: "Hareketler" },
  { href: "/hedefler",     label: "Hedefler" },
  { href: "/takip",        label: "Takip" },
];

type Tab = "genel" | "gorunum" | "kargo" | "menu" | "icerik" | "sistem";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "genel",   label: "Genel",    icon: <Globe size={14} /> },
  { id: "gorunum", label: "Görünüm",  icon: <Palette size={14} /> },
  { id: "kargo",   label: "Kargo",    icon: <Truck size={14} /> },
  { id: "menu",    label: "Menü",     icon: <Menu size={14} /> },
  { id: "icerik",  label: "İçerik",   icon: <FileText size={14} /> },
  { id: "sistem",  label: "Sistem",   icon: <Shield size={14} /> },
];

type ContentSub = "sss" | "iade" | "kargo" | "iletisim" | "hakkimizda" | "kvkk" | "gizlilik" | "footer";
const CONTENT_SUBS: { id: ContentSub; label: string }[] = [
  { id: "sss",       label: "SSS" },
  { id: "iade",      label: "İade & Değişim" },
  { id: "kargo",     label: "Kargo Takibi" },
  { id: "iletisim",  label: "İletişim" },
  { id: "hakkimizda",label: "Hakkımızda" },
  { id: "kvkk",      label: "KVKK" },
  { id: "gizlilik",  label: "Gizlilik" },
  { id: "footer",    label: "Footer" },
];

/* ─── MenuSorter ─────────────────────────────────────────────────────── */
type MenuItem = typeof ALL_MENU_ITEMS[number];

function MenuSorter({ order, onChange }: { order: string[]; onChange: (n: string[]) => void }) {
  const items: MenuItem[] = order.map(h => ALL_MENU_ITEMS.find(m => m.href === h)!).filter(Boolean);
  const drag = useRef({ from: -1, over: -1 });
  const [overIdx, setOverIdx] = useState(-1);

  function moveItem(from: number, to: number) {
    if (from === to) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={item.href} draggable
          onDragStart={e => { drag.current.from = i; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); }}
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (drag.current.over !== i) { drag.current.over = i; setOverIdx(i); } }}
          onDrop={e => { e.preventDefault(); const from = drag.current.from; drag.current = { from: -1, over: -1 }; setOverIdx(-1); moveItem(from, i); }}
          onDragEnd={() => { drag.current = { from: -1, over: -1 }; setOverIdx(-1); }}
          className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition select-none ${overIdx === i ? "border-teal-400 bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
          <GripVertical size={16} className="text-slate-300 cursor-grab shrink-0" />
          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
          <span className="text-sm font-medium text-slate-700 flex-1">{item.label}</span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">{item.href}</span>
          <div className="flex gap-0.5 ml-2 shrink-0">
            <button disabled={i === 0} onClick={() => moveItem(i, i - 1)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 transition"><ChevronUp size={15} /></button>
            <button disabled={i === items.length - 1} onClick={() => moveItem(i, i + 1)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 transition"><ChevronDown size={15} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── FAQ editor ─────────────────────────────────────────────────────── */
function FaqEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [items, setItems] = useState<FaqItem[]>(() => {
    try { return JSON.parse(value) as FaqItem[]; } catch { return []; }
  });

  function update(next: FaqItem[]) {
    setItems(next);
    onChange(JSON.stringify(next));
  }

  function add() { update([...items, { q: "", a: "" }]); }
  function remove(i: number) { update(items.filter((_, idx) => idx !== i)); }
  function setField(i: number, field: "q" | "a", val: string) {
    update(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          Henüz soru yok. Eklemek için aşağıdaki butonu kullanın.
        </div>
      )}
      {items.map((item, i) => (
        <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <HelpCircle size={14} className="text-teal-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-500">Soru {i + 1}</span>
            <button onClick={() => remove(i)}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
              <Trash2 size={13} />
            </button>
          </div>
          <input value={item.q} onChange={e => setField(i, "q", e.target.value)}
            placeholder="Soru metni..."
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <textarea value={item.a} onChange={e => setField(i, "a", e.target.value)}
            placeholder="Cevap metni..."
            rows={3}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
        </div>
      ))}
      <button onClick={add}
        className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 border border-teal-200 hover:border-teal-400 bg-teal-50 hover:bg-teal-100 rounded-xl px-4 py-2.5 transition w-full justify-center">
        <Plus size={15} /> Soru Ekle
      </button>
    </div>
  );
}

/* ─── Text page editor ───────────────────────────────────────────────── */
function TextEditor({ label, settingKey, value, onChange, rows = 12, hint }: {
  label: string; settingKey: string; value: string;
  onChange: (key: string, val: string) => void;
  rows?: number; hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600">{label}</label>
        {value && <span className="text-xs text-slate-400">{value.length} karakter</span>}
      </div>
      <textarea value={value} onChange={e => onChange(settingKey, e.target.value)}
        rows={rows} placeholder="İçerik buraya girilecek..."
        className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 resize-y font-sans leading-relaxed" />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/* ─── Ana sayfa ─────────────────────────────────────────────────────── */
export default function YonetimPage() {
  const [tab, setTab]             = useState<Tab>("genel");
  const [contentSub, setContentSub] = useState<ContentSub>("sss");
  const [settings, setSettings]   = useState<SiteSettings>(DEFAULTS);
  const [menuOrder, setMenuOrder] = useState<string[]>(ALL_MENU_ITEMS.map(i => i.href));
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [uploadingLogo, setUploadingLogo]       = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [testEmail, setTestEmail]               = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult]   = useState<{ ok: boolean; msg: string } | null>(null);
  const logoRef    = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<SiteSettings>("/api/admin/settings").then(data => {
      setSettings({ ...DEFAULTS, ...data });
      if (data.AdminMenuOrder) {
        try {
          const parsed: string[] = JSON.parse(data.AdminMenuOrder);
          const valid   = parsed.filter(h => ALL_MENU_ITEMS.some(m => m.href === h));
          const missing = ALL_MENU_ITEMS.filter(m => !valid.includes(m.href)).map(m => m.href);
          setMenuOrder([...valid, ...missing]);
        } catch { }
      }
    }).finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  async function save() {
    setSaving(true);
    try {
      await api.put("/api/admin/settings", { ...settings, AdminMenuOrder: JSON.stringify(menuOrder) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }

  async function uploadImage(file: File, type: "logo" | "favicon") {
    const setUploading = type === "logo" ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
        body: form,
      });
      const data = await res.json();
      if (data.url) set(type === "logo" ? "LogoUrl" : "FaviconUrl", data.url);
    } finally { setUploading(false); }
  }

  async function sendTestEmail() {
    if (!testEmail.trim()) return;
    setTestEmailSending(true);
    setTestEmailResult(null);
    try {
      await api.post("/api/admin/email/test", { toEmail: testEmail });
      setTestEmailResult({ ok: true, msg: `Test e-postası ${testEmail} adresine gönderildi.` });
    } catch {
      setTestEmailResult({ ok: false, msg: "Gönderilemedi. SMTP ayarlarını kontrol edin." });
    } finally {
      setTestEmailSending(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {saved && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-lg">
          <CheckCircle size={16} /> Kaydedildi
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yönetim</h1>
          <p className="text-sm text-slate-500 mt-0.5">Site, panel ve içerik ayarları</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Kaydet
        </button>
      </div>

      {/* Ana sekmeler */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition flex-1 justify-center ${
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Genel ── */}
      {tab === "genel" && (
        <div className="space-y-5">
          <Section title="Site Bilgileri" icon={<Globe size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Site Adı" hint="Müşteri arayüzünde görünen ad">
                <input value={settings.SiteName} onChange={e => set("SiteName", e.target.value)} className={inp} placeholder="Örn: Keyvora Store" />
              </Field>
              <Field label="Admin Panel Başlığı" hint="Sol üst köşede görünür">
                <input value={settings.AdminTitle} onChange={e => set("AdminTitle", e.target.value)} className={inp} placeholder="Örn: Keyvora" />
              </Field>
              <Field label="Site URL" hint="Müşteri mağazası adresi">
                <div className="relative">
                  <Link size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input value={settings.SiteUrl} onChange={e => set("SiteUrl", e.target.value)} className={inp + " pl-9"} placeholder="https://keyvora.com" />
                </div>
              </Field>
              <Field label="Para Birimi">
                <select value={settings.Currency} onChange={e => set("Currency", e.target.value)} className={inp}>
                  <option value="TRY">TRY — Türk Lirası</option>
                  <option value="USD">USD — Amerikan Doları</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — İngiliz Sterlini</option>
                </select>
              </Field>
              <Field label="KDV Oranı (%)" hint="Varsayılan vergi oranı">
                <input type="number" value={settings.DefaultTaxRate} onChange={e => set("DefaultTaxRate", e.target.value)} className={inp} min="0" max="100" />
              </Field>
            </div>
          </Section>
          <Section title="İletişim Bilgileri" icon={<Settings size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="İletişim E-postası">
                <input type="email" value={settings.ContactEmail} onChange={e => set("ContactEmail", e.target.value)} className={inp} placeholder="info@keyvora.com" />
              </Field>
              <Field label="İletişim Telefonu">
                <input value={settings.ContactPhone} onChange={e => set("ContactPhone", e.target.value)} className={inp} placeholder="+90 532 000 00 00" />
              </Field>
            </div>
          </Section>
        </div>
      )}

      {/* ── Görünüm ── */}
      {tab === "gorunum" && (
        <div className="space-y-5">
          <Section title="Logo & Favicon" icon={<ImageIcon size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Logo</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#1c2044] flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                    {settings.LogoUrl
                      ? <img src={settings.LogoUrl} alt="Logo" className="w-full h-full object-contain p-1.5" /> // eslint-disable-line
                      : <ImageIcon size={24} className="text-slate-500" />}
                  </div>
                  <div className="space-y-2 flex-1">
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "logo")} />
                    <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                      className="flex items-center gap-2 text-sm border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition w-full justify-center">
                      {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {uploadingLogo ? "Yükleniyor..." : "Görsel Yükle"}
                    </button>
                    {settings.LogoUrl && (
                      <input value={settings.LogoUrl} onChange={e => set("LogoUrl", e.target.value)}
                        className="text-xs text-slate-400 border border-slate-200 rounded-lg px-2 py-1 w-full font-mono focus:outline-none" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400">PNG veya WebP önerilir. Şeffaf arka plan ile en iyi görünür.</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Favicon</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                    {settings.FaviconUrl
                      ? <img src={settings.FaviconUrl} alt="Favicon" className="w-10 h-10 object-contain" /> // eslint-disable-line
                      : <Globe size={24} className="text-slate-400" />}
                  </div>
                  <div className="space-y-2 flex-1">
                    <input ref={faviconRef} type="file" accept="image/*,.ico" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "favicon")} />
                    <button onClick={() => faviconRef.current?.click()} disabled={uploadingFavicon}
                      className="flex items-center gap-2 text-sm border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition w-full justify-center">
                      {uploadingFavicon ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {uploadingFavicon ? "Yükleniyor..." : "Görsel Yükle"}
                    </button>
                    {settings.FaviconUrl && (
                      <input value={settings.FaviconUrl} onChange={e => set("FaviconUrl", e.target.value)}
                        className="text-xs text-slate-400 border border-slate-200 rounded-lg px-2 py-1 w-full font-mono focus:outline-none" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400">ICO veya 32×32 PNG önerilir.</p>
              </div>
            </div>
          </Section>
          <Section title="Sosyal Medya" icon={<Share2 size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "Instagram", key: "SocialInstagram", ph: "https://instagram.com/keyvora" },
                { label: "Twitter / X", key: "SocialTwitter", ph: "https://twitter.com/keyvora" },
                { label: "Facebook", key: "SocialFacebook", ph: "https://facebook.com/keyvora" },
                { label: "YouTube", key: "SocialYoutube", ph: "https://youtube.com/@keyvora" },
                { label: "LinkedIn", key: "SocialLinkedin", ph: "https://linkedin.com/company/keyvora" },
              ].map(({ label, key, ph }) => (
                <Field key={key} label={label}>
                  <div className="relative">
                    <Share2 size={13} className="absolute left-3 top-3 text-slate-400" />
                    <input value={settings[key] ?? ""} onChange={e => set(key, e.target.value)} className={inp + " pl-8"} placeholder={ph} />
                  </div>
                </Field>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── Kargo ── */}
      {tab === "kargo" && (
        <Section title="Kargo Ayarları" icon={<Truck size={16} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Ücretsiz Kargo Limiti" hint="Bu tutarın üzerindeki siparişlere ücretsiz kargo">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₺</span>
                <input type="number" value={settings.FreeShippingLimit} onChange={e => set("FreeShippingLimit", e.target.value)} className={inp + " pl-8"} placeholder="500" min="0" />
              </div>
            </Field>
            <Field label="Varsayılan Kargo Ücreti" hint="Limiti geçmeyen siparişlere uygulanır">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₺</span>
                <input type="number" value={settings.DefaultShippingCost} onChange={e => set("DefaultShippingCost", e.target.value)} className={inp + " pl-8"} placeholder="29.90" min="0" step="0.01" />
              </div>
            </Field>
          </div>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Özet: </span>
              ₺{settings.FreeShippingLimit || "—"} ve üzeri siparişler ücretsiz, altındakiler ₺{settings.DefaultShippingCost || "—"} kargo ücreti öder.
            </p>
          </div>
        </Section>
      )}

      {/* ── Menü ── */}
      {tab === "menu" && (
        <Section title="Menü Sıralaması" icon={<Menu size={16} />}
          subtitle="Öğeleri sürükle-bırak ya da ok butonlarıyla yeniden sıralayın. Kaydet'e basınca sol menüye yansır.">
          <MenuSorter order={menuOrder} onChange={setMenuOrder} />
          <div className="mt-3">
            <button onClick={() => setMenuOrder(ALL_MENU_ITEMS.map(m => m.href))}
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition">
              Varsayılan sıralamaya sıfırla
            </button>
          </div>
        </Section>
      )}

      {/* ── İçerik ── */}
      {tab === "icerik" && (
        <div className="space-y-4">
          {/* Alt sekmeler */}
          <div className="flex flex-wrap gap-1.5">
            {CONTENT_SUBS.map(s => (
              <button key={s.id} onClick={() => setContentSub(s.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  contentSub === s.id
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* SSS */}
          {contentSub === "sss" && (
            <Section title="Sık Sorulan Sorular" icon={<HelpCircle size={16} />}
              subtitle="Müşteri sitesinde /sss sayfasında görünür. Soru ve cevapları düzenleyebilirsiniz.">
              <FaqEditor value={settings.Page_SSS} onChange={v => set("Page_SSS", v)} />
            </Section>
          )}

          {/* İade & Değişim */}
          {contentSub === "iade" && (
            <Section title="İade & Değişim" icon={<RefreshCw size={16} />}
              subtitle="/iade-degisim sayfasında görünür. Paragraflar arasında boş satır bırakın.">
              <TextEditor label="Sayfa İçeriği" settingKey="Page_IadeVeDegisim"
                value={settings.Page_IadeVeDegisim} onChange={set} rows={16}
                hint="Paragrafları boş satırla ayırın. İpucu: başlık satırı için satır başına # koyabilirsiniz." />
            </Section>
          )}

          {/* Kargo Takibi */}
          {contentSub === "kargo" && (
            <Section title="Kargo Takibi" icon={<Truck size={16} />}
              subtitle="/kargo-takibi sayfasında görünür.">
              <TextEditor label="Sayfa İçeriği" settingKey="Page_KargoTakibi"
                value={settings.Page_KargoTakibi} onChange={set} rows={14} />
            </Section>
          )}

          {/* İletişim */}
          {contentSub === "iletisim" && (
            <Section title="İletişim Sayfası" icon={<Phone size={16} />}
              subtitle="/iletisim sayfasında görünür. Genel e-posta ve telefon Genel sekmesinden alınır.">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="E-posta" hint="Genel sekmedeki ContactEmail kullanılır">
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input value={settings.ContactEmail} onChange={e => set("ContactEmail", e.target.value)} className={inp + " pl-9"} placeholder="destek@keyvora.com" />
                    </div>
                  </Field>
                  <Field label="Telefon">
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input value={settings.ContactPhone} onChange={e => set("ContactPhone", e.target.value)} className={inp + " pl-9"} placeholder="0850 000 00 00" />
                    </div>
                  </Field>
                </div>
                <Field label="Çalışma Saatleri">
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input value={settings.Page_Iletisim_Hours} onChange={e => set("Page_Iletisim_Hours", e.target.value)}
                      className={inp + " pl-9"} placeholder="Hafta içi 09:00 – 18:00, Cumartesi 10:00 – 16:00" />
                  </div>
                </Field>
                <Field label="Adres">
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                    <textarea value={settings.Page_Iletisim_Address} onChange={e => set("Page_Iletisim_Address", e.target.value)}
                      rows={3} className={inp + " pl-9 resize-none"} placeholder="Şirket adresi..." />
                  </div>
                </Field>
                <Field label="Google Maps Embed URL" hint="Google Maps'ten 'Haritayı Göm' > iframe src değeri">
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input value={settings.Page_Iletisim_MapUrl} onChange={e => set("Page_Iletisim_MapUrl", e.target.value)}
                      className={inp + " pl-9"} placeholder="https://maps.google.com/maps?..." />
                  </div>
                </Field>
              </div>
            </Section>
          )}

          {/* Hakkımızda */}
          {contentSub === "hakkimizda" && (
            <Section title="Hakkımızda" icon={<FileText size={16} />}
              subtitle="/hakkimizda sayfasında görünür.">
              <TextEditor label="Sayfa İçeriği" settingKey="Page_Hakkimizda"
                value={settings.Page_Hakkimizda} onChange={set} rows={16} />
            </Section>
          )}

          {/* KVKK */}
          {contentSub === "kvkk" && (
            <Section title="KVKK Metni" icon={<FileText size={16} />}
              subtitle="/kvkk sayfasında görünür. Hukuki metni buraya yapıştırabilirsiniz.">
              <TextEditor label="KVKK İçeriği" settingKey="Page_KVKK"
                value={settings.Page_KVKK} onChange={set} rows={20} />
            </Section>
          )}

          {/* Gizlilik */}
          {contentSub === "gizlilik" && (
            <Section title="Gizlilik Politikası" icon={<FileText size={16} />}
              subtitle="/gizlilik sayfasında görünür.">
              <TextEditor label="Gizlilik Politikası İçeriği" settingKey="Page_Gizlilik"
                value={settings.Page_Gizlilik} onChange={set} rows={20} />
            </Section>
          )}

          {/* Footer */}
          {contentSub === "footer" && (
            <Section title="Footer Bilgileri" icon={<Globe size={16} />}
              subtitle="Müşteri sitesinin alt bölümünde görünen bilgiler.">
              <div className="space-y-4">
                <Field label="Marka Sloganı" hint="Logo altında görünen kısa açıklama. Yeni satır için Enter kullanın.">
                  <textarea value={settings.Footer_Tagline} onChange={e => set("Footer_Tagline", e.target.value)}
                    rows={3} className={inp + " resize-none"} placeholder="Keyifli alışverişin yeni adresi." />
                </Field>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  Sosyal medya bağlantıları için <button className="text-teal-600 underline" onClick={() => setTab("gorunum")}>Görünüm sekmesine</button> gidin.
                  İletişim bilgileri (e-posta & telefon) <button className="text-teal-600 underline" onClick={() => setContentSub("iletisim")}>İletişim bölümünden</button> yönetilir.
                </div>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ── Sistem ── */}
      {tab === "sistem" && (
        <div className="space-y-5">
          <Section title="Bakım Modu" icon={<Shield size={16} />}
            subtitle="Aktif edildiğinde müşteri sitesi bakım sayfası gösterir. Admin paneli etkilenmez.">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-700">Bakım Modu</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {settings.MaintenanceMode === "true"
                    ? "Site şu anda bakımda. Müşteriler siteye erişemiyor."
                    : "Site aktif. Müşteriler normal şekilde erişebiliyor."}
                </p>
              </div>
              <button onClick={() => set("MaintenanceMode", settings.MaintenanceMode === "true" ? "false" : "true")}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.MaintenanceMode === "true" ? "bg-red-500" : "bg-slate-300"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.MaintenanceMode === "true" ? "left-7" : "left-1"}`} />
              </button>
            </div>
            {settings.MaintenanceMode === "true" && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <Shield size={14} /> Dikkat: Bakım modu aktif. Müşteri sitesi şu anda erişilemez.
              </div>
            )}
          </Section>
          <Section title="E-posta / SMTP Test" icon={<Mail size={16} />}
            subtitle="SMTP yapılandırmanızın çalıştığını doğrulamak için test e-postası gönderin. appsettings.json → Email bölümünü doldurun.">
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1 font-mono">
                <p>SmtpHost → <span className="text-slate-900">appsettings.json : Email:SmtpHost</span></p>
                <p>SmtpPort → <span className="text-slate-900">587 (StartTLS) veya 465 (SSL — UseSsl: true)</span></p>
                <p>Gmail    → host: smtp.gmail.com, port: 587, UseSsl: false</p>
                <p>Mailtrap → host: sandbox.smtp.mailtrap.io, port: 587</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className={inp + " flex-1"}
                  onKeyDown={e => e.key === "Enter" && sendTestEmail()}
                />
                <button onClick={sendTestEmail} disabled={testEmailSending || !testEmail.trim()}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                  {testEmailSending ? <Loader2 size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
                  Gönder
                </button>
              </div>
              {testEmailResult && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
                  testEmailResult.ok
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {testEmailResult.ok ? <CheckCircle size={15} /> : <XCircle size={15} />}
                  {testEmailResult.msg}
                </div>
              )}
            </div>
          </Section>
          <Section title="Sistem Bilgisi" icon={<Settings size={16} />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Para Birimi", value: settings.Currency },
                { label: "KDV Oranı", value: `%${settings.DefaultTaxRate}` },
                { label: "Ücretsiz Kargo", value: settings.FreeShippingLimit ? `₺${settings.FreeShippingLimit}` : "—" },
                { label: "Kargo Ücreti", value: settings.DefaultShippingCost ? `₺${settings.DefaultShippingCost}` : "—" },
                { label: "Site URL", value: settings.SiteUrl || "—" },
                { label: "Menü Öğesi", value: `${ALL_MENU_ITEMS.length} adet` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const inp = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition";

function Section({ title, subtitle, icon, children }: {
  title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-start gap-2">
        <span className="text-teal-600 mt-0.5">{icon}</span>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
