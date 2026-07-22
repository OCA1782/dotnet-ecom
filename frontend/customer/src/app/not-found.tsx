import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-black text-teal-100 select-none leading-none mb-2">404</p>
      <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Sayfa Bulunamadı</h1>
      <p className="text-slate-500 text-sm mb-8 max-w-sm">
        Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
        >
          Anasayfaya Dön
        </Link>
        <Link
          href="/urunler"
          className="border border-teal-200 text-teal-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-50 transition"
        >
          Ürünlere Göz At
        </Link>
      </div>
    </div>
  );
}
