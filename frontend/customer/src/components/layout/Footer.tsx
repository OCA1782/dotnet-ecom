import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-indigo-900 via-violet-900 to-purple-900 text-indigo-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-extrabold text-xl mb-3">🛍️ Ecom</h3>
          <p className="text-sm text-indigo-300">Güvenilir alışverişin adresi.</p>
          <div className="flex gap-2 mt-4">
            <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm hover:bg-white/20 cursor-pointer transition">f</span>
            <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm hover:bg-white/20 cursor-pointer transition">in</span>
            <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm hover:bg-white/20 cursor-pointer transition">X</span>
          </div>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Hesabım</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/giris" className="hover:text-white transition">Giriş Yap</Link></li>
            <li><Link href="/kayit" className="hover:text-white transition">Kayıt Ol</Link></li>
            <li><Link href="/hesabim/siparisler" className="hover:text-white transition">Siparişlerim</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Yardım</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-white transition">SSS</Link></li>
            <li><Link href="#" className="hover:text-white transition">İade & Değişim</Link></li>
            <li><Link href="#" className="hover:text-white transition">Kargo Takibi</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Kurumsal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-white transition">Hakkımızda</Link></li>
            <li><Link href="#" className="hover:text-white transition">KVKK</Link></li>
            <li><Link href="#" className="hover:text-white transition">Gizlilik</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 text-center py-4 text-xs text-indigo-400">
        © 2026 Ecom. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
