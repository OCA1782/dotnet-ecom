"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse, Users,
  LogOut, ChevronRight, ChevronDown, Ticket, MessageSquare, Tag, Layers,
  Activity, Target, ShieldAlert, Settings, Database, MapPin,
  PanelLeftClose, PanelLeftOpen, FlaskConical, BarChart3,
  HeartPulse, Inbox, BookOpen, CreditCard, RotateCcw, Search, X,
  Truck, FileText, Megaphone, User, KeyRound, Shield, Rocket, Clock,
  Image, FolderOpen, Gift, ShieldCheck, HelpCircle, Info,
  Lightbulb, MousePointer2, ListChecks, Sparkles, GraduationCap,
} from "lucide-react";
import { PAGE_GUIDES } from "@/lib/pageGuides";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { api } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/roles";
import NotificationsPanel from "@/components/NotificationsPanel";
import ErrorBoundary from "@/components/ErrorBoundary";
import SessionTimeoutWarning from "@/components/SessionTimeoutWarning";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { I18nProvider, useI18n } from "@/contexts/I18nContext";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  allowedRoles?: string[]; // undefined = all admin roles
  group: "genel" | "katalog" | "satis" | "kullanici" | "sistem";
};

const ALL_NAV_ITEMS: NavItem[] = [
  // Genel
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard, group: "genel" },
  { href: "/raporlar",     label: "Analiz",        icon: BarChart3,       group: "genel", allowedRoles: ["SuperAdmin","Admin","FinanceUser"] },
  { href: "/hedefler",     label: "Hedefler",      icon: Target,          group: "genel", allowedRoles: ["SuperAdmin","Admin","FinanceUser"] },
  // Katalog
  { href: "/urunler",      label: "Ürünler",       icon: Package,         group: "katalog", allowedRoles: ["SuperAdmin","Admin","ProductManager"] },
  { href: "/kategoriler",  label: "Kategoriler",   icon: Layers,          group: "katalog", allowedRoles: ["SuperAdmin","Admin","ProductManager","ContentManager"] },
  { href: "/markalar",     label: "Markalar",      icon: Tag,             group: "katalog", allowedRoles: ["SuperAdmin","Admin","ProductManager","ContentManager"] },
  { href: "/stok",         label: "Stok",          icon: Warehouse,       group: "katalog", allowedRoles: ["SuperAdmin","Admin","StockManager","ProductManager"] },
  { href: "/yorumlar",     label: "Yorumlar",      icon: MessageSquare,   group: "katalog", allowedRoles: ["SuperAdmin","Admin","CustomerSupport","ContentManager"] },
  { href: "/duyurular",   label: "Duyurular",     icon: Megaphone,       group: "katalog", allowedRoles: ["SuperAdmin","Admin","ContentManager"] },
  { href: "/kampanyalar", label: "Kampanyalar",   icon: Gift,            group: "katalog", allowedRoles: ["SuperAdmin","Admin","ContentManager"] },
  { href: "/imajlar",     label: "İmaj Yönetimi", icon: Image,           group: "katalog", allowedRoles: ["SuperAdmin","Admin","ProductManager","ContentManager"] },
  { href: "/belgeler",    label: "Dosya Yönetimi",icon: FolderOpen,      group: "katalog", allowedRoles: ["SuperAdmin","Admin","ProductManager","ContentManager"] },
  // Satış
  { href: "/siparisler",   label: "Siparişler",    icon: ShoppingCart,    group: "satis",   allowedRoles: ["SuperAdmin","Admin","OrderManager","CustomerSupport","FinanceUser"] },
  { href: "/odemeler",     label: "Ödemeler",      icon: CreditCard,      group: "satis",   allowedRoles: ["SuperAdmin","Admin","FinanceUser"] },
  { href: "/iade",         label: "İadeler",       icon: RotateCcw,       group: "satis",   allowedRoles: ["SuperAdmin","Admin","OrderManager","CustomerSupport","FinanceUser"] },
  { href: "/kuponlar",     label: "Kuponlar",      icon: Ticket,          group: "satis",   allowedRoles: ["SuperAdmin","Admin","FinanceUser"] },
  { href: "/kargo",        label: "Kargo",         icon: Truck,           group: "satis",   allowedRoles: ["SuperAdmin","Admin","OrderManager"] },
  { href: "/faturalar",    label: "Faturalar",     icon: FileText,        group: "satis",   allowedRoles: ["SuperAdmin","Admin","FinanceUser"] },
  // Kullanıcı
  { href: "/kullanicilar", label: "Kullanıcılar",  icon: Users,           group: "kullanici", allowedRoles: ["SuperAdmin","Admin","CustomerSupport"] },
  { href: "/ziyaretciler", label: "Ziyaretçiler",  icon: MapPin,          group: "kullanici", allowedRoles: ["SuperAdmin","Admin"] },
  // Sistem
  { href: "/hareketler",   label: "Hareketler",    icon: Activity,        group: "sistem",  allowedRoles: ["SuperAdmin","Admin"] },
  { href: "/takip",        label: "Takip",         icon: ShieldAlert,     group: "sistem",  allowedRoles: ["SuperAdmin","Admin"] },
  { href: "/dis-kaynaklar",label: "Dış Kaynaklar", icon: Database,        group: "sistem",  allowedRoles: ["SuperAdmin","Admin"] },
  { href: "/servisler",    label: "Servisler",     icon: HeartPulse,      group: "sistem",  allowedRoles: ["SuperAdmin","Admin"] },
  { href: "/kuyruklar",    label: "Kuyruklar",     icon: Inbox,           group: "sistem",  allowedRoles: ["SuperAdmin","Admin"] },
  { href: "/joblar",       label: "Joblar",        icon: Clock,           group: "sistem",  allowedRoles: ["SuperAdmin","Admin"] },
  { href: "/dogrulama",    label: "Doğrulama",     icon: ShieldCheck,     group: "sistem",  allowedRoles: ["SuperAdmin","Admin"] },
  { href: "/dokuman",      label: "Dokümanlar",    icon: BookOpen,        group: "sistem" },
  { href: "/deploy",       label: "Deploy",        icon: Rocket,          group: "sistem",  allowedRoles: ["SuperAdmin","Admin"] },
];

type NavGroup = { id: NavItem["group"]; label: string; iconName?: string };

const NAV_GROUPS: NavGroup[] = [
  { id: "genel",    label: "Genel",     iconName: "LayoutDashboard" },
  { id: "katalog",  label: "Katalog",   iconName: "Package" },
  { id: "satis",    label: "Satış",     iconName: "ShoppingCart" },
  { id: "kullanici",label: "Kullanıcı", iconName: "Users" },
  { id: "sistem",   label: "Sistem",    iconName: "Settings" },
];

const GROUP_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  Database, Activity, Layers, Tag, BarChart3, Inbox, BookOpen, Target, Warehouse, MessageSquare,
};

function filterByRole(items: NavItem[], roles: string[]): NavItem[] {
  const isSuperAdmin = roles.includes("SuperAdmin") || roles.includes("Admin");
  return items.filter(item =>
    !item.allowedRoles || item.allowedRoles.some(r => roles.includes(r)) || isSuperAdmin
  );
}

const SETTINGS_ITEM = { href: "/yonetim", label: "Yönetim", icon: Settings };
const TEST_ITEM = { href: "/test", label: "Test", icon: FlaskConical };

function reorder(items: NavItem[], order: string[]): NavItem[] {
  if (!order.length) return items;
  const map = new Map(items.map(i => [i.href, i]));
  const sorted = order.map(h => map.get(h)).filter(Boolean) as NavItem[];
  const rest = items.filter(i => !order.includes(i.href));
  return [...sorted, ...rest];
}

function AdminBrandName({ title }: { title: string }) {
  const words = title.trim().split(/\s+/);
  const main = words.length >= 3 ? words.slice(0, -1).join(" ") : title;
  const sub = words.length >= 3 ? words[words.length - 1] : null;
  return (
    <div className="flex flex-col" style={{ gap: "2px" }}>
      <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 800, fontSize: "1rem", color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        {main}
      </span>
      {sub && (
        <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: "0.45rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5eead4", lineHeight: 1 }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function EnvBadge() {
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV;
  if (env === "production") return null;
  const styles: Record<string, string> = {
    development: "bg-amber-100 text-amber-700 border-amber-200",
    staging: "bg-blue-100 text-blue-700 border-blue-200",
    test: "bg-purple-100 text-purple-700 border-purple-200",
  };
  const cls = styles[env ?? "development"] ?? styles.development;
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${cls}`}>
      {env}
    </span>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { user, loading, logout, refreshSession } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [siteTitle, setSiteTitle] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("admin:siteTitle") || "") : ""
  );
  const [logoUrl, setLogoUrl] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("admin:logoUrl") || "/logo-icon.png") : "/logo-icon.png"
  );
  const [logoNamedUrl, setLogoNamedUrl] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("admin:logoNamedUrl") || "") : ""
  );
  const userRoles = user?.roles ?? [];
  const isSuperAdmin = userRoles.includes("SuperAdmin");
  const currentEnv = process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? "development";
  const isProd = currentEnv === "production";

  // TEST ve YÖNETİM görünürlük — AdminRbacMatrix'ten güncellenir
  const [testRoles, setTestRoles]       = useState<string[] | null>(null);
  const [yonetimRoles, setYonetimRoles] = useState<string[] | null>(null);

  const showTest = (() => {
    const allowed = testRoles ? testRoles.some(r => userRoles.includes(r)) : isSuperAdmin;
    // Production'da: sadece SuperAdmin VE matris izin veriyorsa
    return isProd ? (allowed && isSuperAdmin) : allowed;
  })();

  const showYonetim = yonetimRoles
    ? yonetimRoles.some(r => userRoles.includes(r))
    : (isSuperAdmin || userRoles.includes("Admin"));

  const visibleItems = filterByRole(ALL_NAV_ITEMS, userRoles);
  const [navItems, setNavItems] = useState<NavItem[]>(visibleItems);
  const [navGroups, setNavGroups] = useState<NavGroup[]>(NAV_GROUPS);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar_collapsed") === "1";
    }
    return false;
  });
  const [navSearch, setNavSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userMenuPos, setUserMenuPos] = useState<{ top: number; right: number } | null>(null);
  const userBtnRef = useRef<HTMLButtonElement>(null);
  const userDropRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!helpOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setHelpOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [helpOpen]);
  useEffect(() => { setHelpOpen(false); }, [pathname]);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!userBtnRef.current?.contains(t) && !userDropRef.current?.contains(t)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const openUserMenu = useCallback(() => {
    if (userBtnRef.current) {
      const r = userBtnRef.current.getBoundingClientRect();
      setUserMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setUserMenuOpen(o => !o);
  }, []);
  const roleLabel = (role: string) => ROLE_LABELS[role] ?? role;
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sidebar_open_groups");
        if (saved) {
          const parsed = new Set(JSON.parse(saved) as string[]);
          // Ensure all groups exist (handles cases where new groups were added)
          NAV_GROUPS.forEach(g => parsed.add(g.id));
          return parsed;
        }
      } catch { }
    }
    return new Set(NAV_GROUPS.map(g => g.id));
  });

  function toggleGroup(id: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("sidebar_open_groups", JSON.stringify([...next]));
      return next;
    });
  }

  function toggleSidebar() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  useEffect(() => {
    function onSettingsUpdated(e: Event) {
      const s = (e as CustomEvent<Record<string, string>>).detail;
      if (s.AdminTitle) { setSiteTitle(s.AdminTitle); localStorage.setItem("admin:siteTitle", s.AdminTitle); }
      const logo = s.AdminLogoIcon || s.LogoUrl || "/logo-icon.png";
      const logoNamed = s.AdminLogoNamed || "";
      setLogoUrl(logo); localStorage.setItem("admin:logoUrl", logo);
      setLogoNamedUrl(logoNamed); localStorage.setItem("admin:logoNamedUrl", logoNamed);
    }
    window.addEventListener("ecom:settings-updated", onSettingsUpdated);
    return () => window.removeEventListener("ecom:settings-updated", onSettingsUpdated);
  }, []);

  useEffect(() => {
    api.get<Record<string, string>>("/api/admin/settings").then(s => {
      if (s.AdminTitle) { setSiteTitle(s.AdminTitle); localStorage.setItem("admin:siteTitle", s.AdminTitle); }
      const logo = s.AdminLogoIcon || s.LogoUrl || "/logo-icon.png";
      const logoNamed = s.AdminLogoNamed || "";
      setLogoUrl(logo); localStorage.setItem("admin:logoUrl", logo);
      setLogoNamedUrl(logoNamed); localStorage.setItem("admin:logoNamedUrl", logoNamed);
      const filtered = filterByRole(ALL_NAV_ITEMS, userRoles);

      // Apply group overrides from AdminMenuConfig
      let itemsToOrder = filtered;
      if (s.AdminMenuConfig) {
        try {
          const gc = JSON.parse(s.AdminMenuConfig) as {
            groupOrder?: string[];
            groupLabels?: Record<string, string>;
            groupIcons?: Record<string, string>;
            itemGroups?: Record<string, string>;
          };
          if (gc.itemGroups) {
            itemsToOrder = filtered.map(item => ({
              ...item,
              group: (gc.itemGroups![item.href] as NavItem["group"]) ?? item.group,
            }));
          }
          if (gc.groupOrder?.length) {
            const newGroups = gc.groupOrder
              .map(id => {
                const base = NAV_GROUPS.find(g => g.id === id);
                if (!base) return null;
                return {
                  ...base,
                  label: gc.groupLabels?.[id] ?? base.label,
                  iconName: gc.groupIcons?.[id] ?? base.iconName,
                } as NavGroup;
              })
              .filter(Boolean) as NavGroup[];
            if (newGroups.length) setNavGroups(newGroups);
          } else if (gc.groupLabels || gc.groupIcons) {
            setNavGroups(prev => prev.map(g => ({
              ...g,
              label: gc.groupLabels?.[g.id] ?? g.label,
              iconName: gc.groupIcons?.[g.id] ?? g.iconName,
            })));
          }
        } catch { }
      }

      if (s.AdminRbacMatrix) {
        try {
          const matrix = JSON.parse(s.AdminRbacMatrix) as Record<string, string[]>;
          itemsToOrder = itemsToOrder.map(item => {
            const roles = matrix[item.label];
            if (roles) return { ...item, allowedRoles: roles };
            return item;
          });
          // Test ve Yönetim bottom-item'ları için roller
          if (matrix["Test"] !== undefined)    setTestRoles(matrix["Test"]);
          if (matrix["Yönetim"] !== undefined) setYonetimRoles(matrix["Yönetim"]);
        } catch { }
      }

      if (s.AdminMenuOrder) {
        try {
          const order: string[] = JSON.parse(s.AdminMenuOrder);
          setNavItems(reorder(itemsToOrder, order));
        } catch { setNavItems(itemsToOrder); }
      } else {
        setNavItems(itemsToOrder);
      }
    }).catch(() => { });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const sidebarWidth = collapsed ? "w-16" : "w-60";

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={`${sidebarWidth} bg-[#1c2044] flex flex-col shrink-0 transition-all duration-200`}>
        {/* Logo / Header */}
        <div className={`border-b border-white/10 ${collapsed ? "px-3 py-4 flex justify-center" : "px-5 py-4"}`}>
          {collapsed ? (
            /* Daraltılmış: isimsiz ikon */
            <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={siteTitle} className="w-full h-full object-contain p-0.5"
                onError={e => { (e.target as HTMLImageElement).src = "/logo-icon.png"; }} />
            </div>
          ) : logoNamedUrl ? (
            /* Genişletilmiş: isimli logo görsel olarak */
            <>
              <div className="mb-1 h-16 flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoNamedUrl} alt={siteTitle} className="max-h-full max-w-full object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <p className="text-slate-400 text-xs truncate">{user.email}</p>
            </>
          ) : (
            /* Genişletilmiş: isimsiz — metin logo (Inter 800 white) */
            <>
              <AdminBrandName title={siteTitle} />
              <p className="text-slate-400 text-xs truncate mt-1">{user.email}</p>
            </>
          )}
        </div>

        {/* Arama */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-white/10">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2 text-slate-500 pointer-events-none" />
              <input
                ref={searchRef}
                value={navSearch}
                onChange={e => setNavSearch(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") setNavSearch(""); }}
                placeholder="Sayfa ara..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-7 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:bg-white/10 transition"
              />
              {navSearch && (
                <button onClick={() => setNavSearch("")}
                  className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-300 transition">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
          {navSearch.trim() ? (
            /* Arama sonuçları — düz liste, grup yok */
            (() => {
              const q = navSearch.toLowerCase();
              const allSearchable = [
                ...navItems,
                { href: "/yonetim", label: "Yönetim", icon: Settings, group: "sistem" as const },
                { href: "/test", label: "Test", icon: FlaskConical, group: "sistem" as const },
              ];
              const results = allSearchable.filter(i => {
                const tl = t("nav." + i.href, i.label).toLowerCase();
                return tl.includes(q) || i.label.toLowerCase().includes(q);
              });
              return results.length === 0 ? (
                <p className="px-5 py-4 text-xs text-slate-500">Sonuç bulunamadı.</p>
              ) : (
                <div className="pt-1">
                  {results.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + "/");
                    const tlabel = t("nav." + href, label);
                    return (
                      <Link key={href} href={href} onClick={() => setNavSearch("")}
                        className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition border-l-2 ${
                          active
                            ? "bg-white/10 text-white border-teal-400"
                            : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                        }`}>
                        <Icon size={17} className="shrink-0" />
                        <span className="truncate">{tlabel}</span>
                        {active && <ChevronRight size={14} className="ml-auto opacity-60 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              );
            })()
          ) : (
            /* Normal gruplu görünüm */
            navGroups.map(group => {
              const groupItems = navItems.filter(i => i.group === group.id);
              if (groupItems.length === 0) return null;
              const GroupIcon = group.iconName ? GROUP_ICON_MAP[group.iconName] : null;
              const hasActiveItem = groupItems.some(i => pathname === i.href || pathname.startsWith(i.href + "/"));
              const isOpen = collapsed || openGroups.has(group.id) || hasActiveItem;
              return (
                <div key={group.id} className="mb-1">
                  {!collapsed && (
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full px-4 pt-3 pb-1 flex items-center gap-1.5 text-left hover:text-slate-400 transition group/grp"
                    >
                      {GroupIcon && <GroupIcon size={9} className="opacity-70 shrink-0 text-slate-600" />}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 select-none flex-1">
                        {t("group." + group.id, group.label)}
                      </span>
                      {hasActiveItem && !isOpen && (
                        <span className="w-1 h-1 rounded-full bg-teal-400 mr-1" />
                      )}
                      <ChevronDown
                        size={10}
                        className={`text-slate-600 opacity-60 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`}
                      />
                    </button>
                  )}
                  {collapsed && <div className="mx-3 my-1.5 border-t border-white/10" />}
                  {isOpen && groupItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + "/");
                    const tlabel = t("nav." + href, label);
                    return (
                      <Link key={href} href={href} title={collapsed ? tlabel : undefined}
                        className={`flex items-center gap-3 py-2.5 text-sm font-medium transition border-l-2 ${
                          collapsed ? "px-0 justify-center" : "px-6"
                        } ${
                          active
                            ? "bg-white/10 text-white border-teal-400"
                            : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                        }`}>
                        <Icon size={17} className="shrink-0" />
                        {!collapsed && <span className="truncate">{tlabel}</span>}
                        {!collapsed && active && <ChevronRight size={14} className="ml-auto opacity-60 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              );
            })
          )}
        </nav>

        {/* Bottom: Settings, Test, Collapse, Logout */}
        <div className="border-t border-white/10">
          {/* Test — env & rol korumalı */}
          {showTest && (
            <Link href={TEST_ITEM.href} title={collapsed ? TEST_ITEM.label : undefined}
              className={`flex items-center gap-3 py-3 text-sm font-medium transition border-l-2 ${
                collapsed ? "px-0 justify-center" : "px-6"
              } ${
                pathname === TEST_ITEM.href
                  ? "bg-white/10 text-white border-teal-400"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
              }`}>
              <FlaskConical size={17} className="shrink-0" />
              {!collapsed && (
                <>
                  <span>Test</span>
                  {isProd && (
                    <span className="ml-auto text-[8px] font-bold text-amber-400 border border-amber-400/40 px-1 rounded">PROD</span>
                  )}
                </>
              )}
            </Link>
          )}

          {/* Yönetim — rol korumalı */}
          {showYonetim && (
            <Link href={SETTINGS_ITEM.href} title={collapsed ? SETTINGS_ITEM.label : undefined}
              className={`flex items-center gap-3 py-3 text-sm font-medium transition border-l-2 ${
                collapsed ? "px-0 justify-center" : "px-6"
              } ${
                pathname === SETTINGS_ITEM.href
                  ? "bg-white/10 text-white border-teal-400"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
              }`}>
              <Settings size={17} className="shrink-0" />
              {!collapsed && <span>{SETTINGS_ITEM.label}</span>}
              {!collapsed && pathname === SETTINGS_ITEM.href && <ChevronRight size={14} className="ml-auto opacity-60 shrink-0" />}
            </Link>
          )}

          {/* Logout + Collapse Toggle */}
          <div className={`pb-3 pt-1 flex items-center ${collapsed ? "flex-col gap-1 px-0" : "justify-between px-4"}`}>
            <button onClick={() => { logout(); router.push("/giris"); }} title="Çıkış Yap"
              className={`flex items-center gap-2 text-slate-400 hover:text-white text-sm transition ${collapsed ? "py-1.5 justify-center" : "px-2 py-1.5"}`}>
              <LogOut size={16} />
              {!collapsed && <span>Çıkış Yap</span>}
            </button>
            <button onClick={toggleSidebar} title={collapsed ? "Genişlet" : "Daralt"}
              className="text-slate-500 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10">
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            body::after {
              content: "Bu sayfa yazdırılamaz.";
              visibility: visible !important;
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 24px;
              font-weight: bold;
              color: #64748b;
            }
          }
          .no-screenshot img { pointer-events: none; -webkit-user-drag: none; }
          .no-screenshot { -webkit-user-select: text; user-select: text; }
        `}</style>
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            {(() => {
              const n = navItems.find(n => pathname === n.href || pathname.startsWith(n.href + "/"));
              if (n) return t("nav." + n.href, n.label);
              if (pathname === SETTINGS_ITEM.href) return t("nav." + SETTINGS_ITEM.href, SETTINGS_ITEM.label);
              if (pathname === TEST_ITEM.href) return t("nav." + TEST_ITEM.href, TEST_ITEM.label);
              return "";
            })()}
          </span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <EnvBadge />
            {PAGE_GUIDES[pathname] && (
              <button
                onClick={() => setHelpOpen(o => !o)}
                title="Kullanım Kılavuzu"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border shadow-sm ${
                  helpOpen
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-200"
                    : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-indigo-100"
                }`}
              >
                <HelpCircle size={14} className={helpOpen ? "" : "animate-pulse"} />
                <span>Kılavuz</span>
              </button>
            )}
            <NotificationsPanel />
            {user && (
              <button
                ref={userBtnRef}
                onClick={openUserMenu}
                className="flex items-center gap-2 pl-3 border-l border-slate-200 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition"
              >
                <div className="w-8 h-8 rounded-full bg-teal-600 overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user.avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={resolveMediaUrl(user.avatarUrl)} alt="" className="w-full h-full object-cover" />
                    : <>{user.name?.[0]?.toUpperCase()}{user.surname?.[0]?.toUpperCase()}</>
                  }
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name} {user.surname}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{user.roles?.[0] ? roleLabel(user.roles[0]) : "Admin"}</p>
                </div>
                <ChevronDown size={13} className="text-slate-400 hidden sm:block" />
              </button>
            )}
          </div>
        </header>
        {userMenuOpen && userMenuPos && mounted && user && createPortal(
          <div
            ref={userDropRef}
            style={{ position: "fixed", top: userMenuPos.top, right: userMenuPos.right, zIndex: 99999,
              backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "0.875rem",
              boxShadow: "0 16px 48px rgba(0,0,0,0.14)", width: "15rem", overflow: "hidden" }}
          >
            {/* Kullanıcı bilgi kartı */}
            <div style={{ padding: "1rem", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg,#f0fdfa,#f8fafc)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "#0d9488",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0, overflow: "hidden" }}>
                  {user.avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={resolveMediaUrl(user.avatarUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <>{user.name?.[0]?.toUpperCase()}{user.surname?.[0]?.toUpperCase()}</>
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.name} {user.surname}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.email}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: "0.625rem", display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                {user.roles?.map(r => (
                  <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem",
                    fontSize: "0.65rem", fontWeight: 600, padding: "0.15rem 0.5rem",
                    borderRadius: "999px", background: "#ccfbf1", color: "#0f766e" }}>
                    <Shield size={9} />
                    {roleLabel(r)}
                  </span>
                ))}
              </div>
            </div>
            {/* Menü öğeleri */}
            <Link href="/kullanicilar"
              onClick={() => setUserMenuOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 1rem",
                fontSize: "0.8125rem", color: "#334155", textDecoration: "none", backgroundColor: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <User size={14} style={{ color: "#64748b" }} />
              Kullanıcı Yönetimi
            </Link>
            <Link href="/yonetim?tab=sistem"
              onClick={() => setUserMenuOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 1rem",
                fontSize: "0.8125rem", color: "#334155", textDecoration: "none", backgroundColor: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <KeyRound size={14} style={{ color: "#64748b" }} />
              Şifre / API Anahtarı
            </Link>
            <div style={{ height: "1px", backgroundColor: "#f1f5f9" }} />
            <button
              onClick={() => { setUserMenuOpen(false); logout(); router.push("/giris"); }}
              style={{ display: "flex", alignItems: "center", gap: "0.625rem", width: "100%", textAlign: "left",
                padding: "0.625rem 1rem", fontSize: "0.8125rem", color: "#ef4444",
                background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fef2f2")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <LogOut size={14} />
              Çıkış Yap
            </button>
          </div>,
          document.body
        )}
        <main className="flex-1 overflow-y-auto p-8 no-screenshot relative"
          onContextMenu={e => { e.preventDefault(); }}
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>

        {/* ── Kullanım Kılavuzu Paneli ── */}
        {helpOpen && mounted && (() => {
          const guide = PAGE_GUIDES[pathname];
          if (!guide) return null;

          function sectionMeta(title: string): {
            icon: React.ComponentType<{ size?: number; className?: string }>;
            bg: string; border: string; text: string; dot: string;
          } {
            const t = title.toLowerCase();
            if (t.includes("veri") || t.includes("kaynak"))
              return { icon: Database,       bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   dot: "bg-blue-400" };
            if (t.includes("buton") || t.includes("aksiyon") || t.includes("işlem"))
              return { icon: MousePointer2,  bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-700",   dot: "bg-teal-400" };
            if (t.includes("kullanım") || t.includes("nasıl") || t.includes("adım"))
              return { icon: GraduationCap,  bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-400" };
            if (t.includes("ipucu") || t.includes("önemli") || t.includes("not"))
              return { icon: Lightbulb,      bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  dot: "bg-amber-400" };
            if (t.includes("filtre") || t.includes("arama") || t.includes("sıralama"))
              return { icon: Search,         bg: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-700",    dot: "bg-sky-400" };
            return    { icon: ListChecks,    bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-400" };
          }

          return createPortal(
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[2px]"
                onClick={() => setHelpOpen(false)}
              />
              {/* Slide-over */}
              <div className="fixed top-0 right-0 h-full w-[22rem] z-[9999] bg-white shadow-2xl flex flex-col" style={{ borderLeft: "1px solid #e0e7ff" }}>

                {/* Header — gradient banner */}
                <div className="relative px-5 pt-5 pb-4 overflow-hidden" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                        <Sparkles size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Kullanım Kılavuzu</p>
                        <p className="text-base font-extrabold text-white leading-tight mt-0.5">{guide.title}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setHelpOpen(false)}
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition shrink-0 mt-0.5"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Açıklama kutusu */}
                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                  <div className="flex items-start gap-2">
                    <Info size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-700 leading-relaxed">{guide.description}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                  {guide.sections.map((section, si) => {
                    const sm = sectionMeta(section.title);
                    const SectionIcon = sm.icon;
                    return (
                      <div key={si} className={`rounded-2xl border overflow-hidden ${sm.border}`}>
                        {/* Bölüm başlığı */}
                        <div className={`flex items-center gap-2 px-3 py-2 ${sm.bg}`}>
                          <SectionIcon size={13} className={sm.text} />
                          <span className={`text-[11px] font-bold uppercase tracking-wide ${sm.text}`}>{section.title}</span>
                        </div>
                        {/* Maddeler */}
                        <ul className="divide-y divide-slate-100 bg-white">
                          {section.items.map((item, ii) => (
                            <li key={ii} className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white ${sm.dot}`}>
                                {ii + 1}
                              </span>
                              <span className="text-xs text-slate-700 leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono">ESC</kbd> veya dışarı tıkla
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                    <BookOpen size={10} />
                    <span>{guide.sections.length} bölüm</span>
                  </div>
                </div>
              </div>
            </>,
            document.body
          );
        })()}
      </div>
      <SessionTimeoutWarning
        onRefresh={refreshSession}
        onLogout={() => { logout(); router.push("/giris"); }}
      />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </I18nProvider>
  );
}
