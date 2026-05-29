"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const NAV_LINKS = [
  { href: "/hesabim", label: "Hesap Bilgileri", icon: "👤" },
  { href: "/hesabim/siparisler", label: "Siparişlerim", icon: "📦" },
  { href: "/hesabim/adresler", label: "Adreslerim", icon: "📍" },
  { href: "/hesabim/favoriler", label: "Favorilerim", icon: "❤️" },
  { href: "/hesabim/faturalar", label: "Faturalarım", icon: "🧾" },
  { href: "/hesabim/iadeler", label: "İadelerim", icon: "↩️" },
  { href: "/hesabim/kuponlar", label: "Kuponlarım", icon: "🎟️" },
  { href: "/hesabim/yorumlar", label: "Yorumlarım", icon: "💬" },
];

export default function HesabimLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/giris");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-400">Yükleniyor...</div>;
  }

  const isActive = (href: string) =>
    href === "/hesabim" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex gap-8 items-start">
        {/* Sidebar */}
        <aside className="hidden md:block w-52 shrink-0">
          <nav className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm border-b border-slate-100 last:border-b-0 transition hover:bg-teal-50 hover:text-teal-700 ${
                  isActive(l.href) ? "bg-teal-50 text-teal-700 font-semibold" : "text-slate-600"
                }`}
              >
                <span>{l.icon}</span> {l.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition"
            >
              <span>🚪</span> Çıkış Yap
            </button>
          </nav>
        </aside>

        {/* Page content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
