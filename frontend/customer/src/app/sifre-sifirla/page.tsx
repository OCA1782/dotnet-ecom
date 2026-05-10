"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const INPUT = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [step, setStep] = useState<"request" | "reset">(email && token ? "reset" : "request");
  const [requestEmail, setRequestEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email: requestEmail });
      setSuccess("E-posta adresinize şifre sıfırlama bağlantısı gönderildi.");
    } catch {
      setSuccess("E-posta adresinize şifre sıfırlama bağlantısı gönderildi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    if (newPassword.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır");
      return;
    }
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
          {step === "request"
            ? "E-posta adresinizi girin, sıfırlama bağlantısı gönderelim."
            : "Yeni şifrenizi belirleyin."}
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl text-center">
            {success}
          </div>
        ) : step === "request" ? (
          <form onSubmit={handleRequest} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
              <input
                type="email"
                required
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                className={INPUT}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50"
            >
              {loading ? "Gönderiliyor..." : "Bağlantı Gönder"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Şifre Tekrar</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={INPUT}
              />
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
