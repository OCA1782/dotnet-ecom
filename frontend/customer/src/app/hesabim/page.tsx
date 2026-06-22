"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeSVG } from "qrcode.react";
import { useI18n } from "@/contexts/I18nContext";

const INPUT = "acct-input";

interface UserProfile {
  id: string;
  name: string;
  surname: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  commercialConsent: boolean;
  lastLoginDate?: string;
  twoFactorEnabled?: boolean;
  emailConfirmed?: boolean;
  phoneConfirmed?: boolean;
}

export default function HesabimPage() {
  const { t } = useI18n();
  const { user, loading: authLoading, updateUser } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const NAV_LINKS = [
    { href: "/hesabim",           label: t("account.nav.profile"),   icon: "👤" },
    { href: "/hesabim/siparisler", label: t("account.nav.orders"),    icon: "📦" },
    { href: "/hesabim/adresler",  label: t("account.nav.addresses"), icon: "📍" },
    { href: "/hesabim/favoriler", label: t("account.nav.favorites"), icon: "❤️" },
  ];

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [totpUri, setTotpUri] = useState("");
  const [tfaCode, setTfaCode] = useState("");
  const [tfaLoading, setTfaLoading] = useState(false);
  const [tfaMsg, setTfaMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [showQr, setShowQr] = useState(false);

  const [emailConfirmed, setEmailConfirmed] = useState(true);
  const [phoneConfirmed, setPhoneConfirmed] = useState(true);
  const [resending, setResending] = useState(false);
  const [verifMsg, setVerifMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [verifCodeEmail, setVerifCodeEmail] = useState("");
  const [verifCodePhone, setVerifCodePhone] = useState("");
  const [showVerifEmail, setShowVerifEmail] = useState(false);
  const [showVerifPhone, setShowVerifPhone] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

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
        setTwoFactorEnabled(p.twoFactorEnabled ?? false);
        setEmailConfirmed(p.emailConfirmed ?? true);
        setPhoneConfirmed(p.phoneConfirmed ?? true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function handleResendVerification() {
    setResending(true); setVerifMsg(null);
    try {
      const data = await api.post<{ emailSent: boolean; telegramSent: boolean }>("/api/users/me/resend-verification");
      if (data.emailSent) setShowVerifEmail(true);
      if (data.telegramSent) setShowVerifPhone(true);
      setVerifMsg({ text: t("account.verify.sent"), ok: true });
    } catch (e: unknown) {
      setVerifMsg({ text: e instanceof Error ? e.message : t("account.verify.send_fail"), ok: false });
    } finally { setResending(false); }
  }

  async function handleVerifyEmail() {
    if (verifCodeEmail.length !== 6) return;
    setVerifyingEmail(true); setVerifMsg(null);
    try {
      if (!profile) return;
      await api.post("/api/auth/verify-email", { userId: profile.id, code: verifCodeEmail });
      setEmailConfirmed(true);
      setShowVerifEmail(false);
      setVerifCodeEmail("");
      setVerifMsg({ text: t("account.verify.email_ok"), ok: true });
    } catch (e: unknown) {
      setVerifMsg({ text: e instanceof Error ? e.message : t("account.verify.fail"), ok: false });
    } finally { setVerifyingEmail(false); }
  }

  async function handleVerifyPhone() {
    if (verifCodePhone.length !== 6) return;
    setVerifyingPhone(true); setVerifMsg(null);
    try {
      if (!profile) return;
      await api.post("/api/auth/verify-telegram", { userId: profile.id, code: verifCodePhone });
      setPhoneConfirmed(true);
      setShowVerifPhone(false);
      setVerifCodePhone("");
      setVerifMsg({ text: t("account.verify.phone_ok"), ok: true });
    } catch (e: unknown) {
      setVerifMsg({ text: e instanceof Error ? e.message : t("account.verify.fail"), ok: false });
    } finally { setVerifyingPhone(false); }
  }

  async function handleSetup2FA() {
    setTfaLoading(true); setTfaMsg(null);
    try {
      const data = await api.post<{ secret: string; totpUri: string }>("/api/users/me/2fa/setup");
      setTotpUri(data.totpUri);
      setShowQr(true);
      setTfaCode("");
    } catch (e: unknown) {
      setTfaMsg({ text: e instanceof Error ? e.message : t("account.2fa.enabled_msg"), ok: false });
    } finally { setTfaLoading(false); }
  }

  async function handleEnable2FA() {
    if (tfaCode.length !== 6) return;
    setTfaLoading(true); setTfaMsg(null);
    try {
      await api.post("/api/users/me/2fa/enable", { code: tfaCode });
      setTwoFactorEnabled(true);
      setShowQr(false);
      setTotpUri("");
      setTfaCode("");
      setTfaMsg({ text: t("account.2fa.enabled_msg"), ok: true });
    } catch (e: unknown) {
      setTfaMsg({ text: e instanceof Error ? e.message : t("account.verify.fail"), ok: false });
    } finally { setTfaLoading(false); }
  }

  async function handleDisable2FA() {
    if (tfaCode.length !== 6) return;
    setTfaLoading(true); setTfaMsg(null);
    try {
      await api.post("/api/users/me/2fa/disable", { code: tfaCode });
      setTwoFactorEnabled(false);
      setTfaCode("");
      setTfaMsg({ text: t("account.2fa.disabled_msg"), ok: true });
    } catch (e: unknown) {
      setTfaMsg({ text: e instanceof Error ? e.message : t("account.verify.fail"), ok: false });
    } finally { setTfaLoading(false); }
  }

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
      setSaveMsg({ text: t("account.info.name_required"), ok: false });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.put("/api/users/me", { name: name.trim(), surname: surname.trim(), phoneNumber: phone.trim() || null, commercialConsent });
      setProfile(prev => prev ? { ...prev, name: name.trim(), surname: surname.trim(), phoneNumber: phone.trim() || undefined, commercialConsent } : prev);
      updateUser({ name: name.trim(), surname: surname.trim() });
      setEditing(false);
      setSaveMsg({ text: t("account.info.save_success"), ok: true });
    } catch (e: unknown) {
      setSaveMsg({ text: e instanceof Error ? e.message : t("account.info.save_fail"), ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!newPw || !currentPw) { setPwMsg({ text: t("account.security.all_required"), ok: false }); return; }
    if (newPw !== confirmPw) { setPwMsg({ text: t("account.security.pw_mismatch"), ok: false }); return; }
    setChangingPw(true);
    setPwMsg(null);
    try {
      await api.patch("/api/users/me/change-password", { currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw });
      setPwMsg({ text: t("account.security.pw_success"), ok: true });
      setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwSection(false);
    } catch (e: unknown) {
      setPwMsg({ text: e instanceof Error ? e.message : t("account.security.pw_fail"), ok: false });
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
      setSaveMsg({ text: t("account.info.avatar_success"), ok: true });
    } catch (e: unknown) {
      setSaveMsg({ text: e instanceof Error ? e.message : t("account.info.avatar_fail"), ok: false });
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
          <div className="acct-card">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                {profile.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt={profile.name} width={80} height={80}
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
                  title={t("account.profile.photo_title")}
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
                    {t("account.profile.last_login")} {new Date(profile.lastLoginDate).toLocaleString("tr-TR")}
                  </p>
                )}
              </div>

              {!editing && (
                <button onClick={startEdit} className="btn-ghost shrink-0">
                  {t("account.profile.edit_btn")}
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
          <div className="acct-card">
            <h2 className="text-base font-semibold text-slate-800 mb-5">{t("account.info.title")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t("account.info.name")}</label>
                {editing ? (
                  <input value={name} onChange={e => setName(e.target.value)} className={INPUT} />
                ) : (
                  <p className="text-sm text-slate-800 py-2">{profile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t("account.info.surname")}</label>
                {editing ? (
                  <input value={surname} onChange={e => setSurname(e.target.value)} className={INPUT} />
                ) : (
                  <p className="text-sm text-slate-800 py-2">{profile.surname}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t("account.info.email")}</label>
                <div className="py-2 space-y-1">
                  <p className="text-sm text-slate-500 break-all">
                    {profile.email} <span className="text-xs text-slate-400">{t("account.info.email_no_change")}</span>
                  </p>
                  {emailConfirmed ? (
                    <span className="badge-ok">
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
                      {t("account.info.verified")}
                    </span>
                  ) : (
                    <span className="badge-warn">
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {t("account.info.not_verified")}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t("account.info.phone")}</label>
                {editing ? (
                  <input value={phone} onChange={e => setPhone(e.target.value)} className={INPUT} placeholder={t("account.info.phone_placeholder")} />
                ) : (
                  <div className="py-2 space-y-1">
                    <p className="text-sm text-slate-800">{profile.phoneNumber || <span className="text-slate-400 italic">{t("account.info.phone_none")}</span>}</p>
                    {profile.phoneNumber && (
                      phoneConfirmed ? (
                        <span className="badge-ok">
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
                          {t("account.info.verified")}
                        </span>
                      ) : (
                        <span className="badge-warn">
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          {t("account.info.not_verified")}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {editing && (
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={commercialConsent} onChange={e => setCommercialConsent(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 border-slate-300" />
                  <span className="text-xs text-slate-600">{t("account.info.commercial_consent")}</span>
                </label>
              </div>
            )}

            {!editing && profile.commercialConsent && (
              <div className="mt-4">
                <span className="badge-consent">
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
                  {t("account.info.commercial_given")}
                </span>
              </div>
            )}

            {editing && (
              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} disabled={saving} className="btn-brand">
                  {saving ? t("account.info.saving") : t("account.info.save_btn")}
                </button>
                <button onClick={cancelEdit} className="btn-ghost">
                  {t("account.info.cancel")}
                </button>
              </div>
            )}
          </div>

          {/* Güvenlik Bölümü */}
          <div className="acct-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800">{t("account.security.title")}</h2>
              {!pwSection && (
                <button onClick={() => { setPwSection(true); setPwMsg(null); }} className="btn-link">
                  {t("account.security.change_pw_link")}
                </button>
              )}
            </div>

            {!pwSection ? (
              <p className="text-sm text-slate-500">{t("account.security.pw_hint")}</p>
            ) : (
              <div className="space-y-3">
                {pwMsg && (
                  <div className={`px-4 py-3 rounded-xl text-sm ${pwMsg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                    {pwMsg.text}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t("account.security.current_pw")}</label>
                  <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                    className={INPUT} placeholder="••••••••" autoComplete="current-password" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t("account.security.new_pw")}</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                    className={INPUT} placeholder={t("account.security.new_pw_placeholder")} autoComplete="new-password" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t("account.security.confirm_pw")}</label>
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    className={INPUT} placeholder="••••••••" autoComplete="new-password" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={handleChangePassword} disabled={changingPw} className="btn-brand">
                    {changingPw ? t("account.security.changing") : t("account.security.change_btn")}
                  </button>
                  <button onClick={() => { setPwSection(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwMsg(null); }} className="btn-ghost">
                    {t("account.security.cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hesap Doğrulama Bölümü */}
          {(!emailConfirmed || !phoneConfirmed) && (
            <div className="acct-card acct-card-warn">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-800">{t("account.verify.title")}</h2>
                <span className="badge-warn">{t("account.verify.pending")}</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">{t("account.verify.hint")}</p>

              {verifMsg && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${verifMsg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  {verifMsg.text}
                </div>
              )}

              <div className="space-y-4">
                {!emailConfirmed && (
                  <div className="border border-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span className="text-sm font-medium text-slate-700">{t("account.verify.email_not")}</span>
                    </div>
                    {showVerifEmail && (
                      <div className="flex gap-2">
                        <input
                          type="text" inputMode="numeric" maxLength={6} pattern="\d{6}"
                          value={verifCodeEmail} onChange={e => setVerifCodeEmail(e.target.value.replace(/\D/g, ""))}
                          placeholder={t("account.verify.code_placeholder")}
                          className="acct-input-otp flex-1"
                        />
                        <button onClick={handleVerifyEmail} disabled={verifyingEmail || verifCodeEmail.length !== 6} className="btn-brand">
                          {verifyingEmail ? "..." : t("account.verify.verify_btn")}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!phoneConfirmed && profile?.phoneNumber && (
                  <div className="border border-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span className="text-sm font-medium text-slate-700">{t("account.verify.phone_not")}</span>
                    </div>
                    {showVerifPhone && (
                      <div className="flex gap-2">
                        <input
                          type="text" inputMode="numeric" maxLength={6} pattern="\d{6}"
                          value={verifCodePhone} onChange={e => setVerifCodePhone(e.target.value.replace(/\D/g, ""))}
                          placeholder={t("account.verify.code_placeholder")}
                          className="acct-input-otp flex-1"
                        />
                        <button onClick={handleVerifyPhone} disabled={verifyingPhone || verifCodePhone.length !== 6} className="btn-brand">
                          {verifyingPhone ? "..." : t("account.verify.verify_btn")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button onClick={handleResendVerification} disabled={resending} className="btn-brand mt-4">
                {resending ? t("account.verify.sending") : t("account.verify.send_btn")}
              </button>
            </div>
          )}

          {/* 2FA Bölümü */}
          <div className="acct-card">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-slate-800">{t("account.2fa.title")}</h2>
              <span className={twoFactorEnabled ? "badge-brand" : "badge-muted"}>
                {twoFactorEnabled ? t("account.2fa.active") : t("account.2fa.inactive")}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-4">{t("account.2fa.hint")}</p>

            {tfaMsg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${tfaMsg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                {tfaMsg.text}
              </div>
            )}

            {!twoFactorEnabled && !showQr && (
              <button onClick={handleSetup2FA} disabled={tfaLoading} className="btn-brand">
                {tfaLoading ? t("account.2fa.preparing") : t("account.2fa.enable_btn")}
              </button>
            )}

            {!twoFactorEnabled && showQr && totpUri && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">{t("account.2fa.scan_hint")}</p>
                <div className="flex justify-center">
                  <div className="p-3 border border-slate-200 rounded-2xl bg-white inline-block">
                    <QRCodeSVG value={totpUri} size={180} />
                  </div>
                </div>
                <input
                  type="text" inputMode="numeric" maxLength={6} pattern="\d{6}"
                  value={tfaCode} onChange={e => setTfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="acct-input-otp w-full"
                />
                <div className="flex gap-3">
                  <button onClick={handleEnable2FA} disabled={tfaLoading || tfaCode.length !== 6} className="btn-brand">
                    {tfaLoading ? t("account.2fa.verifying") : t("account.2fa.confirm_btn")}
                  </button>
                  <button onClick={() => { setShowQr(false); setTotpUri(""); setTfaCode(""); setTfaMsg(null); }} className="btn-ghost">
                    {t("account.2fa.cancel")}
                  </button>
                </div>
              </div>
            )}

            {twoFactorEnabled && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">{t("account.2fa.disable_hint")}</p>
                <input
                  type="text" inputMode="numeric" maxLength={6} pattern="\d{6}"
                  value={tfaCode} onChange={e => setTfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="acct-input-otp w-full"
                />
                <button onClick={handleDisable2FA} disabled={tfaLoading || tfaCode.length !== 6} className="btn-danger">
                  {tfaLoading ? t("account.2fa.processing") : t("account.2fa.disable_btn")}
                </button>
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
