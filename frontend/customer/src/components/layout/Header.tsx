"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingCart, User, Search, Loader2, Tag, Layers } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import BrandLogo from "@/components/BrandLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/contexts/I18nContext";

type SuggestionItem = {
  type: "product" | "brand" | "category";
  name: string;
  slug: string;
  imageUrl?: string;
  price?: number;
  subText?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

export default function Header({ logoUrl, siteName, languageSwitcherEnabled = true }: { logoUrl?: string; siteName?: string; languageSwitcherEnabled?: boolean }) {
  const { t } = useI18n();
  const { itemCount, fetchCart } = useCart();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const inButton = buttonRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inButton && !inDropdown) setMenuOpen(false);
      if (!searchRef.current?.contains(target)) setSuggestOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.length < 2) {
      const timer = window.setTimeout(() => {
        setSuggestions([]);
        setSuggestOpen(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    window.setTimeout(() => setSuggestLoading(true), 0);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/suggestions?q=${encodeURIComponent(search)}&limit=9`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.items ?? []);
          setTotalProducts(data.totalProducts ?? 0);
          setSuggestOpen(true);
          setActiveIdx(-1);
        }
      } catch {
        // ignore
      } finally {
        setSuggestLoading(false);
      }
    }, 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const openMenu = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setMenuOpen(o => !o);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const accountLinks = [
    { href: "/hesabim", label: t("header.account") },
    { href: "/hesabim/siparisler", label: t("header.orders") },
    { href: "/hesabim/favoriler", label: t("header.favorites") },
    { href: "/hesabim/adresler", label: t("header.addresses") },
    { href: "/hesabim/faturalar", label: t("header.invoices") },
    { href: "/hesabim/iadeler", label: t("header.returns") },
    { href: "/hesabim/kuponlar", label: t("header.coupons") },
    { href: "/hesabim/yorumlar", label: t("header.reviews") },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setSuggestOpen(false);
      router.push(`/urunler?s=${encodeURIComponent(search)}`);
    }
  };

  const handleSuggestionClick = (item: SuggestionItem) => {
    setSuggestOpen(false);
    setSearch("");
    router.push(item.slug);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setSuggestOpen(false);
      setActiveIdx(-1);
    }
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
      {accountLinks.map((item, index) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={closeMenu}
          style={{
            display: "block",
            padding: "0.625rem 1rem",
            fontSize: "0.875rem",
            fontWeight: index === 0 ? 600 : 400,
            color: index === 0 ? "#0f766e" : "#334155",
            textDecoration: "none",
            backgroundColor: "transparent",
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f0fdfa")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {item.label}
        </Link>
      ))}
      <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "0" }} />
      <button
        onClick={() => { closeMenu(); logout(); }}
        style={{ display: "block", width: "100%", textAlign: "left", padding: "0.625rem 1rem", fontSize: "0.875rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fef2f2")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        {t("header.logout")}
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
            <Link href="/" data-slot="logo" className="flex-shrink-0 flex items-center gap-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={siteName ?? "Mağaza"}
                  style={{ height: "72px", width: "auto", maxWidth: "280px", objectFit: "contain" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <BrandLogo name={siteName ?? ""} size="md" />
              )}
            </Link>

            <form onSubmit={handleSearch} data-slot="search" className="flex-1 max-w-2xl hidden sm:flex">
              <div ref={searchRef} className="relative w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (suggestions.length > 0) setSuggestOpen(true); }}
                  placeholder={t("nav.search_placeholder")}
                  autoComplete="off"
                  className="w-full pl-5 pr-12 py-3 rounded-2xl text-sm bg-white text-slate-900 placeholder-slate-400 border-2 border-teal-200 focus:outline-none focus:border-teal-400 transition"
                />
                <button type="submit" className="absolute right-3 top-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl p-1.5 transition">
                  {suggestLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>

                {suggestOpen && mounted && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] overflow-hidden">
                    {suggestLoading && suggestions.length === 0 ? (
                      /* Loading skeleton inside dropdown */
                      <div className="py-3 px-3 space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 bg-slate-100 rounded w-3/4" />
                              <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : suggestions.length === 0 ? (
                      /* No results */
                      <div className="py-6 px-4 text-center">
                        <p className="text-sm text-slate-500">
                          <span className="font-medium text-slate-700">&ldquo;{search}&rdquo;</span> için sonuç bulunamadı
                        </p>
                        <button
                          onClick={() => { setSuggestOpen(false); router.push(`/urunler?s=${encodeURIComponent(search)}`); }}
                          className="mt-2 text-xs text-teal-600 hover:text-teal-800 font-semibold transition"
                        >
                          Tüm ürünlerde ara →
                        </button>
                      </div>
                    ) : (
                      <>
                        {suggestions.filter(s => s.type !== "product").length > 0 && (
                          <div className="px-3 pt-2 pb-1 flex flex-wrap gap-2">
                            {suggestions.filter(s => s.type !== "product").map((item, i) => (
                              <button
                                key={i}
                                onClick={() => handleSuggestionClick(item)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-xs font-medium text-slate-600 transition"
                              >
                                {item.type === "category" ? <Layers size={11} className="shrink-0" /> : <Tag size={11} className="shrink-0" />}
                                {item.name}
                              </button>
                            ))}
                          </div>
                        )}

                        {suggestions.filter(s => s.type === "product").length > 0 && (
                          <>
                            {suggestions.filter(s => s.type !== "product").length > 0 && (
                              <div className="mx-3 border-t border-slate-100 mt-1" />
                            )}
                            <div className="py-1">
                              {suggestions.filter(s => s.type === "product").map((item, i) => {
                                const globalIdx = suggestions.indexOf(item);
                                return (
                                  <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(item)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition ${activeIdx === globalIdx ? "bg-slate-50" : ""}`}
                                  >
                                    {item.imageUrl ? (
                                      <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-100" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center">
                                        <Search size={14} className="text-slate-300" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                                      {item.subText && <p className="text-xs text-slate-400 truncate">{item.subText}</p>}
                                    </div>
                                    {item.price != null && (
                                      <span className="text-sm font-semibold text-teal-600 shrink-0">
                                        {item.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}

                        <div className="border-t border-slate-100 px-3 py-2">
                          <button
                            onClick={() => { setSuggestOpen(false); router.push(`/urunler?s=${encodeURIComponent(search)}`); }}
                            className="w-full text-center text-xs font-semibold text-teal-600 hover:text-teal-800 py-1 transition"
                          >
                            {totalProducts > 0
                              ? t("header.search.view_all_products").replace("{count}", String(totalProducts))
                              : t("header.search.all_results").replace("{query}", search)}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </form>

            <div className="flex items-center gap-4" data-slot="actions">
              {languageSwitcherEnabled && <LanguageSwitcher />}
              {mounted && user ? (
                <button ref={buttonRef} onClick={openMenu} className="flex items-center gap-1.5 text-sm transition">
                  <User size={20} />
                  <span className="hidden sm:inline font-medium">{t("header.greeting").replace("{name}", user.name)}</span>
                </button>
              ) : (
                <Link href="/giris" className="text-sm flex items-center gap-1.5 font-medium transition">
                  <User size={20} />
                  <span className="hidden sm:inline">{t("nav.login")}</span>
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
