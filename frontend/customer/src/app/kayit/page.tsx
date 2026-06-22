"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, type PendingRegistration } from "@/hooks/useAuth";
import { CheckCircle, Mail, MessageCircle, Loader2 } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";
const CODE_INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-teal-400";

export default function RegisterPage() {
  const { t } = useI18n();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [pending, setPending] = useState<PendingRegistration | null>(null);

  const [form, setForm] = useState({ name: "", surname: "", email: "", phone: "", password: "", passwordConfirm: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [emailCode, setEmailCode] = useState("");
  const [telegramCode, setTelegramCode] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [telegramConfirmed, setTelegramConfirmed] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [telegramError, setTelegramError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);

  const { register, verifyEmail, verifyTelegram } = useAuth();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (form.password !== form.passwordConfirm) {
      setFormError(t("auth2.register.password_mismatch"));
      return;
    }
    setFormLoading(true);
    try {
      const data = await register(form.email, form.password, form.name, form.surname, form.phone || undefined);
      setPending(data);
      setStep("verify");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : t("auth.register"));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleVerifyEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setEmailError("");
    setEmailLoading(true);
    try {
      const result = await verifyEmail(pending.userId, emailCode);
      setEmailConfirmed(result.emailConfirmed);
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : t("auth2.verify.code_invalid"));
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleVerifyTelegram(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setTelegramError("");
    setTelegramLoading(true);
    try {
      const result = await verifyTelegram(pending.userId, telegramCode);
      setTelegramConfirmed(result.phoneConfirmed);
      if (result.token) router.push("/");
    } catch (err: unknown) {
      setTelegramError(err instanceof Error ? err.message : t("auth2.verify.code_invalid"));
    } finally {
      setTelegramLoading(false);
    }
  }

  if (step === "form") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">{t("auth2.register.title")}</h1>
          <form onSubmit={handleRegister} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("auth2.register.name_label")}</label>
                <input name="name" required value={form.name} onChange={handleChange} className={INPUT} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("auth2.register.surname_label")}</label>
                <input name="surname" required value={form.surname} onChange={handleChange} className={INPUT} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("auth2.register.email_label")}</label>
              <input type="text" inputMode="email" name="email" required autoComplete="new-email" value={form.email} onChange={handleChange} className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("auth2.register.phone_label")}</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={INPUT} placeholder="05XX XXX XX XX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("auth2.register.password_label")}</label>
              <input type="password" name="password" required value={form.password} onChange={handleChange} className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("auth2.register.password_confirm_label")}</label>
              <input type="password" name="passwordConfirm" required value={form.passwordConfirm} onChange={handleChange} className={INPUT} />
            </div>
            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {formLoading && <Loader2 size={16} className="animate-spin" />}
              {formLoading ? t("auth2.register.submitting") : t("auth2.register.submit")}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            {t("auth2.register.already_member")}{" "}
            <Link href="/giris" className="text-teal-600 font-medium hover:underline">
              {t("nav.login")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{t("auth2.verify.title")}</h1>
          <p className="text-sm text-slate-500 mt-1">
            <span className="font-medium text-slate-700">{pending?.email}</span> {t("auth2.verify.desc")}
          </p>
        </div>

        <div className={`bg-white border rounded-2xl p-6 shadow-sm transition-all ${emailConfirmed ? "border-teal-300" : "border-slate-200"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${emailConfirmed ? "bg-teal-100" : "bg-slate-100"}`}>
              <Mail size={18} className={emailConfirmed ? "text-teal-600" : "text-slate-500"} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-sm">{t("auth2.verify.email_section")}</p>
              <p className="text-xs text-slate-500">{pending?.email}</p>
            </div>
            {emailConfirmed && <CheckCircle size={20} className="text-teal-500 shrink-0" />}
          </div>

          {emailConfirmed ? (
            <p className="text-sm text-teal-600 font-medium text-center py-2">{t("auth2.verify.email_verified")}</p>
          ) : (
            <form onSubmit={handleVerifyEmail} className="space-y-3">
              {emailError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                  {emailError}
                </div>
              )}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={CODE_INPUT}
              />
              <button
                type="submit"
                disabled={emailLoading || emailCode.length < 6}
                className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {emailLoading && <Loader2 size={14} className="animate-spin" />}
                {emailLoading ? t("auth2.verify.email_btn_loading") : t("auth2.verify.email_btn")}
              </button>
            </form>
          )}
        </div>

        <div className={`bg-white border rounded-2xl p-6 shadow-sm transition-all ${telegramConfirmed ? "border-teal-300" : "border-slate-200"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${telegramConfirmed ? "bg-teal-100" : "bg-slate-100"}`}>
              <MessageCircle size={18} className={telegramConfirmed ? "text-teal-600" : "text-slate-500"} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-sm">{t("auth2.verify.telegram_section")}</p>
              <p className="text-xs text-slate-500">{t("auth2.verify.telegram_label")}</p>
            </div>
            {telegramConfirmed && <CheckCircle size={20} className="text-teal-500 shrink-0" />}
          </div>

          {telegramConfirmed ? (
            <p className="text-sm text-teal-600 font-medium text-center py-2">{t("auth2.verify.telegram_verified")}</p>
          ) : (
            <form onSubmit={handleVerifyTelegram} className="space-y-3">
              {telegramError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                  {telegramError}
                </div>
              )}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={telegramCode}
                onChange={(e) => setTelegramCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={CODE_INPUT}
              />
              <button
                type="submit"
                disabled={telegramLoading || telegramCode.length < 6}
                className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {telegramLoading && <Loader2 size={14} className="animate-spin" />}
                {telegramLoading ? t("auth2.verify.telegram_btn_loading") : t("auth2.verify.telegram_btn")}
              </button>
            </form>
          )}
        </div>

        {emailConfirmed && !telegramConfirmed && (
          <div className="text-center space-y-3">
            <p className="text-sm text-slate-500">
              {t("auth2.verify.telegram_optional")}
            </p>
            <button
              onClick={() => router.push("/")}
              className="inline-block bg-teal-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-teal-700 transition"
            >
              {t("auth2.verify.continue_shopping")}
            </button>
          </div>
        )}
        {telegramConfirmed && (
          <div className="text-center">
            <button
              onClick={() => router.push("/")}
              className="inline-block bg-teal-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-teal-700 transition"
            >
              {t("auth2.verify.continue_shopping")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
