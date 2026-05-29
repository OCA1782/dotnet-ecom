"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, User, Search } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

export default function Header({ logoUrl, logoIconUrl, siteName }: { logoUrl?: string; logoIconUrl?: string; siteName?: string }) {
  const { itemCount, fetchCart } = useCart();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const inButton = buttonRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inButton && !inDropdown) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const openMenu = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setMenuOpen(o => !o);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/urunler?s=${encodeURIComponent(search)}`);
  };

  const dropdown = menuOpen && menuPos && mounted ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: menuPos.top,
        right: menuPos.right,
        zIndex: 99999,
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "0.75rem",
        boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
        width: "13rem",
        overflow: "hidden",
      }}
    >
      <Link href="/hesabim" onClick={closeMenu}
        style={{ display: "block", padding: "0.625rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "#0f766e", textDecoration: "none", backgroundColor: "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f0fdfa")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        Hesabım
      </Link>
      <Link href="/hesabim/siparisler" onClick={closeMenu}
        style={{ display: "block", padding: "0.625rem 1rem", fontSize: "0.875rem", color: "#334155", textDecoration: "none", backgroundColor: "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f0fdfa")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        Siparişlerim
      </Link>
      <Link href="/hesabim/favoriler" onClick={closeMenu}
        style={{ display: "block", padding: "0.625rem 1rem", fontSize: "0.875rem", color: "#334155", textDecoration: "none", backgroundColor: "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f0fdfa")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        Favorilerim
      </Link>
      <Link href="/hesabim/adresler" onClick={closeMenu}
        style={{ display: "block", padding: "0.625rem 1rem", fontSize: "0.875rem", color: "#334155", textDecoration: "none", backgroundColor: "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f0fdfa")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        Adreslerim
      </Link>
      <Link href="/hesabim/faturalar" onClick={closeMenu}
        style={{ display: "block", padding: "0.625rem 1rem", fontSize: "0.875rem", color: "#334155", textDecoration: "none", backgroundColor: "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f0fdfa")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        Faturalarım
      </Link>
      <Link href="/hesabim/iadeler" onClick={closeMenu}
        style={{ display: "block", padding: "0.625rem 1rem", fontSize: "0.875rem", color: "#334155", textDecoration: "none", backgroundColor: "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f0fdfa")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        İadelerim
      </Link>
      <Link href="/hesabim/kuponlar" onClick={closeMenu}
        style={{ display: "block", padding: "0.625rem 1rem", fontSize: "0.875rem", color: "#334155", textDecoration: "none", backgroundColor: "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f0fdfa")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        Kuponlarım
      </Link>
      <Link href="/hesabim/yorumlar" onClick={closeMenu}
        style={{ display: "block", padding: "0.625rem 1rem", fontSize: "0.875rem", color: "#334155", textDecoration: "none", backgroundColor: "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f0fdfa")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        Yorumlarım
      </Link>
      <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "0" }} />
      <button
        onClick={() => { closeMenu(); logout(); }}
        style={{ display: "block", width: "100%", textAlign: "left", padding: "0.625rem 1rem", fontSize: "0.875rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fef2f2")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        Çıkış Yap
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <header
        data-tmpl-header
        className="sticky top-0 z-50 border-b transition-colors"
        style={{
          backgroundColor: "var(--tmpl-header-bg, #ffffff)",
          borderBottomColor: "var(--tmpl-header-border, #E3EFEE)",
          boxShadow: "var(--tmpl-header-shadow, 0 2px 12px rgba(18,48,74,0.07))",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-6 flex-wrap" data-header-inner>
            {/* Logo */}
            <Link href="/" data-slot="logo" className="flex-shrink-0 flex items-center gap-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={siteName ?? "Mağaza"} style={{ height: "56px", width: "auto", maxWidth: "240px", objectFit: "contain" }} />
              ) : logoIconUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoIconUrl} alt={siteName ?? "Mağaza"} style={{ height: "48px", width: "auto", objectFit: "contain" }} />
                  {siteName && <span className="text-base font-bold text-teal-700 tracking-tight hidden sm:inline">{siteName}</span>}
                </>
              ) : (
                <span className="text-lg font-bold text-teal-700 tracking-tight">{siteName ?? "Keyvora"}</span>
              )}
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} data-slot="search" className="flex-1 max-w-2xl hidden sm:flex">
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
            <div className="flex items-center gap-4" data-slot="actions">
              {user ? (
                <button
                  ref={buttonRef}
                  onClick={openMenu}
                  className="flex items-center gap-1.5 text-sm transition"
                >
                  <User size={20} />
                  <span className="hidden sm:inline font-medium">Merhaba, {user.name}</span>
                </button>
              ) : (
                <Link href="/giris" className="text-sm flex items-center gap-1.5 font-medium transition">
                  <User size={20} />
                  <span className="hidden sm:inline">Giriş</span>
                </Link>
              )}

              <Link href="/sepet" className="relative transition">
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
      {dropdown}
    </>
  );
}
