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
    <header className="sticky top-0 z-50 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 font-extrabold text-2xl text-white tracking-tight">
            🛍️ Ecom
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:flex">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full pl-4 pr-10 py-2 rounded-xl text-sm bg-white/20 text-white placeholder-white/70 border border-white/30 focus:outline-none focus:bg-white focus:text-zinc-900 focus:placeholder-zinc-400 transition"
              />
              <button type="submit" className="absolute right-3 top-2.5 text-white/80 hover:text-white">
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white">
                  <User size={20} />
                  <span className="hidden sm:inline font-medium">{user.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-indigo-100 rounded-xl shadow-xl shadow-indigo-100/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link href="/hesabim/siparisler" className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-t-xl">
                    Siparişlerim
                  </Link>
                  <Link href="/hesabim/adresler" className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-indigo-50 hover:text-indigo-700">
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
              <Link href="/giris" className="text-sm text-white/90 hover:text-white flex items-center gap-1.5 font-medium">
                <User size={20} />
                <span className="hidden sm:inline">Giriş</span>
              </Link>
            )}

            <Link href="/sepet" className="relative text-white/90 hover:text-white">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-400 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
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
