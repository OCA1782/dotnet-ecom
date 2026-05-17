"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse, Users,
  LogOut, ChevronRight, Ticket, MessageSquare, Tag, Layers,
  Activity, Target, ShieldAlert, Settings,
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { api } from "@/lib/api";

const ALL_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/siparisler", label: "Siparişler", icon: ShoppingCart },
  { href: "/urunler", label: "Ürünler", icon: Package },
  { href: "/kategoriler", label: "Kategoriler", icon: Layers },
  { href: "/markalar", label: "Markalar", icon: Tag },
  { href: "/stok", label: "Stok", icon: Warehouse },
  { href: "/kullanicilar", label: "Kullanıcılar", icon: Users },
  { href: "/kuponlar", label: "Kuponlar", icon: Ticket },
  { href: "/yorumlar", label: "Yorumlar", icon: MessageSquare },
  { href: "/hareketler", label: "Hareketler", icon: Activity },
  { href: "/hedefler", label: "Hedefler", icon: Target },
  { href: "/takip", label: "Takip", icon: ShieldAlert },
];

const SETTINGS_ITEM = { href: "/yonetim", label: "Yönetim", icon: Settings };

function reorder(items: typeof ALL_NAV_ITEMS, order: string[]): typeof ALL_NAV_ITEMS {
  if (!order.length) return items;
  const map = new Map(items.map(i => [i.href, i]));
  const sorted = order.map(h => map.get(h)).filter(Boolean) as typeof ALL_NAV_ITEMS;
  const rest = items.filter(i => !order.includes(i.href));
  return [...sorted, ...rest];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [siteTitle, setSiteTitle] = useState("Keyvora");
  const [logoUrl, setLogoUrl] = useState("/logo-icon.png");
  const [navItems, setNavItems] = useState(ALL_NAV_ITEMS);

  useEffect(() => {
    api.get<Record<string, string>>("/api/admin/settings").then(s => {
      if (s.AdminTitle) setSiteTitle(s.AdminTitle);
      if (s.LogoUrl) setLogoUrl(s.LogoUrl);
      if (s.AdminMenuOrder) {
        try {
          const order: string[] = JSON.parse(s.AdminMenuOrder);
          setNavItems(reorder(ALL_NAV_ITEMS, order));
        } catch { }
      }
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/giris");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-400 text-sm">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 bg-[#1c2044] flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={siteTitle} className="w-full h-full object-contain p-0.5"
                onError={e => { (e.target as HTMLImageElement).src = "/logo-icon.png"; }} />
            </div>
            <span className="text-white font-bold text-base">{siteTitle}</span>
          </div>
          <p className="text-slate-400 text-xs truncate">{user.email}</p>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition border-l-2 ${
                  active
                    ? "bg-white/10 text-white border-teal-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                }`}>
                <Icon size={17} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10">
          <Link href={SETTINGS_ITEM.href}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition border-l-2 ${
              pathname === SETTINGS_ITEM.href
                ? "bg-white/10 text-white border-teal-400"
                : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
            }`}>
            <Settings size={17} />
            {SETTINGS_ITEM.label}
            {pathname === SETTINGS_ITEM.href && <ChevronRight size={14} className="ml-auto opacity-60" />}
          </Link>
          <div className="px-4 pb-4">
            <button onClick={() => { logout(); router.push("/giris"); }}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition w-full px-2 py-1.5">
              <LogOut size={16} />
              Çıkış Yap
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
