"use client";

interface BrandForm {
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  isActive: boolean;
}

export default function BrandPreview({ form }: { form: BrandForm }) {
  if (!form.name) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center h-40 text-slate-400 text-xs text-center p-4">
        Marka adı girin
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Marka Kartı</p>

      {/* Brand card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
          {form.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.logoUrl} alt={form.name} className="max-h-20 max-w-full object-contain" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[#12304A] flex items-center justify-center">
              <span className="text-white font-black text-2xl">{form.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="px-4 pb-4 text-center">
          <h3 className="font-bold text-slate-800 text-sm">{form.name}</h3>
          {form.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{form.description}</p>
          )}
        </div>
      </div>

      {/* URL preview */}
      <div className="bg-white rounded-xl border border-slate-100 px-3 py-2">
        <p className="text-[10px] text-slate-400 font-medium">Filtre URL</p>
        <p className="text-xs text-teal-700 font-mono truncate">/urunler?marka={form.slug || "..."}</p>
      </div>

      <div className="flex gap-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${form.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {form.isActive ? "Aktif" : "Pasif"}
        </span>
      </div>
    </div>
  );
}
