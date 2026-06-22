"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";

export default function IadeDegisimPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  const POLICY_ITEMS = [
    { icon: "📅", title: t("returns.page.policy.day14.title"), desc: t("returns.page.policy.day14.desc") },
    { icon: "📦", title: t("returns.page.policy.package.title"), desc: t("returns.page.policy.package.desc") },
    { icon: "🚚", title: t("returns.page.policy.shipping.title"), desc: t("returns.page.policy.shipping.desc") },
    { icon: "💳", title: t("returns.page.policy.refund.title"), desc: t("returns.page.policy.refund.desc") },
  ];

  const [orderNumber, setOrderNumber] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      await api.post(`/api/orders/${orderNumber.trim()}/request-refund`, {
        reason: reason.trim() || undefined,
      });
      setResult({ text: t("returns.page.success"), ok: true });
      setOrderNumber("");
      setReason("");
    } catch (e: unknown) {
      setResult({ text: e instanceof Error ? e.message : t("returns.page.error"), ok: false });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t("returns.page.title")}</h1>
        <p className="text-slate-500">{t("returns.page.desc")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {POLICY_ITEMS.map((item) => (
          <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-base font-semibold text-slate-800">{t("returns.page.request_title")}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t("returns.page.request_desc")}</p>
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t("returns.page.order_no")}</label>
              <input
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder="SIP-20260601-000001"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {t("returns.page.order_hint")}{" "}
                <Link href="/hesabim/siparisler" className="text-teal-600 underline">→</Link>
              </p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t("returns.page.reason_label")}</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder={t("returns.page.reason_placeholder")}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              />
            </div>
            {result && (
              <div className={`px-4 py-3 rounded-xl text-sm ${result.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                {result.text}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !orderNumber.trim()}
              className="w-full bg-teal-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50"
            >
              {submitting ? t("returns.page.sending") : t("returns.page.submit")}
            </button>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <p className="text-sm text-slate-600">
              {t("returns.page.login_required")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/giris?redirect=/hesabim/siparisler"
                className="bg-teal-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-teal-700 transition"
              >
                {t("returns.page.login")}
              </Link>
              <Link
                href="/siparis-sorgula"
                className="border border-slate-300 text-slate-600 text-sm px-6 py-2.5 rounded-xl hover:bg-slate-50 transition"
              >
                {t("returns.page.guest")}
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-sm font-semibold text-amber-800 mb-2">{t("returns.page.not_refundable")}</p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>{t("returns.page.nr.custom")}</li>
          <li>{t("returns.page.nr.digital")}</li>
          <li>{t("returns.page.nr.cosmetic")}</li>
          <li>{t("returns.page.nr.food")}</li>
        </ul>
      </div>

      <p className="text-sm text-slate-500 text-center">
        Sorularınız için{" "}
        <Link href="/iletisim" className="text-teal-600 hover:underline font-medium">
          iletişim sayfamızı
        </Link>{" "}
        ziyaret edin veya siparişinizi{" "}
        <Link href="/siparis-sorgula" className="text-teal-600 hover:underline font-medium">
          sorgulayın
        </Link>.
      </p>
    </div>
  );
}
