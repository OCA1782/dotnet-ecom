"use client";

import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";

interface Props {
  productId: string;
  variantId?: string;
}

export default function StockNotificationForm({ productId, variantId }: Props) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${apiUrl}/api/stock-notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId: variantId ?? null, email: email.trim() }),
      });
      if (res.ok) {
        setStatus("done");
      } else {
        setError("Bir hata oluştu, lütfen tekrar deneyin.");
        setStatus("error");
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <span className="text-green-500 text-lg shrink-0">✓</span>
        <div>
          <p className="text-sm font-semibold text-green-800">Bildirim kaydedildi!</p>
          <p className="text-xs text-green-600 mt-0.5">Ürün stoğa girdiğinde <strong>{email}</strong> adresine e-posta göndereceğiz.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-orange-100 bg-orange-50/50 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-800 mb-1">Gelince Haber Ver</p>
      <p className="text-xs text-gray-500 mb-3">E-posta adresinizi bırakın, ürün stoğa girince bildiririz.</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="E-posta adresiniz"
          required
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 bg-white min-w-0"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-60"
        >
          {status === "loading" ? "..." : "Bildir"}
        </button>
      </form>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
