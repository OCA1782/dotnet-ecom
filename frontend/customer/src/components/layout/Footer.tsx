import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-zinc-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-semibold mb-3">Ecom</h3>
          <p className="text-sm">Güvenilir alışverişin adresi.</p>
        </div>
        <div>
          <h4 className="text-white text-sm font-medium mb-3">Hesabım</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/giris" className="hover:text-white">Giriş Yap</Link></li>
            <li><Link href="/kayit" className="hover:text-white">Kayıt Ol</Link></li>
            <li><Link href="/hesabim/siparisler" className="hover:text-white">Siparişlerim</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-medium mb-3">Yardım</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-white">SSS</Link></li>
            <li><Link href="#" className="hover:text-white">İade & Değişim</Link></li>
            <li><Link href="#" className="hover:text-white">Kargo Takibi</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-medium mb-3">Kurumsal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-white">Hakkımızda</Link></li>
            <li><Link href="#" className="hover:text-white">KVKK</Link></li>
            <li><Link href="#" className="hover:text-white">Gizlilik</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800 text-center py-4 text-xs">
        © 2026 Ecom. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
