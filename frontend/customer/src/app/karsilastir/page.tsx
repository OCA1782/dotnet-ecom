import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import type { ProductDetail } from "@/types";

const API_BASE = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

export const metadata: Metadata = { title: "Ürün Karşılaştırma" };

async function fetchProduct(id: string): Promise<ProductDetail | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${API_BASE}/api/products/${id}`, { cache: "no-store", signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const ROWS: { label: string; render: (p: ProductDetail) => ReactNode }[] = [
  { label: "Görsel", render: p => p.imageUrl
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={p.imageUrl} alt={p.name} className="w-28 h-28 object-contain mx-auto" />
    : <span className="text-5xl">📦</span>
  },
  { label: "Ürün Adı", render: p => (
    <Link href={`/urun/${p.slug}`} className="font-semibold text-[#12304A] hover:text-teal-600 transition text-sm leading-snug">
      {p.name}
    </Link>
  )},
  { label: "Marka", render: p => p.brandName ?? "—" },
  { label: "Kategori", render: p => p.categoryName ?? "—" },
  { label: "Fiyat", render: p => (
    <span className="font-bold text-[#008F86] text-base">
      {formatPrice(p.discountPrice ?? p.price)}
      {p.discountPrice && (
        <span className="ml-1.5 text-xs text-slate-400 line-through font-normal">{formatPrice(p.price)}</span>
      )}
    </span>
  )},
  { label: "Stok", render: p => p.availableStock > 0
    ? <span className="text-green-600 font-medium">Stokta var</span>
    : <span className="text-red-500 font-medium">Tükendi</span>
  },
  { label: "Varyant Sayısı", render: p => p.variants?.length ?? 0 },
  { label: "Açıklama", render: p => (
    <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">{p.description || "—"}</p>
  )},
];

type SearchParams = Promise<{ ids?: string }>;

export default async function KarsilastirPage({ searchParams }: { searchParams: SearchParams }) {
  const { ids: rawIds } = await searchParams;
  const ids = (rawIds ?? "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 4);

  if (ids.length < 2) notFound();

  const results = await Promise.all(ids.map(fetchProduct));
  const products = results.filter((p): p is ProductDetail => p !== null);

  if (products.length < 2) notFound();

  const colWidth = `${100 / products.length}%`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 pb-28">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#12304A]">Ürün Karşılaştırma</h1>
          <p className="text-sm text-slate-500 mt-1">{products.length} ürün karşılaştırılıyor</p>
        </div>
        <Link href="/urunler" className="text-sm text-teal-600 hover:underline">
          ← Ürünlere dön
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full border-collapse min-w-[480px]">
          <colgroup>
            <col style={{ width: "140px" }} />
            {products.map((_, i) => <col key={i} style={{ width: colWidth }} />)}
          </colgroup>
          <tbody>
            {ROWS.map(row => (
              <tr key={row.label} className="border-b border-slate-100 last:border-0 even:bg-slate-50/60">
                <td className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-r border-slate-200 whitespace-nowrap align-middle">
                  {row.label}
                </td>
                {products.map(p => (
                  <td key={p.id} className="px-5 py-4 text-sm text-slate-700 text-center align-middle border-r border-slate-100 last:border-0">
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-slate-50 border-t border-slate-200">
              <td className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-r border-slate-200">
                İşlem
              </td>
              {products.map(p => (
                <td key={p.id} className="px-5 py-4 text-center border-r border-slate-100 last:border-0">
                  <Link
                    href={`/urun/${p.slug}`}
                    className="inline-block bg-[#12304A] hover:bg-[#FF7A45] text-white text-xs font-semibold px-4 py-2 rounded-xl transition">
                    İncele
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
