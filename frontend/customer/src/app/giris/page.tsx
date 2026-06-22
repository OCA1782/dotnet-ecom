"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, type LoginResult } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useI18n } from "@/contexts/I18nContext";

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<"login" | "2fa">("login");
  const [pendingUserId, setPendingUserId] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const { login, loginWithGoogle, completeLogin } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password, rememberMe);
      if (data.requiresTwoFactor) {
        setPendingUserId(data.userId);
        setStep("2fa");
        return;
      }
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.login"));
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setTwoFaLoading(true);
    try {
      const data = await api.post<LoginResult>("/api/auth/2fa", { userId: pendingUserId, code: totpCode, rememberMe });
      completeLogin(data);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.error"));
    } finally {
      setTwoFaLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) return;
    setError("");
    setLoading(true);
    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      if (data.requiresTwoFactor) {
        setPendingUserId(data.userId);
        setStep("2fa");
        return;
      }
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.login"));
    } finally {
      setLoading(false);
    }
  }

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  if (step === "2fa") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto bg-teal-50 rounded-2xl flex items-center justify-center mb-3">
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth={2}>
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{t("auth2.login.title")}</h1>
            <p className="text-sm text-slate-500 mt-1">{t("auth2.2fa.desc")}</p>
          </div>
          <form onSubmit={handleTwoFa} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              pattern="\d{6}"
              required
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className={`${INPUT} text-center text-2xl tracking-[0.5em] font-mono`}
              autoFocus
            />
            <button
              type="submit"
              disabled={twoFaLoading || totpCode.length !== 6}
              className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50"
            >
              {twoFaLoading ? t("auth2.2fa.verifying") : t("auth2.2fa.verify")}
            </button>
            <button type="button" onClick={() => { setStep("login"); setError(""); setTotpCode(""); }}
              className="w-full text-sm text-slate-400 hover:text-slate-600 transition">
              {t("auth2.2fa.back")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">{t("auth2.login.title")}</h1>

        {googleClientId && (
          <div className="mb-4">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError(t("auth2.login.google_error"))}
                text="signin_with"
                shape="rectangular"
                theme="outline"
                size="large"
                width="320"
              />
            </div>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">{t("auth2.login.or_email")}</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("auth2.login.email_label")}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("auth2.login.password_label")}</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={INPUT} />
          </div>
          <div className="flex items-center gap-2.5">
            <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-400 cursor-pointer" />
            <label htmlFor="rememberMe" className="text-sm text-slate-600 cursor-pointer select-none">
              {t("auth2.login.remember_me")}
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50"
          >
            {loading ? t("auth2.login.submitting") : t("auth2.login.submit")}
          </button>
        </form>
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-sm text-slate-600">
            {t("auth2.login.no_account")}{" "}
            <Link href="/kayit" className="text-teal-600 font-medium hover:underline">{t("nav.register")}</Link>
          </p>
          <Link href="/sifre-sifirla" className="text-sm text-slate-400 hover:text-slate-700 transition">
            {t("auth2.login.forgot_password")}
          </Link>
        </div>
      </div>
    </div>
  );
}
