"use client";

interface CategoryForm {
  name: string;
  slug: string;
  imageUrl: string;
  parentCategoryId: string;
  showInMenu: boolean;
  isActive: boolean;
}

const PREVIEW_STYLE = { card: "border-teal-100 bg-teal-50", icon: "bg-teal-100" };

export default function CategoryPreview({ form }: { form: CategoryForm }) {
  if (!form.name) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center h-40 text-slate-400 text-xs text-center p-4">
        Kategori adı girin
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Kategori Kartı</p>

      {/* Category card — replicates homepage categories section */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${PREVIEW_STYLE.card}`}>
        <div className={`h-28 flex items-center justify-center text-4xl overflow-hidden ${!form.imageUrl ? PREVIEW_STYLE.icon : ""}`}>
          {form.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imageUrl} alt={form.name} className="w-full h-full object-cover" />
          ) : (
            "📦"
          )}
        </div>
        <div className="p-3 text-center bg-white/60">
          <span className="text-sm font-semibold text-slate-700">{form.name}</span>
        </div>
      </div>

      {/* URL preview */}
      <div className="bg-white rounded-xl border border-slate-100 px-3 py-2">
        <p className="text-[10px] text-slate-400 font-medium">URL</p>
        <p className="text-xs text-teal-700 font-mono truncate">/urunler?kategori={form.slug || "..."}</p>
      </div>

      {/* Status */}
      <div className="flex gap-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${form.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {form.isActive ? "Aktif" : "Pasif"}
        </span>
        {form.showInMenu && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">Menüde</span>
        )}
        {form.parentCategoryId && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Alt Kategori</span>
        )}
      </div>
    </div>
  );
}
