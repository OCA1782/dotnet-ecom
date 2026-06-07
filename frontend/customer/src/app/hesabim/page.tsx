"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800";

interface UserProfile {
  id: string;
  name: string;
  surname: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  commercialConsent: boolean;
  lastLoginDate?: string;
}

const NAV_LINKS = [
  { href: "/hesabim", label: "Hesap Bilgileri", icon: "👤" },
  { href: "/hesabim/siparisler", label: "Siparişlerim", icon: "📦" },
  { href: "/hesabim/adresler", label: "Adreslerim", icon: "📍" },
  { href: "/hesabim/favoriler", label: "Favorilerim", icon: "❤️" },
];

export default function HesabimPage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [commercialConsent, setCommercialConsent] = useState(false);

  // Şifre değiştirme
  const [pwSection, setPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/giris");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.get<UserProfile>("/api/users/me")
      .then(p => {
        setProfile(p);
        setName(p.name);
        setSurname(p.surname);
        setPhone(p.phoneNumber ?? "");
        setCommercialConsent(p.commercialConsent);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  function startEdit() { setEditing(true); setSaveMsg(null); }
  function cancelEdit() {
    if (!profile) return;
    setName(profile.name);
    setSurname(profile.surname);
    setPhone(profile.phoneNumber ?? "");
    setCommercialConsent(profile.commercialConsent);
    setEditing(false);
  }

  async function handleSave() {
    if (!name.trim() || !surname.trim()) {
      setSaveMsg({ text: "Ad ve soyad zorunludur.", ok: false });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.put("/api/users/me", { name: name.trim(), surname: surname.trim(), phoneNumber: phone.trim() || null, commercialConsent });
      setProfile(prev => prev ? { ...prev, name: name.trim(), surname: surname.trim(), phoneNumber: phone.trim() || undefined, commercialConsent } : prev);
      updateUser({ name: name.trim(), surname: surname.trim() });
      setEditing(false);
      setSaveMsg({ text: "Bilgileriniz güncellendi.", ok: true });
    } catch (e: unknown) {
      setSaveMsg({ text: e instanceof Error ? e.message : "Güncelleme başarısız.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!newPw || !currentPw) { setPwMsg({ text: "Tüm alanları doldurun.", ok: false }); return; }
    if (newPw !== confirmPw) { setPwMsg({ text: "Yeni şifreler eşleşmiyor.", ok: false }); return; }
    setChangingPw(true);
    setPwMsg(null);
    try {
      await api.patch("/api/users/me/change-password", { currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw });
      setPwMsg({ text: "Şifreniz başarıyla değiştirildi.", ok: true });
      setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwSection(false);
    } catch (e: unknown) {
      setPwMsg({ text: e instanceof Error ? e.message : "Şifre değiştirilemedi.", ok: false });
    } finally { setChangingPw(false); }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setSaveMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.uploadForm<{ url: string }>("/api/users/me/avatar", form);
      setProfile(prev => prev ? { ...prev, avatarUrl: res.url } : prev);
      setSaveMsg({ text: "Profil fotoğrafı güncellendi.", ok: true });
    } catch (e: unknown) {
      setSaveMsg({ text: e instanceof Error ? e.message : "Yükleme başarısız.", ok: false });
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (authLoading || loading) return null;
  if (!user || !profile) return null;

  const initials = `${profile.name.charAt(0)}${profile.surname.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6">
          {/* Profil Kartı */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-teal-200 shadow" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-2xl font-bold text-white shadow">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow hover:bg-slate-50 transition text-slate-600 disabled:opacity-50"
                  title="Fotoğraf değiştir"
                >
                  {uploadingAvatar ? (
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                    </svg>
                  ) : (
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              {/* Bilgiler */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-900">{profile.name} {profile.surname}</h1>
                <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>
                {profile.lastLoginDate && (
                  <p className="text-xs text-slate-400 mt-1">
                    Son giriş: {new Date(profile.lastLoginDate).toLocaleString("tr-TR")}
                  </p>
                )}
              </div>

              {!editing && (
                <button onClick={startEdit}
                  className="shrink-0 text-sm border border-slate-300 text-slate-600 px-4 py-1.5 rounded-xl hover:bg-slate-50 transition">
                  Düzenle
                </button>
              )}
            </div>
          </div>

          {/* Mesaj */}
          {saveMsg && (
            <div className={`px-4 py-3 rounded-xl text-sm ${saveMsg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
              {saveMsg.text}
            </div>
          )}

          {/* Bilgi Formu */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-5">Kişisel Bilgiler</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ad *</label>
                {editing ? (
                  <input value={name} onChange={e => setName(e.target.value)} className={INPUT} />
                ) : (
                  <p className="text-sm text-slate-800 py-2">{profile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Soyad *</label>
                {editing ? (
                  <input value={surname} onChange={e => setSurname(e.target.value)} className={INPUT} />
                ) : (
                  <p className="text-sm text-slate-800 py-2">{profile.surname}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">E-posta</label>
                <p className="text-sm text-slate-500 py-2">{profile.email} <span className="text-xs text-slate-400">(değiştirilemez)</span></p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Telefon</label>
                {editing ? (
                  <input value={phone} onChange={e => setPhone(e.target.value)} className={INPUT} placeholder="05XX XXX XX XX" />
                ) : (
                  <p className="text-sm text-slate-800 py-2">{profile.phoneNumber || <span className="text-slate-400 italic">Eklenmemiş</span>}</p>
                )}
              </div>
            </div>

            {editing && (
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={commercialConsent} onChange={e => setCommercialConsent(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 border-slate-300" />
                  <span className="text-xs text-slate-600">Kampanya ve fırsatlardan haberdar olmak istiyorum</span>
                </label>
              </div>
            )}

            {!editing && profile.commercialConsent && (
              <p className="mt-4 text-xs text-teal-600">✓ Ticari iletişim iznini verdiniz</p>
            )}

            {editing && (
              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} disabled={saving}
                  className="bg-teal-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50">
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button onClick={cancelEdit}
                  className="border border-slate-300 text-slate-600 text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition">
                  Vazgeç
                </button>
              </div>
            )}
          </div>

          {/* Güvenlik Bölümü */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800">Güvenlik</h2>
              {!pwSection && (
                <button onClick={() => { setPwSection(true); setPwMsg(null); }}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium transition">
                  Şifremi Değiştir
                </button>
              )}
            </div>

            {!pwSection ? (
              <p className="text-sm text-slate-500">Hesabınızın güvenliği için düzenli aralıklarla şifrenizi değiştirmenizi öneririz.</p>
            ) : (
              <div className="space-y-3">
                {pwMsg && (
                  <div className={`px-4 py-3 rounded-xl text-sm ${pwMsg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                    {pwMsg.text}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Mevcut Şifre *</label>
                  <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                    className={INPUT} placeholder="••••••••" autoComplete="current-password" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Yeni Şifre *</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                    className={INPUT} placeholder="En az 8 karakter, büyük harf ve rakam" autoComplete="new-password" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Yeni Şifre (Tekrar) *</label>
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    className={INPUT} placeholder="••••••••" autoComplete="new-password" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={handleChangePassword} disabled={changingPw}
                    className="bg-teal-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50">
                    {changingPw ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
                  </button>
                  <button onClick={() => { setPwSection(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwMsg(null); }}
                    className="border border-slate-300 text-slate-600 text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition">
                    Vazgeç
                  </button>
                </div>
              </div>
            )}
          </div>

      {/* Mobil hızlı linkler */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:hidden">
        {NAV_LINKS.filter(l => l.href !== "/hesabim").map(l => (
          <Link key={l.href} href={l.href}
            className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:border-teal-300 hover:shadow-sm transition">
            <div className="text-2xl mb-1">{l.icon}</div>
            <span className="text-xs text-slate-600 font-medium">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
