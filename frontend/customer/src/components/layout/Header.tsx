"use client";

import Link from "next/link";
import { ShoppingCart, User, Search, Menu } from "lucide-react";
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
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 font-bold text-xl text-zinc-900">
            Ecom
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:flex">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full pl-4 pr-10 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <button type="submit" className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700">
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-1 text-sm text-zinc-700 hover:text-zinc-900">
                  <User size={20} />
                  <span className="hidden sm:inline">{user.name}</span>
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link href="/hesabim/siparisler" className="block px-4 py-2 text-sm hover:bg-zinc-50">
                    Siparişlerim
                  </Link>
                  <Link href="/hesabim/adresler" className="block px-4 py-2 text-sm hover:bg-zinc-50">
                    Adreslerim
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-zinc-50"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/giris" className="text-sm text-zinc-700 hover:text-zinc-900 flex items-center gap-1">
                <User size={20} />
                <span className="hidden sm:inline">Giriş</span>
              </Link>
            )}

            <Link href="/sepet" className="relative text-zinc-700 hover:text-zinc-900">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-zinc-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
