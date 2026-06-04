"use client";

import { formatPrice } from "@/lib/utils";
import { COUPON_TYPE_LABEL } from "@/types";

interface CouponForm {
  code: string;
  description: string;
  type: number;
  value: string;
  minOrderAmount: string;
  maxUsageCount: string;
  maxUsagePerUser: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

function formatDate(d: string) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CouponPreview({ form }: { form: CouponForm }) {
  if (!form.code) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center h-40 text-slate-400 text-xs text-center p-4">
        Kupon kodu girin
      </div>
    );
  }

  const value = parseFloat(form.value) || 0;
  const minOrder = parseFloat(form.minOrderAmount) || 0;
  const typeName = COUPON_TYPE_LABEL[form.type] ?? "—";
  const isPercent = form.type === 1;
  const valueLabel = isPercent ? `%${value}` : formatPrice(value);

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Kupon Görünümü</p>

      {/* Coupon card */}
      <div className="bg-gradient-to-br from-[#12304A] to-[#1a4670] rounded-2xl p-5 text-white shadow-lg overflow-hidden relative">
        {/* Decorative */}
        <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/5 rounded-full" />
        <div className="absolute right-6 bottom-2 text-[60px] font-black text-white/10 leading-none select-none">
          {isPercent ? "%" : "₺"}
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1">Kupon Kodu</p>
              <p className="text-2xl font-black tracking-widest">{form.code}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${form.isActive ? "bg-green-400/20 text-green-300" : "bg-white/10 text-white/50"}`}>
              {form.isActive ? "Aktif" : "Pasif"}
            </span>
          </div>

          <div className="bg-white/10 rounded-xl px-3 py-2 mb-3 inline-block">
            <span className="text-lg font-extrabold">{valueLabel}</span>
            <span className="text-xs text-white/70 ml-1.5">indirim</span>
          </div>

          {form.description && (
            <p className="text-xs text-white/80 mb-3">{form.description}</p>
          )}

          <div className="space-y-1 text-[11px] text-white/70">
            <p>Tür: <span className="text-white font-semibold">{typeName}</span></p>
            {minOrder > 0 && (
              <p>Min. sepet: <span className="text-white font-semibold">{formatPrice(minOrder)}</span></p>
            )}
            {form.maxUsageCount && (
              <p>Max kullanım: <span className="text-white font-semibold">{form.maxUsageCount}</span></p>
            )}
            {form.maxUsagePerUser && (
              <p>Kişi başı: <span className="text-white font-semibold">{form.maxUsagePerUser}</span></p>
            )}
            {(form.startDate || form.endDate) && (
              <p>
                Geçerlilik: <span className="text-white font-semibold">
                  {formatDate(form.startDate) ?? "—"} → {formatDate(form.endDate) ?? "∞"}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Checkout appearance */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sepet Görünümü</p>
        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🏷️</span>
            <div>
              <p className="text-xs font-bold text-slate-800">{form.code}</p>
              <p className="text-[10px] text-slate-500">{valueLabel} indirim</p>
            </div>
          </div>
          <span className="text-xs font-bold text-teal-600">Uygulandı ✓</span>
        </div>
      </div>
    </div>
  );
}
