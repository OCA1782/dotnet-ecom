// Tek kaynak: tüm admin panel rol tanımları
// Hem kullanicilar sayfası hem yönetim RBAC buradan tüketilir.
// Backend UserRole enum ile birebir eşleşmeli.

export const ROLE_DEFS = [
  { key: "SuperAdmin",      label: "Süper Admin",        shortLabel: "Süper Admin",   color: "bg-purple-100 text-purple-800", isAdmin: true  },
  { key: "Admin",           label: "Admin",              shortLabel: "Admin",         color: "bg-red-100 text-red-800",       isAdmin: true  },
  { key: "ProductManager",  label: "Ürün Yöneticisi",    shortLabel: "Ürün Yön.",     color: "bg-indigo-100 text-indigo-800", isAdmin: true  },
  { key: "StockManager",    label: "Stok Yöneticisi",    shortLabel: "Stok Yön.",     color: "bg-orange-100 text-orange-800", isAdmin: true  },
  { key: "OrderManager",    label: "Sipariş Yöneticisi", shortLabel: "Sipariş Yön.",  color: "bg-blue-100 text-blue-800",     isAdmin: true  },
  { key: "CustomerSupport", label: "Müşteri Desteği",    shortLabel: "Müşteri Des.",  color: "bg-teal-100 text-teal-800",     isAdmin: true  },
  { key: "FinanceUser",     label: "Finans Kullanıcısı", shortLabel: "Finans",        color: "bg-green-100 text-green-800",   isAdmin: true  },
  { key: "ContentManager",  label: "İçerik Yöneticisi",  shortLabel: "İçerik Yön.",  color: "bg-pink-100 text-pink-800",     isAdmin: true  },
  { key: "Customer",        label: "Müşteri",            shortLabel: "Müşteri",       color: "bg-slate-100 text-slate-600",   isAdmin: false },
] as const;

export type RoleKey = (typeof ROLE_DEFS)[number]["key"];

// Hızlı erişim map'leri
export const ROLE_COLORS: Record<string, string> = Object.fromEntries(
  ROLE_DEFS.map(r => [r.key, r.color])
);

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_DEFS.map(r => [r.key, r.label])
);

export const ROLE_SHORT_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_DEFS.map(r => [r.key, r.shortLabel])
);

export function normalizeAdminRoles(roles: string[] | undefined | null): string[] {
  const unique = [...new Set((roles ?? []).filter(Boolean))];
  if (unique.includes("SuperAdmin")) return ["SuperAdmin"];
  return unique;
}

export function getPrimaryAdminRole(roles: string[] | undefined | null): string {
  const normalized = normalizeAdminRoles(roles);
  return normalized[0] ?? "Admin";
}

// RBAC matrisinde gösterilen admin rolleri (Customer hariç — panel erişimi yok)
export const ADMIN_ROLE_COLUMNS = ROLE_DEFS.filter(r => r.isAdmin).map(r => ({
  key: r.key,
  label: r.shortLabel,
}));

// Kullanıcı oluşturma formunda tüm roller (Customer dahil, ayrı grupta)
export const ADMIN_ROLES = ROLE_DEFS.filter(r => r.isAdmin);
export const ALL_ROLE_DEFS = [...ROLE_DEFS];
