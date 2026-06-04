"use client";

interface UserForm {
  name: string;
  surname: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  role: string;
  avatarUrl?: string;
  profileImageUrl?: string;
}

const ROLE_LABELS: Record<string, string> = {
  Customer: "Müşteri",
  Admin: "Admin",
  ProductManager: "Ürün Yöneticisi",
  StockManager: "Stok Yöneticisi",
  OrderManager: "Sipariş Yöneticisi",
  FinanceUser: "Finans",
  CustomerSupport: "Müşteri Destek",
  ContentManager: "İçerik Yöneticisi",
  SuperAdmin: "Süper Admin",
};

export function UserPreview({ form }: { form: UserForm }) {
  const avatarUrl = form.avatarUrl || form.profileImageUrl || "";
  const phone = form.phone || form.phoneNumber || "";
  const initials = `${form.name?.[0] ?? ""}${form.surname?.[0] ?? ""}`.toUpperCase();
  const displayName = `${form.name || "Ad"} ${form.surname || "Soyad"}`.trim();
  const roleLabel = ROLE_LABELS[form.role] ?? form.role;

  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Müşteri Profili Önizleme</p>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-[#E3EFEE] shadow-sm overflow-hidden">
        {/* Header banner */}
        <div className="h-20 bg-gradient-to-r from-[#12304A] to-[#1a4a6e]" />

        {/* Avatar + info */}
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-9 mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-white shadow-md bg-[#008F86] flex items-center justify-center overflow-hidden shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                : <span className="text-white text-lg font-bold">{initials || "??"}</span>
              }
            </div>
            <div className="mb-1">
              <p className="font-bold text-slate-800 text-base leading-tight">
                {displayName || <span className="text-slate-300">Ad Soyad</span>}
              </p>
              <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold bg-teal-100 text-teal-700 mt-1">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 border-t border-slate-100 pt-4">
            <InfoRow label="E-posta" value={form.email || <span className="text-slate-300 italic">—</span>} icon="✉️" />
            <InfoRow label="Telefon" value={phone || <span className="text-slate-300 italic">—</span>} icon="📱" />
          </div>
        </div>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-[#E3EFEE] px-4 py-3 text-center">
          <p className="text-lg font-bold text-[#12304A]">0</p>
          <p className="text-xs text-slate-500">Sipariş</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E3EFEE] px-4 py-3 text-center">
          <p className="text-lg font-bold text-[#008F86]">0</p>
          <p className="text-xs text-slate-500">Favori</p>
        </div>
      </div>

      {/* URL hint */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 font-mono truncate">
        /hesabim/profil
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-base w-5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
