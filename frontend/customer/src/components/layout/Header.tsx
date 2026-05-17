"use client";

import Link from "next/link";
import { ShoppingCart, User, Search } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export default function Header() {
  const { itemCount, fetchCart } = useCart();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/urunler?s=${encodeURIComponent(search)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E3EFEE]" style={{ boxShadow: "0 2px 12px rgba(18,48,74,0.07)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 gap-6">
          {/* Logo — crop top whitespace (~35% of canvas) */}
          <Link href="/" className="flex-shrink-0 block" style={{ height: '56px', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Keyvora" style={{ height: '160px', width: 'auto', marginTop: '-54px' }} />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden sm:flex">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ürün, kategori veya marka ara..."
                className="w-full pl-5 pr-12 py-3 rounded-2xl text-sm bg-white text-slate-900 placeholder-slate-400 border-2 border-teal-200 focus:outline-none focus:border-teal-400 transition"
              />
              <button type="submit" className="absolute right-3 top-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl p-1.5 transition">
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-teal-600 transition">
                  <User size={20} />
                  <span className="hidden sm:inline font-medium">Merhaba, {user.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-teal-100 rounded-xl shadow-xl shadow-teal-100/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link href="/hesabim/siparisler" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 rounded-t-xl">
                    Siparişlerim
                  </Link>
                  <Link href="/hesabim/favoriler" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700">
                    Favorilerim
                  </Link>
                  <Link href="/hesabim/adresler" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700">
                    Adreslerim
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-b-xl"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/giris" className="text-sm text-slate-700 hover:text-teal-600 flex items-center gap-1.5 font-medium transition">
                <User size={20} />
                <span className="hidden sm:inline">Giriş</span>
              </Link>
            )}

            <Link href="/sepet" className="relative text-slate-700 hover:text-teal-600 transition">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
