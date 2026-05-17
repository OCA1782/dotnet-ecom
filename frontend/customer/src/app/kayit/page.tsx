"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, type PendingRegistration } from "@/hooks/useAuth";
import { CheckCircle, Mail, MessageCircle, Loader2 } from "lucide-react";

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";
const CODE_INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-teal-400";

export default function RegisterPage() {
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
      setFormError("Şifreler eşleşmiyor");
      return;
    }
    setFormLoading(true);
    try {
      const data = await register(form.email, form.password, form.name, form.surname, form.phone || undefined);
      setPending(data);
      setStep("verify");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Kayıt başarısız");
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
      if (result.token) {
        router.push("/");
      }
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : "Kod geçersiz");
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
      if (result.token) {
        router.push("/");
      }
    } catch (err: unknown) {
      setTelegramError(err instanceof Error ? err.message : "Kod geçersiz");
    } finally {
      setTelegramLoading(false);
    }
  }

  if (step === "form") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">Kayıt Ol</h1>
          <form onSubmit={handleRegister} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ad</label>
                <input name="name" required value={form.name} onChange={handleChange} className={INPUT} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Soyad</label>
                <input name="surname" required value={form.surname} onChange={handleChange} className={INPUT} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
              <input type="text" inputMode="email" name="email" required autoComplete="new-email" value={form.email} onChange={handleChange} className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cep Telefonu</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={INPUT} placeholder="05XX XXX XX XX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
              <input type="password" name="password" required value={form.password} onChange={handleChange} className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Şifre Tekrar</label>
              <input type="password" name="passwordConfirm" required value={form.passwordConfirm} onChange={handleChange} className={INPUT} />
            </div>
            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {formLoading && <Loader2 size={16} className="animate-spin" />}
              {formLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Zaten hesabın var mı?{" "}
            <Link href="/giris" className="text-teal-600 font-medium hover:underline">
              Giriş Yap
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
          <h1 className="text-2xl font-bold text-slate-900">Hesabını Doğrula</h1>
          <p className="text-sm text-slate-500 mt-1">
            <span className="font-medium text-slate-700">{pending?.email}</span> adresine ve Telegram&apos;a ayrı kodlar gönderdik.
          </p>
        </div>

        <div className={`bg-white border rounded-2xl p-6 shadow-sm transition-all ${emailConfirmed ? "border-teal-300" : "border-slate-200"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${emailConfirmed ? "bg-teal-100" : "bg-slate-100"}`}>
              <Mail size={18} className={emailConfirmed ? "text-teal-600" : "text-slate-500"} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-sm">E-posta Doğrulama</p>
              <p className="text-xs text-slate-500">{pending?.email}</p>
            </div>
            {emailConfirmed && <CheckCircle size={20} className="text-teal-500 shrink-0" />}
          </div>

          {emailConfirmed ? (
            <p className="text-sm text-teal-600 font-medium text-center py-2">E-posta doğrulandı ✓</p>
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
                {emailLoading ? "Doğrulanıyor..." : "E-postayı Doğrula"}
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
              <p className="font-semibold text-slate-800 text-sm">Telegram Doğrulama</p>
              <p className="text-xs text-slate-500">Telegram hesabınıza gelen kodu girin</p>
            </div>
            {telegramConfirmed && <CheckCircle size={20} className="text-teal-500 shrink-0" />}
          </div>

          {telegramConfirmed ? (
            <p className="text-sm text-teal-600 font-medium text-center py-2">Telegram doğrulandı ✓</p>
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
                {telegramLoading ? "Doğrulanıyor..." : "Telegram'ı Doğrula"}
              </button>
            </form>
          )}
        </div>

        {(emailConfirmed || telegramConfirmed) && !(emailConfirmed && telegramConfirmed) && (
          <p className="text-center text-sm text-slate-500">
            Alışverişe başlamak için her iki doğrulamayı da tamamlayın.
          </p>
        )}
      </div>
    </div>
  );
}
