"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Mail, MessageCircle, Send } from "lucide-react";

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";

type Channel = "email" | "whatsapp" | "telegram";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [step, setStep] = useState<"channel" | "request" | "reset">(email && token ? "reset" : "channel");
  const [channel, setChannel] = useState<Channel>("email");
  const [requestEmail, setRequestEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChannelSelect(ch: Channel) {
    setChannel(ch);
    if (ch === "email") {
      setStep("request");
    } else if (ch === "whatsapp") {
      // Open WhatsApp with pre-filled support message
      const msg = encodeURIComponent("Merhaba! Şifremi unuttum, yardım alabilir miyim?");
      window.open(`https://wa.me/905550000000?text=${msg}`, "_blank");
    } else if (ch === "telegram") {
      window.open("https://t.me/keyvora_destek", "_blank");
    }
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email: requestEmail });
      setSuccess("E-posta adresinize şifre sıfırlama bağlantısı gönderildi. Spam klasörünü de kontrol edin.");
    } catch {
      setSuccess("E-posta adresinize şifre sıfırlama bağlantısı gönderildi. Spam klasörünü de kontrol edin.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) { setError("Şifreler eşleşmiyor"); return; }
    if (newPassword.length < 8) { setError("Şifre en az 8 karakter olmalıdır"); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { email, token, newPassword });
      setSuccess("Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.");
      setTimeout(() => router.push("/giris"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Geçersiz veya süresi dolmuş bağlantı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Şifremi Unuttum</h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          {step === "channel"  ? "Nasıl yardım almak istersiniz?" :
           step === "request"  ? "E-posta adresinize sıfırlama bağlantısı gönderelim." :
                                 "Yeni şifrenizi belirleyin."}
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl text-center">
            {success}
          </div>
        ) : step === "channel" ? (
          <div className="space-y-3">
            <button
              onClick={() => handleChannelSelect("email")}
              className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 rounded-2xl hover:border-teal-400 hover:bg-teal-50 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-200 transition">
                <Mail size={20} className="text-teal-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">E-posta ile Sıfırla</p>
                <p className="text-xs text-slate-500">Sıfırlama bağlantısı e-postanıza gelir</p>
              </div>
            </button>
            <button
              onClick={() => handleChannelSelect("whatsapp")}
              className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 rounded-2xl hover:border-green-400 hover:bg-green-50 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-200 transition">
                <MessageCircle size={20} className="text-green-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">WhatsApp Destek</p>
                <p className="text-xs text-slate-500">Destek hattına bağlanarak yardım alın</p>
              </div>
            </button>
            <button
              onClick={() => handleChannelSelect("telegram")}
              className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition">
                <Send size={20} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">Telegram Destek</p>
                <p className="text-xs text-slate-500">Telegram destek botumuzla iletişime geçin</p>
              </div>
            </button>
          </div>
        ) : step === "request" ? (
          <form onSubmit={handleRequest} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-posta Adresiniz</label>
              <input
                type="email"
                required
                value={requestEmail}
                onChange={e => setRequestEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className={INPUT}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50"
            >
              {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
            </button>
            <button
              type="button"
              onClick={() => setStep("channel")}
              className="w-full text-sm text-slate-400 hover:text-slate-600 transition"
            >
              ← Başka yöntem seç
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre</label>
              <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Şifre Tekrar</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className={INPUT} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : "Şifremi Güncelle"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/giris" className="text-slate-700 hover:underline">← Giriş sayfasına dön</Link>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-slate-400">Yükleniyor...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
