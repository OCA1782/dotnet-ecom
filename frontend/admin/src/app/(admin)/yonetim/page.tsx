"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  Settings, Globe, Palette, Truck, Menu, Shield, FileText,
  Save, Upload, Loader2, CheckCircle, GripVertical,
  Share2, Image as ImageIcon, Link, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Plus, Pencil, Trash2, HelpCircle, RefreshCw, MapPin, Clock, Phone, Mail,
  SendHorizonal, X, XCircle, MessageCircle, CreditCard, Building2, Lock,
  Users, KeyRound, Database, Wifi, Activity,
  LayoutDashboard, Package, ShoppingCart, Layers, Tag, BarChart3,
  Inbox, BookOpen, Target, Warehouse, MessageSquare, Eye,
  ExternalLink, Play, Pause, RotateCcw,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */
type SiteSettings = Record<string, string>;
type FaqItem = { q: string; a: string };
type LicenseDto = {
  id: string; module: string; licenseKey: string; description?: string;
  expiresAt: string; isActive: boolean; notes?: string;
  isExpired: boolean; daysRemaining: number;
};
type ServiceState = {
  name: string; description: string; type: string;
  isPaused: boolean; isRunning: boolean;
  lastRunAt: string | null; lastRunResult: string | null; lastRunSuccess: boolean | null;
  runCount: number; uptimeSeconds: number;
};

const DEFAULTS: SiteSettings = {
  SiteName: "", SiteUrl: "", AdminTitle: "", Currency: "TRY",
  DefaultTaxRate: "20", ContactEmail: "", ContactPhone: "",
  SocialInstagram: "", SocialTwitter: "", SocialFacebook: "",
  SocialYoutube: "", SocialLinkedin: "",
  LogoUrl: "", FaviconUrl: "",
  // Admin panel görselleri
  AdminLogoNamed: "",   // sidebar genişken (isimli — marka logosu)
  AdminLogoIcon: "",    // sidebar daraltılmışken (isimsiz — sadece ikon)
  AdminFaviconUrl: "",  // admin tarayıcı sekmesi ikonu
  // Müşteri sitesi görselleri
  CustomerLogoIcon: "",   // header'da isimsiz logo (sadece ikon)
  CustomerLogoNamed: "",  // header'da isimli logo (metin dahil)
  CustomerFaviconUrl: "", // müşteri tarayıcı sekmesi ikonu
  // Renkler — Customer
  PrimaryColor: "#0d9488", AccentColor: "#7c3aed",
  CustomerBgColor: "#F7FAFA", CustomerTextColor: "#1c2044",
  CustomerCardBgColor: "#ffffff", CustomerHeaderBgColor: "#ffffff",
  CustomerBorderColor: "#ccfbf1", CustomerButtonTextColor: "#ffffff",
  // Renkler — Admin
  AdminSidebarColor: "#1c2044", AdminPrimaryColor: "#0d9488",
  AdminAccentColor: "#7c3aed", AdminBgColor: "#f8fafc",
  // Fontlar
  AdminFontFamily: "Inter", CustomerFontFamily: "Inter",
  AdminFontSize: "base", CustomerFontSize: "base",
  // Kargo
  FreeShippingLimit: "", DefaultShippingCost: "",
  MaintenanceMode: "false", AdminMenuOrder: "", AdminMenuConfig: "", AdminRbacMatrix: "",
  // Şablon
  CustomerTemplate: "modern",
  // Ortam
  AppEnvironment: "development",
  ApiBaseUrl: "http://localhost:5124",
  CustomerBaseUrl: "http://localhost:3000",
  AdminBaseUrl: "http://localhost:3001",
  ApiBaseUrl_dev: "http://localhost:5124",
  ApiBaseUrl_staging: "",
  ApiBaseUrl_prod: "",
  CustomerBaseUrl_dev: "http://localhost:3000",
  CustomerBaseUrl_staging: "",
  CustomerBaseUrl_prod: "",
  AdminBaseUrl_dev: "http://localhost:3001",
  AdminBaseUrl_staging: "",
  AdminBaseUrl_prod: "",
  // Chatbot
  ChatbotEnabled: "false",
  ChatbotProvider: "whatsapp",
  WhatsAppNumber: "",
  WhatsAppWelcomeMessage: "Merhaba! Size nasıl yardımcı olabilirim?",
  TelegramBotUsername: "",
  TelegramBotToken: "",
  N8nWebhookUrl: "",
  N8nApiKey: "",
  // Ödeme
  PaymentHavaleEnabled: "false",
  PaymentHavaleBankName: "",
  PaymentHavaleAccountName: "",
  PaymentHavaleIBAN: "",
  PaymentHavaleDescription: "",
  PaymentSanalPosEnabled: "false",
  PaymentSanalPosProvider: "iyzico",
  PaymentSanalPosMerchantId: "",
  PaymentSanalPosApiKey: "",
  PaymentSanalPosApiSecret: "",
  PaymentSanalPosTestMode: "true",
  // Footer
  Footer_Tagline: "Keyifli alışverişin yeni adresi.\nSevdiğin ürünler, güvenli ödeme.",
  // Sayfa içerikleri
  Page_SSS: "[]",
  Page_IadeVeDegisim: "",
  Page_KargoTakibi: "",
  Page_Iletisim_Address: "",
  Page_Iletisim_Hours: "",
  Page_Iletisim_MapUrl: "",
  Page_Hakkimizda: "",
  Page_KVKK: "",
  Page_Gizlilik: "",
  // Özelleştirilebilir mesajlar
  Msg_RequiredField: "Bu alan zorunludur.",
  Msg_InvalidEmail: "Geçerli bir e-posta adresi girin.",
  Msg_PasswordMin: "Şifre en az 8 karakter olmalıdır.",
  Msg_PasswordMatch: "Şifreler eşleşmiyor.",
  Msg_OrderSuccess: "Siparişiniz başarıyla oluşturuldu.",
  Msg_OrderCancelled: "Siparişiniz iptal edildi.",
  Msg_OrderShipped: "Siparişiniz kargoya verildi.",
  Msg_CartItemAdded: "Ürün sepete eklendi.",
  Msg_OutOfStock: "Bu üründen yeterli stok bulunmuyor.",
  Msg_CartEmpty: "Sepetinizde ürün bulunmuyor.",
  Msg_CouponApplied: "Kupon kodu uygulandı.",
  Msg_CouponInvalid: "Geçersiz veya süresi dolmuş kupon kodu.",
  Msg_GenericError: "Bir hata oluştu. Lütfen tekrar deneyin.",
  Msg_NetworkError: "İnternet bağlantısı kesildi. Lütfen kontrol edin.",
  Msg_Unauthorized: "Bu işlem için giriş yapmanız gerekiyor.",
  Msg_LoginSuccess: "Başarıyla giriş yaptınız. Hoş geldiniz!",
  Msg_RegisterSuccess: "Hesabınız oluşturuldu. E-postanızı doğrulayın.",
  Msg_ProfileUpdated: "Profiliniz başarıyla güncellendi.",
  Msg_PasswordChanged: "Şifreniz başarıyla değiştirildi.",
  Msg_MaintenanceMode: "Site bakım çalışması yapılıyor. Lütfen daha sonra tekrar deneyin.",
  Msg_LowStockWarning: "Bu üründe sınırlı stok kalmıştır.",
  Msg_FreeShipping: "Ücretsiz kargo için ₺{limit} üzeri alışveriş yapın.",
  Msg_ReviewSuccess: "Yorumunuz alındı. İnceleme sonrası yayınlanacaktır.",
};

const ALL_MENU_ITEMS = [
  { href: "/dashboard",     label: "Dashboard",     group: "genel" },
  { href: "/raporlar",      label: "Analiz",        group: "genel" },
  { href: "/hedefler",      label: "Hedefler",      group: "genel" },
  { href: "/urunler",       label: "Ürünler",       group: "katalog" },
  { href: "/kategoriler",   label: "Kategoriler",   group: "katalog" },
  { href: "/markalar",      label: "Markalar",      group: "katalog" },
  { href: "/stok",          label: "Stok",          group: "katalog" },
  { href: "/yorumlar",      label: "Yorumlar",      group: "katalog" },
  { href: "/siparisler",    label: "Siparişler",    group: "satis" },
  { href: "/odemeler",      label: "Ödemeler",      group: "satis" },
  { href: "/iade",          label: "İadeler",       group: "satis" },
  { href: "/kuponlar",      label: "Kuponlar",      group: "satis" },
  { href: "/kullanicilar",  label: "Kullanıcılar",  group: "kullanici" },
  { href: "/ziyaretciler",  label: "Ziyaretçiler",  group: "kullanici" },
  { href: "/hareketler",    label: "Hareketler",    group: "sistem" },
  { href: "/takip",         label: "Takip",         group: "sistem" },
  { href: "/dis-kaynaklar", label: "Dış Kaynaklar", group: "sistem" },
  { href: "/servisler",     label: "Servisler",     group: "sistem" },
  { href: "/kuyruklar",     label: "Kuyruklar",     group: "sistem" },
  { href: "/dokuman",       label: "Dokümanlar",    group: "sistem" },
] as const;

/* ─── Menu Group Config ──────────────────────────────────────────────── */
type MenuGroupConfig = {
  groupOrder: string[];
  groupLabels: Record<string, string>;
  groupIcons: Record<string, string>;
  itemGroups: Record<string, string>;
};

const DEFAULT_GROUP_ORDER = ["genel", "katalog", "satis", "kullanici", "sistem"];
const DEFAULT_GROUP_LABELS: Record<string, string> = {
  genel: "Genel", katalog: "Katalog", satis: "Satış", kullanici: "Kullanıcı", sistem: "Sistem",
};
const DEFAULT_GROUP_ICONS: Record<string, string> = {
  genel: "LayoutDashboard", katalog: "Package", satis: "ShoppingCart", kullanici: "Users", sistem: "Settings",
};
const MENU_ICON_OPTIONS: { name: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { name: "LayoutDashboard", icon: LayoutDashboard },
  { name: "Package",         icon: Package },
  { name: "ShoppingCart",    icon: ShoppingCart },
  { name: "Users",           icon: Users },
  { name: "Settings",        icon: Settings },
  { name: "Database",        icon: Database },
  { name: "Shield",          icon: Shield },
  { name: "Activity",        icon: Activity },
  { name: "Layers",          icon: Layers },
  { name: "Tag",             icon: Tag },
  { name: "BarChart3",       icon: BarChart3 },
  { name: "Inbox",           icon: Inbox },
  { name: "BookOpen",        icon: BookOpen },
  { name: "Target",          icon: Target },
  { name: "Warehouse",       icon: Warehouse },
  { name: "MessageSquare",   icon: MessageSquare },
];

/* ─── Color Swatches ─────────────────────────────────────────────────── */
const COLOR_SWATCHES: Record<string, string[]> = {
  PrimaryColor:         ["#0d9488", "#0891b2", "#2563eb", "#7c3aed", "#dc2626", "#16a34a", "#d97706", "#e11d48", "#06b6d4", "#8b5cf6", "#059669", "#b91c1c"],
  AccentColor:          ["#7c3aed", "#db2777", "#0d9488", "#f97316", "#eab308", "#06b6d4", "#84cc16", "#6366f1", "#ec4899", "#f43f5e", "#14b8a6", "#a855f7"],
  CustomerBgColor:      ["#F7FAFA", "#f8fafc", "#fafaf9", "#fff7ed", "#f0fdf4", "#eff6ff", "#fdf4ff", "#fff1f2", "#fefce8", "#f0fdfa", "#ffffff", "#f1f5f9"],
  CustomerTextColor:    ["#1c2044", "#0f172a", "#1e293b", "#111827", "#1a1a2e", "#18181b", "#292524", "#162032", "#0c1a2e", "#1a1a27", "#374151", "#27272a"],
  CustomerCardBgColor:  ["#ffffff", "#fafafa", "#f9fafb", "#f8fafc", "#f0fdfa", "#f0fdf4", "#fffbeb", "#fef2f2", "#fdf4ff", "#eff6ff", "#f5f5f4", "#fafaf9"],
  CustomerHeaderBgColor:["#ffffff", "#f8fafc", "#0f172a", "#1c2044", "#0d9488", "#0891b2", "#7c3aed", "#111827", "#1e293b", "#164e63", "#312e81", "#1a1a2e"],
  AdminSidebarColor:    ["#1c2044", "#0f172a", "#1e1e2e", "#1a1a2e", "#111827", "#1f2937", "#312e81", "#164e63", "#0c1445", "#1a0533", "#0a192f", "#0d1117"],
  AdminPrimaryColor:    ["#0d9488", "#0891b2", "#2563eb", "#7c3aed", "#dc2626", "#16a34a", "#d97706", "#6366f1", "#06b6d4", "#10b981", "#3b82f6", "#8b5cf6"],
  AdminAccentColor:     ["#7c3aed", "#0d9488", "#db2777", "#f97316", "#eab308", "#06b6d4", "#84cc16", "#6366f1", "#ec4899", "#f43f5e", "#14b8a6", "#a855f7"],
};

/* ─── Font Options ────────────────────────────────────────────────────── */
const FONT_OPTIONS = [
  { value: "Inter",             label: "Inter",              category: "Sans-serif" },
  { value: "Roboto",            label: "Roboto",             category: "Sans-serif" },
  { value: "Open Sans",         label: "Open Sans",          category: "Sans-serif" },
  { value: "Lato",              label: "Lato",               category: "Sans-serif" },
  { value: "Poppins",           label: "Poppins",            category: "Sans-serif" },
  { value: "Nunito",            label: "Nunito",             category: "Sans-serif" },
  { value: "DM Sans",           label: "DM Sans",            category: "Sans-serif" },
  { value: "Outfit",            label: "Outfit",             category: "Sans-serif" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans",  category: "Sans-serif" },
  { value: "Montserrat",        label: "Montserrat",         category: "Sans-serif" },
  { value: "Raleway",           label: "Raleway",            category: "Sans-serif" },
  { value: "Work Sans",         label: "Work Sans",          category: "Sans-serif" },
  { value: "Ubuntu",            label: "Ubuntu",             category: "Sans-serif" },
  { value: "Fira Sans",         label: "Fira Sans",          category: "Sans-serif" },
  { value: "IBM Plex Sans",     label: "IBM Plex Sans",      category: "Sans-serif" },
  { value: "Josefin Sans",      label: "Josefin Sans",       category: "Sans-serif" },
  { value: "Manrope",           label: "Manrope",            category: "Sans-serif" },
  { value: "Mulish",            label: "Mulish",             category: "Sans-serif" },
  { value: "Quicksand",         label: "Quicksand",          category: "Sans-serif" },
  { value: "Noto Sans",         label: "Noto Sans",          category: "Sans-serif" },
  { value: "Source Code Pro",   label: "Source Code Pro",    category: "Monospace" },
  { value: "Playfair Display",  label: "Playfair Display",   category: "Serif" },
  { value: "Merriweather",      label: "Merriweather",       category: "Serif" },
  { value: "Libre Baskerville", label: "Libre Baskerville",  category: "Serif" },
  { value: "Crimson Text",      label: "Crimson Text",       category: "Serif" },
];

/* ─── Theme Presets ──────────────────────────────────────────────────── */
const THEME_PRESETS: { name: string; emoji: string; values: Record<string, string> }[] = [
  { name: "Teal (Varsayılan)", emoji: "🩵", values: { PrimaryColor: "#0d9488", AccentColor: "#7c3aed", AdminSidebarColor: "#1c2044", CustomerBgColor: "#F7FAFA" } },
  { name: "Ocean Blue",       emoji: "🌊", values: { PrimaryColor: "#0284c7", AccentColor: "#f97316", AdminSidebarColor: "#0c1a2e", CustomerBgColor: "#f0f9ff" } },
  { name: "Forest Green",     emoji: "🌿", values: { PrimaryColor: "#166534", AccentColor: "#b45309", AdminSidebarColor: "#0f2318", CustomerBgColor: "#f0fdf4" } },
  { name: "Berry Purple",     emoji: "🍇", values: { PrimaryColor: "#7c3aed", AccentColor: "#db2777", AdminSidebarColor: "#1a0533", CustomerBgColor: "#fdf4ff" } },
  { name: "Rose Red",         emoji: "🌹", values: { PrimaryColor: "#e11d48", AccentColor: "#7c3aed", AdminSidebarColor: "#1a0a0a", CustomerBgColor: "#fff1f2" } },
  { name: "Midnight Slate",   emoji: "🌙", values: { PrimaryColor: "#6366f1", AccentColor: "#06b6d4", AdminSidebarColor: "#0d1117", CustomerBgColor: "#f8fafc" } },
  { name: "Warm Amber",       emoji: "🌅", values: { PrimaryColor: "#d97706", AccentColor: "#059669", AdminSidebarColor: "#1c1204", CustomerBgColor: "#fffbeb" } },
  { name: "Coral Orange",     emoji: "🍊", values: { PrimaryColor: "#ea580c", AccentColor: "#7c3aed", AdminSidebarColor: "#1c0a04", CustomerBgColor: "#fff7ed" } },
];

/* ─── Template Definitions ───────────────────────────────────────── */
const TEMPLATES = [
  {
    id: "modern", name: "Modern", emoji: "✨",
    description: "4 sütun, teal vurgular, yuvarlak köşeler. Varsayılan evrensel tasarım.",
    tags: ["Varsayılan", "4 Sütun"],
    columns: 4, headerLayout: "standard",
    headerColor: "#ffffff", bgColor: "#F7FAFA", cardBg: "#ffffff", textColor: "#1c2044", svgRadius: 6, hasShadow: true,
  },
  {
    id: "minimal", name: "Minimalist", emoji: "◻️",
    description: "4 sütun, gölgesiz, ince kenarlık, bol beyaz alan. Apple-esintili sade tasarım.",
    tags: ["Sade", "Apple"],
    columns: 4, headerLayout: "standard",
    headerColor: "#ffffff", bgColor: "#ffffff", cardBg: "#ffffff", textColor: "#111827", svgRadius: 3, hasShadow: false,
  },
  {
    id: "bold", name: "Güçlü & Cesur", emoji: "💪",
    description: "Renkli başlık, pill şekiller, güçlü gölgeler. Kampanya ve spor siteleri için.",
    tags: ["Enerjik", "Dikkat Çekici"],
    columns: 4, headerLayout: "standard",
    headerColor: "#0d9488", bgColor: "#f8fafc", cardBg: "#ffffff", textColor: "#0f172a", svgRadius: 10, hasShadow: true,
  },
  {
    id: "dark", name: "Koyu Tema", emoji: "🌙",
    description: "Tam gece modu, derin koyu arka plan. Gaming, müzik ve teknoloji için.",
    tags: ["Koyu", "Gece"],
    columns: 4, headerLayout: "standard",
    headerColor: "#1e293b", bgColor: "#0f172a", cardBg: "#1e293b", textColor: "#f1f5f9", svgRadius: 6, hasShadow: true,
  },
  {
    id: "showcase", name: "Vitrin", emoji: "🖼️",
    description: "2 sütun, çok uzun kart görselleri, nefes alan düzen. Lüks moda için.",
    tags: ["Premium", "2 Sütun"],
    columns: 2, headerLayout: "standard",
    headerColor: "#ffffff", bgColor: "#fafaf9", cardBg: "#ffffff", textColor: "#1c1917", svgRadius: 10, hasShadow: true,
  },
  {
    id: "luxe", name: "Lüks", emoji: "👑",
    description: "3 sütun, 2 satırlı ortalanmış başlık, sıcak altın tonları. Butik ve mücevher için.",
    tags: ["Lüks", "Ortalanmış"],
    columns: 3, headerLayout: "centered",
    headerColor: "#fffef9", bgColor: "#faf9f6", cardBg: "#fffbeb", textColor: "#78350f", svgRadius: 6, hasShadow: true,
  },
  {
    id: "sport", name: "Spor", emoji: "⚡",
    description: "5 sütun, tam genişlik koyu başlık, turuncu vurgular. Spor ve outdoor için.",
    tags: ["Spor", "5 Sütun"],
    columns: 5, headerLayout: "fullwidth-dark",
    headerColor: "#0f172a", bgColor: "#f1f5f9", cardBg: "#ffffff", textColor: "#0f172a", svgRadius: 4, hasShadow: true,
  },
  {
    id: "retro", name: "Retro", emoji: "🕰️",
    description: "2 sütun, sıcak sarı tonlar, kalın köşeli çerçeve. Vintage ve el yapımı için.",
    tags: ["Vintage", "2 Sütun"],
    columns: 2, headerLayout: "retro",
    headerColor: "#fef3c7", bgColor: "#fef9ef", cardBg: "#fffbeb", textColor: "#92400e", svgRadius: 2, hasShadow: false,
  },
  {
    id: "instagram", name: "Instagram", emoji: "📸",
    description: "3 sütun kare ızgara, metin hover'da ortaya çıkar. Görsel odaklı, sosyal medya hissi.",
    tags: ["Görsel", "Hover"],
    columns: 3, headerLayout: "standard",
    headerColor: "#ffffff", bgColor: "#fafafa", cardBg: "#e8e8e8", textColor: "#262626", svgRadius: 0, hasShadow: false,
  },
  {
    id: "masonry", name: "Masonry", emoji: "🧱",
    description: "Pinterest tarzı CSS columns, değişken kart yükseklikleri. Doğal, akıcı düzen.",
    tags: ["Pinterest", "Dinamik"],
    columns: 3, headerLayout: "standard",
    headerColor: "#ffffff", bgColor: "#f8f7f4", cardBg: "#ffffff", textColor: "#1a1a1a", svgRadius: 8, hasShadow: true,
  },
  {
    id: "brutalist", name: "Brutalist", emoji: "🏗️",
    description: "Kalın siyah kenarlıklar, offset gölge, köşeli tasarım. Ham, güçlü estetik.",
    tags: ["Ham", "Güçlü"],
    columns: 3, headerLayout: "bordered",
    headerColor: "#ffffff", bgColor: "#f5f5f5", cardBg: "#ffffff", textColor: "#000000", svgRadius: 0, hasShadow: false,
  },
  {
    id: "glassmorphism", name: "Cam Efekti", emoji: "🫧",
    description: "Mor gradient arka plan üzerinde buzlu cam kartlar. Modern ve derinlikli görünüm.",
    tags: ["Glassmorphism", "Gradient"],
    columns: 4, headerLayout: "glass",
    headerColor: "rgba(255,255,255,0.12)", bgColor: "#3d0066", cardBg: "rgba(255,255,255,0.13)", textColor: "#ffffff", svgRadius: 10, hasShadow: true,
  },
  {
    id: "neon", name: "Neon / Siber Punk", emoji: "🌆",
    description: "Siyah arka plan, magenta ışıltılı kenarlıklar. Gaming ve müzik siteleri için.",
    tags: ["Neon", "Siber Punk"],
    columns: 4, headerLayout: "dark",
    headerColor: "#0a0020", bgColor: "#050010", cardBg: "#0d0025", textColor: "#f0e6ff", svgRadius: 6, hasShadow: false,
  },
  {
    id: "pastel", name: "Pastel", emoji: "🎨",
    description: "Her kart farklı pastel renk, pill şekiller, tatlı görünüm. Çocuk ve hediye için.",
    tags: ["Renkli", "Eğlenceli"],
    columns: 4, headerLayout: "pastel",
    headerColor: "#fce7f3", bgColor: "#fdf4ff", cardBg: "#fce7f3", textColor: "#831843", svgRadius: 12, hasShadow: true,
  },
  {
    id: "catalog", name: "Katalog", emoji: "🛒",
    description: "5 sütun, koyu başlık, sarı arama kutusu. Amazon tarzı yoğun ürün listeleme.",
    tags: ["Katalog", "5 Sütun"],
    columns: 5, headerLayout: "amazon",
    headerColor: "#131921", bgColor: "#eaeded", cardBg: "#ffffff", textColor: "#0f1111", svgRadius: 1, hasShadow: true,
  },
] as const;

function TemplatePreview({ tmpl }: { tmpl: typeof TEMPLATES[number] }) {
  const { headerColor, bgColor, cardBg, textColor, svgRadius, hasShadow, id, columns, headerLayout } = tmpl;

  /* Accent rengi */
  const accent =
    id === "dark" ? "#38bdf8" :
    id === "luxe" || id === "retro" ? "#d97706" :
    id === "sport" ? "#f97316" :
    id === "brutalist" ? "#000000" :
    id === "glassmorphism" ? "#a78bfa" :
    id === "neon" ? "#cc00ff" :
    id === "pastel" ? "#ec4899" :
    id === "catalog" ? "#febd69" :
    id === "instagram" ? "#262626" :
    "#0d9488";

  /* Görsel arka plan */
  const imgBg =
    id === "dark" ? "#334155" :
    id === "luxe" || id === "retro" ? "#fde68a" :
    id === "glassmorphism" ? "rgba(255,255,255,0.15)" :
    id === "neon" ? "#1a003a" :
    id === "instagram" ? "#c8c8c8" :
    id === "catalog" ? "#f0f0f0" :
    "#e2e8f0";

  /* Header açık mı koyu mu */
  const darkHeaders = ["#1e293b","#0f172a","#0a0020","#131921","#0d9488","rgba(255,255,255,0.12)"];
  const isLightHdr = !darkHeaders.some(c => headerColor.startsWith(c));
  const searchBg = isLightHdr ? "#f1f5f9" : id === "catalog" ? "#ffffff" : "rgba(255,255,255,0.18)";
  const iconBg   = isLightHdr ? "#e2e8f0" : "rgba(255,255,255,0.22)";
  const logoBg   = isLightHdr ? accent : "rgba(255,255,255,0.3)";

  /* Hero banner dolgusu */
  const heroFill =
    id === "dark" ? "#1e293b" :
    id === "sport" ? "#1e293b" :
    id === "neon" ? "#1a003a" :
    id === "retro" ? "#fde68a" :
    id === "luxe" ? "#fef3c7" :
    id === "glassmorphism" ? "rgba(255,255,255,0.1)" :
    id === "catalog" ? "#232f3e" :
    id === "brutalist" ? "#f5f5f5" :
    accent + "22";

  const cr = Math.min(svgRadius, 8);
  const isCentered = headerLayout === "centered";
  const headerH    = isCentered ? 30 : 22;
  const heroY      = headerH + 4;
  const heroH      = columns >= 5 ? 16 : columns <= 2 ? 20 : 18;
  const cardsY     = heroY + heroH + 4;

  const displayCols = Math.min(columns, 5);
  const gap = columns >= 5 ? 2 : 3;
  const cw  = Math.floor((168 - (displayCols - 1) * gap) / displayCols);
  const cardH = Math.min(112 - cardsY - 6, columns >= 5 ? 24 : columns <= 2 ? 48 : columns === 3 ? 38 : 34);
  const imgH  = id === "instagram" ? cardH : Math.floor(cardH * 0.55);

  return (
    <svg viewBox="0 0 180 112" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "100%" }}>
      {/* Arka plan */}
      {id === "glassmorphism" ? (
        <>
          <defs>
            <linearGradient id={`gl_${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a0533" />
              <stop offset="50%" stopColor="#3d0066" />
              <stop offset="100%" stopColor="#0f2460" />
            </linearGradient>
          </defs>
          <rect width="180" height="112" fill={`url(#gl_${id})`} />
        </>
      ) : (
        <rect width="180" height="112" fill={bgColor} />
      )}

      {/* Başlık */}
      <rect width="180" height={headerH} fill={headerColor} opacity={id === "glassmorphism" ? 0.4 : 1} />
      {/* Brutalist başlık alt çizgisi */}
      {id === "brutalist" && <rect width="180" y={headerH - 3} height="3" fill="#000" />}
      {/* Retro başlık alt çizgisi */}
      {id === "retro" && <rect width="180" y={headerH - 3} height="3" fill="#d97706" />}
      {/* Catalog ince alt şerit */}
      {id === "catalog" && <rect width="180" y={headerH} height="3" fill="#febd69" />}

      {/* Başlık içeriği */}
      {isCentered ? (
        <>
          <rect x="75" y="3" width="30" height="6" rx={2} fill={logoBg} />
          <rect x="20" y="12" width="140" height="8" rx={Math.min(svgRadius, 5)} fill={searchBg} />
          <rect x="162" y="3" width="12" height="6" rx={2} fill={iconBg} />
        </>
      ) : (
        <>
          <rect x="6" y="7" width="22" height="8" rx={svgRadius > 0 ? 4 : 0} fill={logoBg} />
          {/* Catalog: sarı bordered arama kutusu */}
          {id === "catalog"
            ? <rect x="36" y="5" width="86" height="12" rx={0} fill="#ffffff" stroke="#febd69" strokeWidth="2" />
            : <rect x="36" y="6" width="86" height="10" rx={Math.min(svgRadius * 2, 8)} fill={searchBg} />
          }
          <rect x="134" y="7" width="8" height="8" rx={svgRadius > 0 ? 4 : 0} fill={iconBg} />
          <rect x="146" y="7" width="8" height="8" rx={svgRadius > 0 ? 4 : 0} fill={iconBg} />
          <rect x="158" y="7" width="16" height="8" rx={svgRadius > 0 ? 3 : 0}
            fill={id === "bold" ? "rgba(255,255,255,0.85)" : id === "catalog" ? "#febd69" : iconBg} />
        </>
      )}

      {/* Hero banner */}
      <rect x="6" y={heroY} width="168" height={heroH} rx={svgRadius > 0 ? Math.min(svgRadius, 6) : 0} fill={heroFill} />
      <rect x="12" y={heroY + Math.floor(heroH * 0.3)} width="38" height="3" rx="1"
        fill={id === "glassmorphism" || id === "neon" || id === "sport" || id === "dark" ? "rgba(255,255,255,0.7)" : accent} opacity="0.75" />

      {/* Ürün kartları */}
      {Array.from({ length: displayCols }, (_, i) => {
        const cx = 6 + i * (cw + gap);
        const cy = cardsY;
        const h  = id === "masonry" ? cardH + (i % 3 === 0 ? 14 : i % 3 === 1 ? -8 : 4) : cardH;
        const ih = id === "instagram" ? h : Math.floor(h * 0.55);

        /* Kart arka plan rengi (masonry için hepsi aynı, pastel için farklı) */
        const pastels = ["#fce7f3","#ecfdf5","#eff6ff","#fefce8","#fff7ed"];
        const cBg = id === "pastel" ? pastels[i % 5] : cardBg;

        /* Neon parlama rengi */
        const neonGlow = "rgba(204,0,255,0.4)";

        return (
          <g key={i}>
            {/* Gölge */}
            {id !== "brutalist" && id !== "neon" && hasShadow && (
              <rect x={cx + 1} y={cy + 1} width={cw} height={h} rx={cr} fill="rgba(0,0,0,0.08)" />
            )}
            {/* Kart zemini */}
            <rect x={cx} y={cy} width={cw} height={h} rx={id === "brutalist" ? 0 : cr}
              fill={id === "glassmorphism" ? "rgba(255,255,255,0.15)" : cBg}
              stroke={id === "brutalist" ? "#000" : id === "neon" ? "#cc00ff" : id === "retro" ? "#92400e" : "none"}
              strokeWidth={id === "brutalist" ? "2" : id === "neon" || id === "retro" ? "1" : "0"}
            />
            {/* Brutalist offset gölge */}
            {id === "brutalist" && <rect x={cx + 3} y={cy + 3} width={cw} height={h} rx={0} fill="rgba(0,0,0,0.15)" style={{ zIndex: -1 }} />}
            {/* Neon ışıltı */}
            {id === "neon" && <rect x={cx - 1} y={cy - 1} width={cw + 2} height={h + 2} rx={cr + 1} fill="none" stroke={neonGlow} strokeWidth="3" />}

            {/* Görsel alanı */}
            <rect x={cx + 1} y={cy + 1} width={cw - 2} height={ih} rx={id === "brutalist" ? 0 : Math.max(cr - 1, 0)} fill={imgBg} />

            {/* Instagram: overlay karartma */}
            {id === "instagram" && (
              <rect x={cx} y={cy + Math.floor(h * 0.6)} width={cw} height={Math.floor(h * 0.4)} rx={0}
                fill="rgba(0,0,0,0.55)" opacity="0.8" />
            )}

            {/* Metin satırları */}
            {cw > 18 && id !== "instagram" && (
              <>
                <rect x={cx + 2} y={cy + ih + 3} width={Math.floor(cw * 0.65)} height="2" rx="0.5"
                  fill={id === "glassmorphism" || id === "neon" ? "rgba(255,255,255,0.5)" : textColor} opacity="0.28" />
                {cw > 26 && (
                  <rect x={cx + 2} y={cy + ih + 7} width={Math.floor(cw * 0.4)} height="2" rx="0.5"
                    fill={accent} opacity="0.75" />
                )}
              </>
            )}
          </g>
        );
      })}

      {/* Footer */}
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={i} x={28 + i * 26} y="108" width="20" height="3" rx="1"
          fill={i === 0 ? accent : (id === "dark" || id === "neon" ? "#334155" : id === "glassmorphism" ? "rgba(255,255,255,0.15)" : "#e2e8f0")} />
      ))}
    </svg>
  );
}

type Tab = "genel" | "gorunum" | "sablon" | "kargo" | "menu" | "icerik" | "chatbot" | "odeme" | "mesajlar" | "yetkiler" | "lisans" | "sistem";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "genel",    label: "Genel",    icon: <Globe size={14} /> },
  { id: "gorunum",  label: "Görünüm",  icon: <Palette size={14} /> },
  { id: "sablon",   label: "Şablon",   icon: <Layers size={14} /> },
  { id: "kargo",    label: "Kargo",    icon: <Truck size={14} /> },
  { id: "menu",     label: "Menü",     icon: <Menu size={14} /> },
  { id: "icerik",   label: "İçerik",   icon: <FileText size={14} /> },
  { id: "chatbot",  label: "Chatbot",  icon: <MessageCircle size={14} /> },
  { id: "odeme",    label: "Ödeme",    icon: <CreditCard size={14} /> },
  { id: "mesajlar", label: "Mesajlar", icon: <MessageSquare size={14} /> },
  { id: "yetkiler", label: "Yetkiler", icon: <Shield size={14} /> },
  { id: "lisans",   label: "Lisans",   icon: <KeyRound size={14} /> },
  { id: "sistem",   label: "Sistem",   icon: <Settings size={14} /> },
];

type ContentSub = "sss" | "iade" | "kargo" | "iletisim" | "hakkimizda" | "kvkk" | "gizlilik" | "footer";
const CONTENT_SUBS: { id: ContentSub; label: string }[] = [
  { id: "sss",       label: "SSS" },
  { id: "iade",      label: "İade & Değişim" },
  { id: "kargo",     label: "Kargo Takibi" },
  { id: "iletisim",  label: "İletişim" },
  { id: "hakkimizda",label: "Hakkımızda" },
  { id: "kvkk",      label: "KVKK" },
  { id: "gizlilik",  label: "Gizlilik" },
  { id: "footer",    label: "Footer" },
];

/* ─── RBAC Matrix ────────────────────────────────────────────────────── */
const ROLE_COLUMNS = [
  { key: "SuperAdmin",     label: "Süper Admin" },
  { key: "Admin",          label: "Admin" },
  { key: "ProductManager", label: "Ürün Yön." },
  { key: "StockManager",   label: "Stok Yön." },
  { key: "OrderManager",   label: "Sipariş Yön." },
  { key: "CustomerSupport",label: "Müşteri Des." },
  { key: "FinanceUser",    label: "Finans" },
  { key: "ContentManager", label: "İçerik Yön." },
];

// module names MUST match nav item labels in layout.tsx exactly
const PERMISSION_MATRIX: { module: string; group: string; roles: string[] }[] = [
  // ── Genel
  { module: "Dashboard",     group: "Genel",     roles: ["SuperAdmin","Admin","ProductManager","StockManager","OrderManager","CustomerSupport","FinanceUser","ContentManager"] },
  { module: "Analiz",        group: "Genel",     roles: ["SuperAdmin","Admin","FinanceUser"] },
  { module: "Hedefler",      group: "Genel",     roles: ["SuperAdmin","Admin","FinanceUser"] },
  // ── Katalog
  { module: "Ürünler",       group: "Katalog",   roles: ["SuperAdmin","Admin","ProductManager"] },
  { module: "Kategoriler",   group: "Katalog",   roles: ["SuperAdmin","Admin","ProductManager","ContentManager"] },
  { module: "Markalar",      group: "Katalog",   roles: ["SuperAdmin","Admin","ProductManager","ContentManager"] },
  { module: "Stok",          group: "Katalog",   roles: ["SuperAdmin","Admin","StockManager","ProductManager"] },
  { module: "Yorumlar",      group: "Katalog",   roles: ["SuperAdmin","Admin","CustomerSupport","ContentManager"] },
  { module: "Duyurular",     group: "Katalog",   roles: ["SuperAdmin","Admin","ContentManager"] },
  // ── Satış
  { module: "Siparişler",    group: "Satış",     roles: ["SuperAdmin","Admin","OrderManager","CustomerSupport","FinanceUser"] },
  { module: "Ödemeler",      group: "Satış",     roles: ["SuperAdmin","Admin","FinanceUser"] },
  { module: "İadeler",       group: "Satış",     roles: ["SuperAdmin","Admin","OrderManager","CustomerSupport","FinanceUser"] },
  { module: "Kuponlar",      group: "Satış",     roles: ["SuperAdmin","Admin","FinanceUser"] },
  { module: "Kargo",         group: "Satış",     roles: ["SuperAdmin","Admin","OrderManager"] },
  { module: "Faturalar",     group: "Satış",     roles: ["SuperAdmin","Admin","FinanceUser"] },
  // ── Kullanıcı
  { module: "Kullanıcılar",  group: "Kullanıcı", roles: ["SuperAdmin","Admin","CustomerSupport"] },
  { module: "Ziyaretçiler",  group: "Kullanıcı", roles: ["SuperAdmin","Admin"] },
  // ── Sistem
  { module: "Hareketler",    group: "Sistem",    roles: ["SuperAdmin","Admin"] },
  { module: "Takip",         group: "Sistem",    roles: ["SuperAdmin","Admin"] },
  { module: "Dış Kaynaklar", group: "Sistem",    roles: ["SuperAdmin","Admin"] },
  { module: "Servisler",     group: "Sistem",    roles: ["SuperAdmin","Admin"] },
  { module: "Kuyruklar",     group: "Sistem",    roles: ["SuperAdmin","Admin"] },
  { module: "Dokümanlar",    group: "Sistem",    roles: ["SuperAdmin","Admin","ProductManager","StockManager","OrderManager","CustomerSupport","FinanceUser","ContentManager"] },
  { module: "Yönetim",       group: "Sistem",    roles: ["SuperAdmin","Admin"] },
];

/* ─── MenuSorter ─────────────────────────────────────────────────────── */
function MenuSorter({
  order, onOrderChange, groupConfig, onGroupConfigChange,
}: {
  order: string[];
  onOrderChange: (n: string[]) => void;
  groupConfig: MenuGroupConfig;
  onGroupConfigChange: (c: MenuGroupConfig) => void;
}) {
  const [dragInfo, setDragInfo] = useState<{ groupId: string; fromIdx: number } | null>(null);
  const [overInfo, setOverInfo] = useState<{ groupId: string; idx: number } | null>(null);

  function getItemGroup(href: string): string {
    return groupConfig.itemGroups[href]
      ?? ALL_MENU_ITEMS.find(m => m.href === href)?.group
      ?? "sistem";
  }

  const groupedItems = groupConfig.groupOrder.map(gId => ({
    groupId: gId,
    label: groupConfig.groupLabels[gId] ?? DEFAULT_GROUP_LABELS[gId] ?? gId,
    icon: groupConfig.groupIcons[gId] ?? DEFAULT_GROUP_ICONS[gId] ?? "Settings",
    items: order.filter(href => getItemGroup(href) === gId),
  }));

  function rebuildOrder(grps: typeof groupedItems): string[] {
    return grps.flatMap(g => g.items);
  }

  function moveItemUp(groupId: string, itemIdx: number) {
    if (itemIdx === 0) return;
    const newGrouped = groupedItems.map(g => {
      if (g.groupId !== groupId) return g;
      const ni = [...g.items];
      [ni[itemIdx - 1], ni[itemIdx]] = [ni[itemIdx], ni[itemIdx - 1]];
      return { ...g, items: ni };
    });
    onOrderChange(rebuildOrder(newGrouped));
  }

  function moveItemDown(groupId: string, itemIdx: number) {
    const grp = groupedItems.find(g => g.groupId === groupId)!;
    if (itemIdx >= grp.items.length - 1) return;
    const newGrouped = groupedItems.map(g => {
      if (g.groupId !== groupId) return g;
      const ni = [...g.items];
      [ni[itemIdx], ni[itemIdx + 1]] = [ni[itemIdx + 1], ni[itemIdx]];
      return { ...g, items: ni };
    });
    onOrderChange(rebuildOrder(newGrouped));
  }

  function moveItemToGroup(href: string, targetGroupId: string) {
    onGroupConfigChange({
      ...groupConfig,
      itemGroups: { ...groupConfig.itemGroups, [href]: targetGroupId },
    });
  }

  function moveGroupUp(groupId: string) {
    const idx = groupConfig.groupOrder.indexOf(groupId);
    if (idx === 0) return;
    const next = [...groupConfig.groupOrder];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onGroupConfigChange({ ...groupConfig, groupOrder: next });
  }

  function moveGroupDown(groupId: string) {
    const idx = groupConfig.groupOrder.indexOf(groupId);
    if (idx >= groupConfig.groupOrder.length - 1) return;
    const next = [...groupConfig.groupOrder];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onGroupConfigChange({ ...groupConfig, groupOrder: next });
  }

  function handleDrop(toGroupId: string, toIdx: number) {
    if (!dragInfo) return;
    const { groupId: fromGroupId, fromIdx } = dragInfo;
    if (fromGroupId !== toGroupId) {
      const href = groupedItems.find(g => g.groupId === fromGroupId)!.items[fromIdx];
      moveItemToGroup(href, toGroupId);
    } else {
      const newGrouped = groupedItems.map(g => {
        if (g.groupId !== toGroupId) return g;
        const ni = [...g.items];
        const [moved] = ni.splice(fromIdx, 1);
        ni.splice(toIdx, 0, moved);
        return { ...g, items: ni };
      });
      onOrderChange(rebuildOrder(newGrouped));
    }
    setDragInfo(null);
    setOverInfo(null);
  }

  return (
    <div className="space-y-3">
      {groupedItems.map((group, gi) => {
        const GroupIcon = MENU_ICON_OPTIONS.find(o => o.name === group.icon)?.icon ?? Settings;
        return (
          <div key={group.groupId} className="border border-slate-200 rounded-2xl overflow-hidden">
            {/* Group header */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2.5 border-b border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <GroupIcon size={13} className="text-indigo-600" />
              </div>
              <input
                value={group.label}
                onChange={e => onGroupConfigChange({
                  ...groupConfig,
                  groupLabels: { ...groupConfig.groupLabels, [group.groupId]: e.target.value },
                })}
                className="flex-1 text-sm font-bold text-slate-700 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 focus:rounded-lg px-2 py-0.5 min-w-0"
              />
              <select
                value={group.icon}
                onChange={e => onGroupConfigChange({
                  ...groupConfig,
                  groupIcons: { ...groupConfig.groupIcons, [group.groupId]: e.target.value },
                })}
                className="text-[10px] border border-slate-200 rounded-lg px-1.5 py-1 bg-white text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 shrink-0"
              >
                {MENU_ICON_OPTIONS.map(o => (
                  <option key={o.name} value={o.name}>{o.name}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">{group.items.length}</span>
              <div className="flex gap-0.5 shrink-0">
                <button disabled={gi === 0} onClick={() => moveGroupUp(group.groupId)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 transition">
                  <ChevronUp size={13} />
                </button>
                <button disabled={gi === groupedItems.length - 1} onClick={() => moveGroupDown(group.groupId)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 transition">
                  <ChevronDown size={13} />
                </button>
              </div>
            </div>
            {/* Items */}
            <div className="p-2 space-y-1.5">
              {group.items.length === 0 && (
                <div
                  className="text-xs text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 rounded-xl"
                  onDragOver={e => { e.preventDefault(); setOverInfo({ groupId: group.groupId, idx: 0 }); }}
                  onDrop={() => handleDrop(group.groupId, 0)}
                >
                  Boş grup — buraya sürükleyin
                </div>
              )}
              {group.items.map((href, itemIdx) => {
                const meta = ALL_MENU_ITEMS.find(m => m.href === href);
                if (!meta) return null;
                const isOver = overInfo?.groupId === group.groupId && overInfo.idx === itemIdx;
                const isDragging = dragInfo?.groupId === group.groupId && dragInfo.fromIdx === itemIdx;
                return (
                  <div key={href} draggable
                    onDragStart={() => setDragInfo({ groupId: group.groupId, fromIdx: itemIdx })}
                    onDragOver={e => { e.preventDefault(); setOverInfo({ groupId: group.groupId, idx: itemIdx }); }}
                    onDrop={() => handleDrop(group.groupId, itemIdx)}
                    onDragEnd={() => { setDragInfo(null); setOverInfo(null); }}
                    className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition select-none cursor-grab ${
                      isDragging ? "opacity-40 border-slate-200 bg-white" :
                      isOver ? "border-teal-400 bg-teal-50 shadow-sm" :
                      "border-slate-200 bg-white hover:border-slate-300"
                    }`}>
                    <GripVertical size={13} className="text-slate-300 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 flex-1">{meta.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{href}</span>
                    <select
                      value={groupConfig.itemGroups[href] ?? group.groupId}
                      onChange={e => moveItemToGroup(href, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      title="Grubu değiştir"
                      className="text-[10px] border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer shrink-0"
                    >
                      {groupConfig.groupOrder.map(gId => (
                        <option key={gId} value={gId}>
                          {groupConfig.groupLabels[gId] ?? DEFAULT_GROUP_LABELS[gId] ?? gId}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-0.5 shrink-0">
                      <button disabled={itemIdx === 0} onClick={() => moveItemUp(group.groupId, itemIdx)}
                        className="p-0.5 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 transition">
                        <ChevronUp size={12} />
                      </button>
                      <button disabled={itemIdx === group.items.length - 1} onClick={() => moveItemDown(group.groupId, itemIdx)}
                        className="p-0.5 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 transition">
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── FAQ editor ─────────────────────────────────────────────────────── */
function FaqEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [items, setItems] = useState<FaqItem[]>(() => {
    try { return JSON.parse(value) as FaqItem[]; } catch { return []; }
  });
  const lastValue = useRef(value);

  useEffect(() => {
    if (value !== lastValue.current) {
      lastValue.current = value;
      try { setItems(JSON.parse(value) as FaqItem[]); } catch { setItems([]); }
    }
  }, [value]);

  function update(next: FaqItem[]) {
    setItems(next);
    lastValue.current = JSON.stringify(next);
    onChange(JSON.stringify(next));
  }

  function add() { update([...items, { q: "", a: "" }]); }
  function remove(i: number) { update(items.filter((_, idx) => idx !== i)); }
  function setField(i: number, field: "q" | "a", val: string) {
    update(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          Henüz soru yok. Eklemek için aşağıdaki butonu kullanın.
        </div>
      )}
      {items.map((item, i) => (
        <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <HelpCircle size={14} className="text-teal-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-500">Soru {i + 1}</span>
            <button onClick={() => remove(i)}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
              <Trash2 size={13} />
            </button>
          </div>
          <input value={item.q} onChange={e => setField(i, "q", e.target.value)}
            placeholder="Soru metni..."
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <textarea value={item.a} onChange={e => setField(i, "a", e.target.value)}
            placeholder="Cevap metni..."
            rows={3}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
        </div>
      ))}
      <button onClick={add}
        className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 border border-teal-200 hover:border-teal-400 bg-teal-50 hover:bg-teal-100 rounded-xl px-4 py-2.5 transition w-full justify-center">
        <Plus size={15} /> Soru Ekle
      </button>
    </div>
  );
}

/* ─── Text page editor ───────────────────────────────────────────────── */
function TextEditor({ label, settingKey, value, onChange, rows = 12, hint }: {
  label: string; settingKey: string; value: string;
  onChange: (key: string, val: string) => void;
  rows?: number; hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600">{label}</label>
        {value && <span className="text-xs text-slate-400">{value.length} karakter</span>}
      </div>
      <textarea value={value} onChange={e => onChange(settingKey, e.target.value)}
        rows={rows} placeholder="İçerik buraya girilecek..."
        className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 resize-y font-sans leading-relaxed" />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/* ─── Carrier Manager (Kargo Firmaları CRUD) ─────────────────────────── */
interface ShippingCarrier {
  id: string; name: string; code: string; isActive: boolean;
  basePrice: number; freeShippingThreshold: number | null;
  estimatedDays: number; maxWeightKg: number | null;
  trackingUrlTemplate: string | null; logoUrl: string | null;
  apiEndpoint: string | null; notes: string | null; weightPricingJson: string | null;
}

const emptyCarrierForm = {
  name: "", code: "", basePrice: 0, freeShippingThreshold: null as number | null,
  estimatedDays: 1, maxWeightKg: null as number | null, trackingUrlTemplate: "",
  logoUrl: "", apiEndpoint: "", notes: "", weightPricingJson: "", isActive: true,
};

function fmtTry(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);
}

function CarrierManager() {
  const [carriers, setCarriers] = useState<ShippingCarrier[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"create" | "edit" | null>(null);
  const [editing, setEditing]   = useState<ShippingCarrier | null>(null);
  const [form, setForm]         = useState({ ...emptyCarrierForm });
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ShippingCarrier | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCarriers(await api.get<ShippingCarrier[]>("/api/admin/shipping-carriers")); }
    catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm({ ...emptyCarrierForm }); setEditing(null); setFormError(""); setModal("create"); }
  function openEdit(c: ShippingCarrier) {
    setForm({
      name: c.name, code: c.code, basePrice: c.basePrice,
      freeShippingThreshold: c.freeShippingThreshold, estimatedDays: c.estimatedDays,
      maxWeightKg: c.maxWeightKg, trackingUrlTemplate: c.trackingUrlTemplate ?? "",
      logoUrl: c.logoUrl ?? "", apiEndpoint: c.apiEndpoint ?? "",
      notes: c.notes ?? "", weightPricingJson: c.weightPricingJson ?? "", isActive: c.isActive,
    });
    setEditing(c); setFormError(""); setModal("edit");
  }

  async function handleSave() {
    if (!form.name.trim() || !form.code.trim()) { setFormError("Firma adı ve kod zorunludur."); return; }
    setSaving(true); setFormError("");
    try {
      const body = {
        name: form.name, code: form.code, basePrice: form.basePrice,
        freeShippingThreshold: form.freeShippingThreshold || null,
        estimatedDays: form.estimatedDays, maxWeightKg: form.maxWeightKg || null,
        trackingUrlTemplate: form.trackingUrlTemplate || null, logoUrl: form.logoUrl || null,
        apiEndpoint: form.apiEndpoint || null, notes: form.notes || null,
        weightPricingJson: form.weightPricingJson || null, isActive: form.isActive,
      };
      if (modal === "create") await api.post("/api/admin/shipping-carriers", body);
      else await api.put(`/api/admin/shipping-carriers/${editing!.id}`, body);
      setModal(null); await load();
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : "Kayıt başarısız."); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try { await api.delete(`/api/admin/shipping-carriers/${deleteTarget.id}`); setDeleteTarget(null); await load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Silme başarısız."); }
  }

  const ci = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800";
  const cl = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-700">Kargo Firmaları</p>
          <p className="text-xs text-slate-400 mt-0.5">Alternatif kargo firmalarını, fiyatları ve takip URL şablonlarını yönetin.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition">
            <RefreshCw size={14} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition">
            <Plus size={14} /> Firma Ekle
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 py-4 text-center">Yükleniyor...</p>
      ) : carriers.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center">
          <Truck size={24} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">Henüz kargo firması eklenmemiş.</p>
          <button onClick={openCreate} className="mt-3 px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition">İlk Firmayı Ekle</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Firma</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Kod</th>
                <th className="text-right px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Baz Fiyat</th>
                <th className="text-right px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Ücretsiz Eşik</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Gün</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {carriers.map(c => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {c.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.logoUrl} alt={c.name} className="w-6 h-6 rounded object-contain border border-slate-100 bg-white" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-teal-50 flex items-center justify-center"><Truck size={11} className="text-teal-600" /></div>
                      )}
                      <span className="font-semibold text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{c.code}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-700">{fmtTry(c.basePrice)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-500">{c.freeShippingThreshold ? fmtTry(c.freeShippingThreshold) : <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{c.estimatedDays}g</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {c.isActive
                      ? <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Aktif</span>
                      : <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Pasif</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1 rounded hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteTarget(c)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Truck size={16} className="text-teal-600" />
                {modal === "create" ? "Yeni Kargo Firması" : "Firma Düzenle"}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{formError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={cl}>Firma Adı <span className="text-red-500">*</span></label><input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={ci} placeholder="Yurtiçi Kargo" /></div>
                <div><label className={cl}>Kod <span className="text-red-500">*</span></label><input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value.toLowerCase()}))} className={ci} placeholder="yurtici" /></div>
                <div><label className={cl}>Baz Fiyat (TRY)</label><input type="number" min={0} step={0.01} value={form.basePrice} onChange={e => setForm(f => ({...f, basePrice: +e.target.value}))} className={ci} /></div>
                <div><label className={cl}>Ücretsiz Kargo Eşiği (TRY)</label><input type="number" min={0} step={0.01} value={form.freeShippingThreshold ?? ""} onChange={e => setForm(f => ({...f, freeShippingThreshold: e.target.value ? +e.target.value : null}))} className={ci} placeholder="Boş = yok" /></div>
                <div><label className={cl}>Tahmini Teslimat (gün)</label><input type="number" min={1} max={30} value={form.estimatedDays} onChange={e => setForm(f => ({...f, estimatedDays: +e.target.value}))} className={ci} /></div>
                <div><label className={cl}>Maks. Ağırlık (kg)</label><input type="number" min={0} step={0.1} value={form.maxWeightKg ?? ""} onChange={e => setForm(f => ({...f, maxWeightKg: e.target.value ? +e.target.value : null}))} className={ci} placeholder="Boş = sınırsız" /></div>
              </div>
              <div><label className={cl}>Takip URL Şablonu</label><input value={form.trackingUrlTemplate} onChange={e => setForm(f => ({...f, trackingUrlTemplate: e.target.value}))} className={ci} placeholder="https://track.example.com/{0}" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={cl}>Logo URL</label><input value={form.logoUrl} onChange={e => setForm(f => ({...f, logoUrl: e.target.value}))} className={ci} /></div>
                <div><label className={cl}>API Endpoint</label><input value={form.apiEndpoint} onChange={e => setForm(f => ({...f, apiEndpoint: e.target.value}))} className={ci} /></div>
              </div>
              <div><label className={cl}>Notlar</label><textarea rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className={ci + " resize-none"} /></div>
              <div>
                <label className={cl}>Ağırlık Bazlı Fiyatlandırma (JSON)</label>
                <textarea rows={3} value={form.weightPricingJson} onChange={e => setForm(f => ({...f, weightPricingJson: e.target.value}))} className={ci + " resize-none font-mono text-xs"} placeholder='[{"minKg":0,"maxKg":1,"price":29.90}]' />
              </div>
              {modal === "edit" && (
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({...f, isActive: e.target.checked}))} className="sr-only peer" />
                    <div className="w-10 h-5 bg-slate-200 peer-checked:bg-teal-500 rounded-full peer transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                  </label>
                  <span className="text-sm text-slate-700">Aktif</span>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">İptal</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-60">
                  {saving ? "Kaydediliyor..." : modal === "create" ? "Ekle" : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><Trash2 size={18} className="text-red-600" /></div>
              <div><h3 className="font-bold text-slate-800">Firmayı Sil</h3><p className="text-sm text-slate-500">{deleteTarget.name}</p></div>
            </div>
            <p className="text-sm text-slate-600">Bu kargo firması kalıcı olarak silinecek. Emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition">İptal</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Ana sayfa ─────────────────────────────────────────────────────── */
export default function YonetimPage() {
  const [tab, setTab]             = useState<Tab>("genel");
  const [contentSub, setContentSub] = useState<ContentSub>("sss");
  const [settings, setSettings]   = useState<SiteSettings>(DEFAULTS);
  const [menuOrder, setMenuOrder] = useState<string[]>(ALL_MENU_ITEMS.map(i => i.href));
  const [menuGroupConfig, setMenuGroupConfig] = useState<MenuGroupConfig>({
    groupOrder: DEFAULT_GROUP_ORDER,
    groupLabels: { ...DEFAULT_GROUP_LABELS },
    groupIcons:  { ...DEFAULT_GROUP_ICONS },
    itemGroups:  {},
  });
  const tabsRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [testEmail, setTestEmail]               = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult]   = useState<{ ok: boolean; msg: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [openMsgGroups, setOpenMsgGroups] = useState<Set<string>>(new Set(["Doğrulama Mesajları"]));
  const [newMsgOpen, setNewMsgOpen] = useState(false);
  const [newMsgLabel, setNewMsgLabel] = useState("");
  const [newMsgValue, setNewMsgValue] = useState("");

  const defaultMatrix = Object.fromEntries(PERMISSION_MATRIX.map(r => [r.module, [...r.roles]]));
  const [rbacMatrix, setRbacMatrix] = useState<Record<string, string[]>>(defaultMatrix);
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [licenses, setLicenses] = useState<LicenseDto[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [licenseModal, setLicenseModal] = useState<{ open: boolean; license?: LicenseDto }>({ open: false });
  const [licenseForm, setLicenseForm] = useState({ module: "", description: "", expiresAt: "", isActive: true, notes: "" });
  const [licenseSaving, setLicenseSaving] = useState(false);
  const [licenseError, setLicenseError] = useState("");
  const [renewModal, setRenewModal] = useState<{ open: boolean; license?: LicenseDto }>({ open: false });
  const [renewMonths, setRenewMonths] = useState(12);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState("");
  const [services, setServices] = useState<ServiceState[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceAction, setServiceAction] = useState<string | null>(null);
  const [devKeyStatus, setDevKeyStatus] = useState<{ isConfigured: boolean; maskedKey: string | null; revealPasswordSet: boolean } | null>(null);
  const [devKeyLoading, setDevKeyLoading] = useState(false);
  const [revealModal, setRevealModal] = useState(false);
  const [revealPassword, setRevealPassword] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealError, setRevealError] = useState("");
  const [revealLoading, setRevealLoading] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const logoRef    = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);
  const adminLogoNamedRef  = useRef<HTMLInputElement>(null);
  const adminLogoIconRef   = useRef<HTMLInputElement>(null);
  const adminFaviconRef    = useRef<HTMLInputElement>(null);
  const customerLogoIconRef   = useRef<HTMLInputElement>(null);
  const customerLogoNamedRef  = useRef<HTMLInputElement>(null);
  const customerFaviconRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/api/admin/system-info").then(setSysInfo).catch(() => {});
    api.get<SiteSettings>("/api/admin/settings").then(data => {
      setSettings({ ...DEFAULTS, ...data });
      if (data.AdminMenuOrder) {
        try {
          const parsed: string[] = JSON.parse(data.AdminMenuOrder);
          const valid   = parsed.filter(h => ALL_MENU_ITEMS.some(m => m.href === h));
          const missing = ALL_MENU_ITEMS.filter(m => !valid.includes(m.href)).map(m => m.href);
          setMenuOrder([...valid, ...missing]);
        } catch { }
      }
      if (data.AdminMenuConfig) {
        try {
          const gc = JSON.parse(data.AdminMenuConfig) as Partial<MenuGroupConfig>;
          setMenuGroupConfig({
            groupOrder: gc.groupOrder?.length ? gc.groupOrder : DEFAULT_GROUP_ORDER,
            groupLabels: { ...DEFAULT_GROUP_LABELS, ...(gc.groupLabels ?? {}) },
            groupIcons:  { ...DEFAULT_GROUP_ICONS,  ...(gc.groupIcons  ?? {}) },
            itemGroups:  gc.itemGroups ?? {},
          });
        } catch { }
      }
      if (data.AdminRbacMatrix) {
        try {
          const parsed = JSON.parse(data.AdminRbacMatrix) as Record<string, string[]>;
          setRbacMatrix(parsed);
        } catch { }
      }
      if (data.AdminCustomRoles) {
        try { setCustomRoles(JSON.parse(data.AdminCustomRoles) as string[]); } catch { }
      }
    }).finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  function togglePerm(module: string, role: string) {
    if (role === "SuperAdmin") return;
    setRbacMatrix(prev => {
      const roles = prev[module] ?? [];
      const next = roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role];
      return { ...prev, [module]: next };
    });
  }

  function resetRbacMatrix() {
    setRbacMatrix(defaultMatrix);
  }

  function loadLicenses() {
    setLicensesLoading(true);
    api.get<LicenseDto[]>("/api/admin/licenses")
      .then(setLicenses)
      .catch(() => {})
      .finally(() => setLicensesLoading(false));
  }

  useEffect(() => {
    if (tab === "lisans") loadLicenses();
  }, [tab]);

  useEffect(() => {
    if (tab !== "sistem") return;
    const fetchServices = () => {
      setServicesLoading(true);
      api.get<ServiceState[]>("/api/admin/services")
        .then(setServices)
        .catch(() => {})
        .finally(() => setServicesLoading(false));
    };
    fetchServices();
    const id = setInterval(fetchServices, 10_000);
    return () => clearInterval(id);
  }, [tab]);

  useEffect(() => {
    if (tab !== "sistem") return;
    setDevKeyLoading(true);
    api.get<{ isConfigured: boolean; maskedKey: string | null; revealPasswordSet: boolean }>("/api/admin/dev-key")
      .then(setDevKeyStatus)
      .catch(() => {})
      .finally(() => setDevKeyLoading(false));
  }, [tab]);

  async function handleRevealKey() {
    if (!revealPassword.trim()) { setRevealError("Şifre boş olamaz."); return; }
    setRevealLoading(true); setRevealError("");
    try {
      const res = await api.post<{ key: string }>("/api/admin/dev-key/reveal", { password: revealPassword });
      setRevealedKey(res.key);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setRevealError(msg ?? "Geçersiz şifre.");
    } finally {
      setRevealLoading(false);
    }
  }

  function openRevealModal() {
    setRevealPassword(""); setRevealedKey(null); setRevealError(""); setKeyCopied(false);
    setRevealModal(true);
  }

  function closeRevealModal() {
    setRevealModal(false);
    setRevealPassword(""); setRevealedKey(null); setRevealError(""); setKeyCopied(false);
  }

  function openLicenseAdd() {
    setLicenseForm({ module: "", description: "", expiresAt: "", isActive: true, notes: "" });
    setLicenseError("");
    setLicenseModal({ open: true });
  }

  function openLicenseEdit(lic: LicenseDto) {
    setLicenseForm({
      module: lic.module,
      description: lic.description ?? "",
      expiresAt: lic.expiresAt.substring(0, 10),
      isActive: lic.isActive,
      notes: lic.notes ?? "",
    });
    setLicenseError("");
    setLicenseModal({ open: true, license: lic });
  }

  async function saveLicense() {
    if (!licenseForm.module.trim()) { setLicenseError("Modül adı zorunludur."); return; }
    if (!licenseForm.expiresAt) { setLicenseError("Bitiş tarihi zorunludur."); return; }
    setLicenseSaving(true);
    setLicenseError("");
    try {
      const body = {
        module: licenseForm.module.trim(),
        description: licenseForm.description || null,
        expiresAt: new Date(licenseForm.expiresAt).toISOString(),
        isActive: licenseForm.isActive,
        notes: licenseForm.notes || null,
      };
      if (licenseModal.license) {
        await api.put(`/api/admin/licenses/${licenseModal.license.id}`, body);
      } else {
        await api.post("/api/admin/licenses", body);
      }
      setLicenseModal({ open: false });
      loadLicenses();
    } catch (e: unknown) {
      setLicenseError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setLicenseSaving(false);
    }
  }

  async function deleteLicense(id: string) {
    if (!confirm("Bu lisansı silmek istediğinizden emin misiniz?")) return;
    try {
      await api.delete(`/api/admin/licenses/${id}`);
      loadLicenses();
    } catch { }
  }

  function openRenewModal(lic: LicenseDto) {
    setRenewMonths(12);
    setRenewError("");
    setRenewModal({ open: true, license: lic });
  }

  async function submitRenew() {
    if (!renewModal.license) return;
    setRenewing(true);
    setRenewError("");
    try {
      await api.post(`/api/admin/licenses/${renewModal.license.id}/renew`, { months: renewMonths });
      setRenewModal({ open: false });
      loadLicenses();
    } catch (e: unknown) {
      setRenewError(e instanceof Error ? e.message : "Yenileme başarısız.");
    } finally {
      setRenewing(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await api.put("/api/admin/settings", {
        ...settings,
        AdminMenuOrder: JSON.stringify(menuOrder),
        AdminMenuConfig: JSON.stringify(menuGroupConfig),
        AdminRbacMatrix: JSON.stringify(rbacMatrix),
        AdminCustomRoles: JSON.stringify(customRoles),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      window.dispatchEvent(new CustomEvent("ecom:settings-updated", { detail: settings }));
    } finally { setSaving(false); }
  }

  async function uploadFor(file: File, settingKey: string) {
    setUploadingKey(settingKey);
    try {
      const data = await api.upload(file);
      if (data.url) set(settingKey, data.url);
    } finally { setUploadingKey(null); }
  }

  async function sendTestEmail() {
    if (!testEmail.trim()) return;
    setTestEmailSending(true);
    setTestEmailResult(null);
    try {
      await api.post("/api/admin/email/test", { toEmail: testEmail });
      setTestEmailResult({ ok: true, msg: `Test e-postası ${testEmail} adresine gönderildi.` });
    } catch {
      setTestEmailResult({ ok: false, msg: "Gönderilemedi. SMTP ayarlarını kontrol edin." });
    } finally {
      setTestEmailSending(false);
    }
  }

  async function pauseService(name: string) {
    setServiceAction(`${name}_pause`);
    try { await api.post(`/api/admin/services/${encodeURIComponent(name)}/pause`, {}); }
    catch { } finally { setServiceAction(null); }
  }

  async function resumeService(name: string) {
    setServiceAction(`${name}_resume`);
    try { await api.post(`/api/admin/services/${encodeURIComponent(name)}/resume`, {}); }
    catch { } finally { setServiceAction(null); }
  }

  async function triggerService(name: string) {
    setServiceAction(`${name}_trigger`);
    try { await api.post(`/api/admin/services/${encodeURIComponent(name)}/trigger`, {}); }
    catch { } finally { setServiceAction(null); }
  }

  function activateEnv(env: "dev" | "staging" | "prod") {
    set("AppEnvironment", env === "dev" ? "development" : env === "staging" ? "staging" : "production");
    set("ApiBaseUrl", settings[`ApiBaseUrl_${env}`] || settings.ApiBaseUrl);
    set("CustomerBaseUrl", settings[`CustomerBaseUrl_${env}`] || settings.CustomerBaseUrl);
    set("AdminBaseUrl", settings[`AdminBaseUrl_${env}`] || settings.AdminBaseUrl);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {saved && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-lg">
          <CheckCircle size={16} /> Kaydedildi
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yönetim</h1>
          <p className="text-sm text-slate-500 mt-0.5">Site, panel ve içerik ayarları</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Kaydet
        </button>
      </div>

      {/* Ana sekmeler — yatay kaydırılabilir */}
      <div className="flex items-center gap-1">
        <button onClick={() => tabsRef.current?.scrollBy({ left: -120, behavior: "smooth" })}
          className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
          <ChevronLeft size={15} />
        </button>
        <div ref={tabsRef} className="overflow-x-auto pb-0.5 flex-1 scroll-smooth" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 min-w-max">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap shrink-0 ${
                  tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => tabsRef.current?.scrollBy({ left: 120, behavior: "smooth" })}
          className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
          <ChevronRight size={15} />
        </button>
      </div>

      {/* ── Genel ── */}
      {tab === "genel" && (
        <div className="space-y-5">
          <Section title="Site Bilgileri" icon={<Globe size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Site Adı" hint="Müşteri sitesi tarayıcı sekmesi, başlık ve tüm sayfalarda görünür">
                <input value={settings.SiteName} onChange={e => set("SiteName", e.target.value)} className={inp} placeholder="Örn: Keyvora Store" />
              </Field>
              <Field label="Admin Panel Başlığı" hint="Admin paneli sol üst köşesi ve tarayıcı sekmesinde görünür">
                <input value={settings.AdminTitle} onChange={e => set("AdminTitle", e.target.value)} className={inp} placeholder="Örn: Keyvora" />
              </Field>
              <Field label="Para Birimi">
                <select value={settings.Currency} onChange={e => set("Currency", e.target.value)} className={inp}>
                  <option value="TRY">TRY — Türk Lirası</option>
                  <option value="USD">USD — Amerikan Doları</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — İngiliz Sterlini</option>
                </select>
              </Field>
              <Field label="KDV Oranı (%)" hint="Varsayılan vergi oranı">
                <input type="number" value={settings.DefaultTaxRate} onChange={e => set("DefaultTaxRate", e.target.value)} className={inp} min="0" max="100" />
              </Field>
            </div>
          </Section>
          <Section title="İletişim Bilgileri" icon={<Settings size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="İletişim E-postası">
                <input type="email" value={settings.ContactEmail} onChange={e => set("ContactEmail", e.target.value)} className={inp} placeholder="info@keyvora.com" />
              </Field>
              <Field label="İletişim Telefonu">
                <input value={settings.ContactPhone} onChange={e => set("ContactPhone", e.target.value)} className={inp} placeholder="+90 532 000 00 00" />
              </Field>
            </div>
          </Section>
          <Section title="Sosyal Medya" icon={<Share2 size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "Instagram", key: "SocialInstagram", ph: "https://instagram.com/keyvora" },
                { label: "Twitter / X", key: "SocialTwitter", ph: "https://twitter.com/keyvora" },
                { label: "Facebook", key: "SocialFacebook", ph: "https://facebook.com/keyvora" },
                { label: "YouTube", key: "SocialYoutube", ph: "https://youtube.com/@keyvora" },
                { label: "LinkedIn", key: "SocialLinkedin", ph: "https://linkedin.com/company/keyvora" },
              ].map(({ label, key, ph }) => (
                <Field key={key} label={label}>
                  <div className="relative">
                    <Share2 size={13} className="absolute left-3 top-3 text-slate-400" />
                    <input value={settings[key] ?? ""} onChange={e => set(key, e.target.value)} className={inp + " pl-8"} placeholder={ph} />
                  </div>
                </Field>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── Görünüm ── */}
      {tab === "gorunum" && (
        <div className="space-y-5">
          {/* Admin Panel Görselleri */}
          <Section title="Admin Panel Görselleri" icon={<ImageIcon size={16} />}
            subtitle="Admin panelinin sidebar'ında ve tarayıcı sekmesinde görünen görseller.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* İsimli Logo */}
              {(() => {
                const key = "AdminLogoNamed";
                const busy = uploadingKey === key;
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">İsimli Logo</p>
                    <p className="text-[11px] text-slate-400">Marka adı içeren tam logo (sidebar genişken).</p>
                    <div className="h-16 rounded-xl bg-[#1c2044] border border-slate-200 flex items-center justify-center overflow-hidden px-2">
                      {settings[key]
                        ? <img src={settings[key]} alt="İsimli Logo" className="max-h-full max-w-full object-contain" /> // eslint-disable-line
                        : <span className="text-slate-500 text-xs">Yüklenmedi</span>}
                    </div>
                    <input ref={adminLogoNamedRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadFor(e.target.files[0], key)} />
                    <button onClick={() => adminLogoNamedRef.current?.click()} disabled={busy}
                      className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition w-full justify-center">
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {busy ? "Yükleniyor..." : "Yükle"}
                    </button>
                    {settings[key] && (
                      <input value={settings[key]} onChange={e => set(key, e.target.value)}
                        className="text-[10px] text-slate-400 border border-slate-200 rounded-lg px-2 py-1 w-full font-mono focus:outline-none" />
                    )}
                  </div>
                );
              })()}
              {/* İsimsiz Logo */}
              {(() => {
                const key = "AdminLogoIcon";
                const busy = uploadingKey === key;
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">İsimsiz Logo</p>
                    <p className="text-[11px] text-slate-400">Sadece ikon (sidebar daraltılmışken).</p>
                    <div className="h-16 rounded-xl bg-[#1c2044] border border-slate-200 flex items-center justify-center overflow-hidden">
                      {settings[key]
                        ? <img src={settings[key]} alt="İsimsiz Logo" className="w-10 h-10 object-contain" /> // eslint-disable-line
                        : <span className="text-slate-500 text-xs">Yüklenmedi</span>}
                    </div>
                    <input ref={adminLogoIconRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadFor(e.target.files[0], key)} />
                    <button onClick={() => adminLogoIconRef.current?.click()} disabled={busy}
                      className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition w-full justify-center">
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {busy ? "Yükleniyor..." : "Yükle"}
                    </button>
                    {settings[key] && (
                      <input value={settings[key]} onChange={e => set(key, e.target.value)}
                        className="text-[10px] text-slate-400 border border-slate-200 rounded-lg px-2 py-1 w-full font-mono focus:outline-none" />
                    )}
                  </div>
                );
              })()}
              {/* Admin Favicon */}
              {(() => {
                const key = "AdminFaviconUrl";
                const busy = uploadingKey === key;
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">Favicon</p>
                    <p className="text-[11px] text-slate-400">Admin paneli tarayıcı sekmesi ikonu.</p>
                    <div className="h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                      {settings[key]
                        ? <img src={settings[key]} alt="Favicon" className="w-10 h-10 object-contain" /> // eslint-disable-line
                        : <Globe size={20} className="text-slate-300" />}
                    </div>
                    <input ref={adminFaviconRef} type="file" accept="image/*,.ico" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadFor(e.target.files[0], key)} />
                    <button onClick={() => adminFaviconRef.current?.click()} disabled={busy}
                      className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition w-full justify-center">
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {busy ? "Yükleniyor..." : "Yükle"}
                    </button>
                    {settings[key] && (
                      <input value={settings[key]} onChange={e => set(key, e.target.value)}
                        className="text-[10px] text-slate-400 border border-slate-200 rounded-lg px-2 py-1 w-full font-mono focus:outline-none" />
                    )}
                  </div>
                );
              })()}
            </div>
          </Section>

          {/* Müşteri Sitesi Görselleri */}
          <Section title="Müşteri Sitesi Görselleri" icon={<ImageIcon size={16} />}
            subtitle="Müşteri mağazasının header'ında ve tarayıcı sekmesinde görünen görseller.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* İsimli Logo */}
              {(() => {
                const key = "CustomerLogoNamed";
                const busy = uploadingKey === key;
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">İsimli Logo</p>
                    <p className="text-[11px] text-slate-400">Marka adı dahil tam logo (header'da öncelikli).</p>
                    <div className="h-16 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden px-2">
                      {settings[key]
                        ? <img src={settings[key]} alt="İsimli Logo" className="max-h-full max-w-full object-contain" /> // eslint-disable-line
                        : <span className="text-slate-400 text-xs">Yüklenmedi</span>}
                    </div>
                    <input ref={customerLogoNamedRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadFor(e.target.files[0], key)} />
                    <button onClick={() => customerLogoNamedRef.current?.click()} disabled={busy}
                      className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition w-full justify-center">
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {busy ? "Yükleniyor..." : "Yükle"}
                    </button>
                    {settings[key] && (
                      <input value={settings[key]} onChange={e => set(key, e.target.value)}
                        className="text-[10px] text-slate-400 border border-slate-200 rounded-lg px-2 py-1 w-full font-mono focus:outline-none" />
                    )}
                  </div>
                );
              })()}
              {/* İsimsiz Logo */}
              {(() => {
                const key = "CustomerLogoIcon";
                const busy = uploadingKey === key;
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">İsimsiz Logo</p>
                    <p className="text-[11px] text-slate-400">Sadece marka ikonu / sembolü.</p>
                    <div className="h-16 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                      {settings[key]
                        ? <img src={settings[key]} alt="İsimsiz Logo" className="max-h-full max-w-full object-contain p-1" /> // eslint-disable-line
                        : <span className="text-slate-400 text-xs">Yüklenmedi</span>}
                    </div>
                    <input ref={customerLogoIconRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadFor(e.target.files[0], key)} />
                    <button onClick={() => customerLogoIconRef.current?.click()} disabled={busy}
                      className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition w-full justify-center">
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {busy ? "Yükleniyor..." : "Yükle"}
                    </button>
                    {settings[key] && (
                      <input value={settings[key]} onChange={e => set(key, e.target.value)}
                        className="text-[10px] text-slate-400 border border-slate-200 rounded-lg px-2 py-1 w-full font-mono focus:outline-none" />
                    )}
                  </div>
                );
              })()}
              {/* Customer Favicon */}
              {(() => {
                const key = "CustomerFaviconUrl";
                const busy = uploadingKey === key;
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">Favicon</p>
                    <p className="text-[11px] text-slate-400">Müşteri sitesi tarayıcı sekmesi ikonu.</p>
                    <div className="h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                      {settings[key]
                        ? <img src={settings[key]} alt="Favicon" className="w-10 h-10 object-contain" /> // eslint-disable-line
                        : <Globe size={20} className="text-slate-300" />}
                    </div>
                    <input ref={customerFaviconRef} type="file" accept="image/*,.ico" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadFor(e.target.files[0], key)} />
                    <button onClick={() => customerFaviconRef.current?.click()} disabled={busy}
                      className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition w-full justify-center">
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {busy ? "Yükleniyor..." : "Yükle"}
                    </button>
                    {settings[key] && (
                      <input value={settings[key]} onChange={e => set(key, e.target.value)}
                        className="text-[10px] text-slate-400 border border-slate-200 rounded-lg px-2 py-1 w-full font-mono focus:outline-none" />
                    )}
                  </div>
                );
              })()}
            </div>
          </Section>
          <Section title="Tema Ön Ayarları" icon={<Palette size={16} />}>
            <p className="text-xs text-slate-500 mb-3">Hazır tema paketlerinden birini seçerek tüm renkleri tek seferde uygulayın.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {THEME_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => { Object.entries(preset.values).forEach(([k, v]) => set(k, v)); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50 transition group"
                >
                  <div className="flex gap-1">
                    <span className="w-5 h-5 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: preset.values.PrimaryColor }} />
                    <span className="w-5 h-5 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: preset.values.AccentColor }} />
                    <span className="w-5 h-5 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: preset.values.AdminSidebarColor }} />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 group-hover:text-teal-700 text-center leading-tight">{preset.name}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Müşteri Sitesi Renkleri" icon={<Palette size={16} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Birincil Renk (Butonlar, linkler)", key: "PrimaryColor", default: "#0d9488" },
                { label: "Vurgu Rengi (Rozetler, öne çıkan)", key: "AccentColor", default: "#7c3aed" },
                { label: "Arka Plan Rengi", key: "CustomerBgColor", default: "#F7FAFA" },
                { label: "Yazı Rengi", key: "CustomerTextColor", default: "#1c2044" },
                { label: "Kart / İçerik Arka Planı", key: "CustomerCardBgColor", default: "#ffffff" },
                { label: "Header Arka Planı", key: "CustomerHeaderBgColor", default: "#ffffff" },
                { label: "Kenarlık / Border Rengi", key: "CustomerBorderColor", default: "#ccfbf1" },
                { label: "Buton Yazı Rengi", key: "CustomerButtonTextColor", default: "#ffffff" },
              ].map(({ label, key, default: def }) => (
                <div key={key} className="space-y-1.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <input type="color" value={settings[key] || def} onChange={e => set(key, e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 leading-tight">{label}</p>
                      <input type="text" value={settings[key] || def} onChange={e => set(key, e.target.value)}
                        className="mt-0.5 w-full text-[11px] border border-slate-200 rounded-md px-2 py-0.5 font-mono bg-white focus:outline-none focus:ring-1 focus:ring-teal-400" />
                    </div>
                  </div>
                  {COLOR_SWATCHES[key] && (
                    <div className="flex gap-1 flex-wrap">
                      {COLOR_SWATCHES[key].map(c => (
                        <button key={c} title={c} onClick={() => set(key, c)}
                          className={`w-4 h-4 rounded-full border-2 transition-all hover:scale-125 ${(settings[key] || def) === c ? "border-slate-700 scale-110" : "border-white shadow-sm hover:border-slate-400"}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Admin Panel Renkleri" icon={<Palette size={16} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Sidebar Rengi", key: "AdminSidebarColor", default: "#1c2044" },
                { label: "Birincil Renk", key: "AdminPrimaryColor", default: "#0d9488" },
                { label: "Vurgu Rengi", key: "AdminAccentColor", default: "#7c3aed" },
                { label: "İçerik Arka Planı", key: "AdminBgColor", default: "#f8fafc" },
              ].map(({ label, key, default: def }) => (
                <div key={key} className="space-y-1.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <input type="color" value={settings[key] || def} onChange={e => set(key, e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 leading-tight">{label}</p>
                      <input type="text" value={settings[key] || def} onChange={e => set(key, e.target.value)}
                        className="mt-0.5 w-full text-[11px] border border-slate-200 rounded-md px-2 py-0.5 font-mono bg-white focus:outline-none focus:ring-1 focus:ring-teal-400" />
                    </div>
                  </div>
                  {COLOR_SWATCHES[key] && (
                    <div className="flex gap-1 flex-wrap">
                      {COLOR_SWATCHES[key].map(c => (
                        <button key={c} title={c} onClick={() => set(key, c)}
                          className={`w-4 h-4 rounded-full border-2 transition-all hover:scale-125 ${(settings[key] || def) === c ? "border-slate-700 scale-110" : "border-white shadow-sm hover:border-slate-400"}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Yazı Tipi & Boyutu" icon={<Palette size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer font */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> Müşteri Sitesi
                </p>
                <Field label="Yazı Tipi">
                  <select value={settings.CustomerFontFamily || "Inter"} onChange={e => set("CustomerFontFamily", e.target.value)} className={inp}>
                    {["— Sans-serif —", ...FONT_OPTIONS.filter(f => f.category === "Sans-serif").map(f => f.value)].map(f =>
                      f.startsWith("—") ? <option key={f} disabled>{f}</option> : <option key={f} value={f}>{f}</option>
                    )}
                    <option disabled>— Serif —</option>
                    {FONT_OPTIONS.filter(f => f.category === "Serif").map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    <option disabled>— Monospace —</option>
                    {FONT_OPTIONS.filter(f => f.category === "Monospace").map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </Field>
                <Field label="Yazı Boyutu">
                  <select value={settings.CustomerFontSize || "base"} onChange={e => set("CustomerFontSize", e.target.value)} className={inp}>
                    <option value="sm">Küçük (sm) — 14px temel</option>
                    <option value="base">Normal (base) — 16px temel</option>
                    <option value="lg">Büyük (lg) — 18px temel</option>
                    <option value="xl">Çok Büyük (xl) — 20px temel</option>
                  </select>
                </Field>
                {/* Preview */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Önizleme</p>
                  <div style={{ fontFamily: `"${settings.CustomerFontFamily || "Inter"}", sans-serif` }}>
                    <p className="text-lg font-bold mb-1" style={{ color: settings.PrimaryColor || "#0d9488" }}>Başlık Metni</p>
                    <p className="text-sm text-slate-600">Normal paragraf metni. Ürün açıklamaları ve sayfa içerikleri bu fontla görünür.</p>
                    <p className="text-xs mt-2" style={{ color: settings.AccentColor || "#7c3aed" }}>Vurgu metni ve rozetler</p>
                  </div>
                </div>
              </div>
              {/* Admin font */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> Admin Panel
                </p>
                <Field label="Yazı Tipi">
                  <select value={settings.AdminFontFamily || "Inter"} onChange={e => set("AdminFontFamily", e.target.value)} className={inp}>
                    {FONT_OPTIONS.filter(f => f.category === "Sans-serif").map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    <option disabled>— Serif —</option>
                    {FONT_OPTIONS.filter(f => f.category === "Serif").map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    <option disabled>— Monospace —</option>
                    {FONT_OPTIONS.filter(f => f.category === "Monospace").map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </Field>
                <Field label="Yazı Boyutu">
                  <select value={settings.AdminFontSize || "base"} onChange={e => set("AdminFontSize", e.target.value)} className={inp}>
                    <option value="sm">Küçük (sm) — 14px temel</option>
                    <option value="base">Normal (base) — 16px temel</option>
                    <option value="lg">Büyük (lg) — 18px temel</option>
                    <option value="xl">Çok Büyük (xl) — 20px temel</option>
                  </select>
                </Field>
                {/* Preview */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Önizleme</p>
                  <div style={{ fontFamily: `"${settings.AdminFontFamily || "Inter"}", sans-serif` }}>
                    <p className="text-lg font-bold mb-1" style={{ color: settings.AdminPrimaryColor || "#0d9488" }}>Panel Başlığı</p>
                    <p className="text-sm text-slate-600">Dashboard ve yönetim ekranlarında bu font kullanılır.</p>
                    <p className="text-xs mt-2 font-mono" style={{ color: settings.AdminAccentColor || "#7c3aed" }}>BADGE · ETİKET · UYARI</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              Font ve renk değişiklikleri kaydedildikten sonra sayfa yenilenince tam olarak uygulanır.
            </div>
          </Section>
        </div>
      )}

      {/* ── Şablon ── */}
      {tab === "sablon" && (
        <div className="space-y-5">
          <Section title="Müşteri Sitesi Şablonu" icon={<Layers size={16} />}>
            <p className="text-xs text-slate-500 mb-5">
              Şablon, müşteri sitesinin genel yerleşimini, başlık stilini, köşe yuvarlaklığını ve arka plan renklerini belirler.
              Görünüm sekmesindeki renk ve font özelleştirmeleri seçtiğiniz şablonun üzerine uygulanır.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATES.map(tmpl => {
                const isActive = (settings.CustomerTemplate || "modern") === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => set("CustomerTemplate", tmpl.id)}
                    className={`relative text-left rounded-2xl border-2 transition-all overflow-hidden group ${
                      isActive
                        ? "border-teal-500 ring-2 ring-teal-200 shadow-lg shadow-teal-100/50"
                        : "border-slate-200 hover:border-teal-300 hover:shadow-md"
                    }`}
                  >
                    {/* SVG Mockup */}
                    <div className="relative w-full bg-slate-100" style={{ paddingBottom: "62%" }}>
                      <div className="absolute inset-0">
                        <TemplatePreview tmpl={tmpl} />
                      </div>
                      {isActive && (
                        <div className="absolute top-2 right-2 bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          ✓ Aktif
                        </div>
                      )}
                    </div>

                    {/* Card info */}
                    <div className={`p-3.5 border-t ${isActive ? "border-teal-100 bg-teal-50/50" : "border-slate-100 group-hover:border-teal-100 bg-white group-hover:bg-teal-50"}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg leading-none">{tmpl.emoji}</span>
                        <span className="font-bold text-sm text-slate-800">{tmpl.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{tmpl.description}</p>
                      <div className="flex gap-1 flex-wrap">
                        {tmpl.tags.map(tag => (
                          <span key={tag} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            isActive ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-600"
                          }`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
              <p className="text-xs text-amber-800">
                <strong>Not:</strong> Şablon değişikliği kaydedildikten sonra müşteri sitesinin yenilenmesi gerekebilir (Next.js cache).
                Koyu tema şablonunda bazı bileşenler henüz tam uyumlu olmayabilir — zamanla iyileştirilecektir.
              </p>
            </div>
          </Section>

          {/* Canlı Önizleme */}
          <Section title="Şablon Karşılaştırması" icon={<Eye size={16} />}>
            <p className="text-xs text-slate-500 mb-4">Her şablonun görsel farklılıkları aşağıda özetlenmiştir.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-2 font-semibold text-slate-600 border border-slate-200">Şablon</th>
                    <th className="text-left p-2 font-semibold text-slate-600 border border-slate-200">Kart Tipi</th>
                    <th className="text-left p-2 font-semibold text-slate-600 border border-slate-200">Izgara</th>
                    <th className="text-left p-2 font-semibold text-slate-600 border border-slate-200">Başlık</th>
                    <th className="text-left p-2 font-semibold text-slate-600 border border-slate-200">Uygun Kullanım</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "✨ Modern",         card: "Yuvarlak + gölge",      grid: "4 sütun",  header: "Beyaz",             use: "Genel amaçlı" },
                    { name: "◻️ Minimalist",     card: "Sade + ince kenarlık",  grid: "4 sütun",  header: "Beyaz/düz",         use: "Moda, tasarım, Apple" },
                    { name: "💪 Güçlü",          card: "Pill şekil",            grid: "4 sütun",  header: "Renkli (teal)",     use: "Spor, kampanya" },
                    { name: "🌙 Koyu Tema",       card: "Koyu + mavi vurgu",    grid: "4 sütun",  header: "Gece mavisi",       use: "Gaming, müzik, tech" },
                    { name: "🖼️ Vitrin",         card: "Çok uzun görsel",       grid: "2 sütun",  header: "Beyaz",             use: "Lüks, moda, koleksiyon" },
                    { name: "👑 Lüks",           card: "Altın kenarlık",        grid: "3 sütun",  header: "2 satır + ortalı",  use: "Butik, mücevher" },
                    { name: "⚡ Spor",           card: "Sert köşe + turuncu",   grid: "5 sütun",  header: "Tam genişlik/koyu", use: "Spor, outdoor" },
                    { name: "🕰️ Retro",          card: "Kalın kenarlık offset", grid: "2 sütun",  header: "Sarı/sıcak",       use: "Vintage, el yapımı" },
                    { name: "📸 Instagram",      card: "Kare + hover overlay",  grid: "3 sütun",  header: "İnce/beyaz",        use: "Görsel ürünler" },
                    { name: "🧱 Masonry",        card: "Değişken yükseklik",    grid: "CSS col.", header: "Doğal/beyaz",       use: "El yapımı, sanat" },
                    { name: "🏗️ Brutalist",      card: "Siyah çerçeve + offset",grid: "3 sütun",  header: "Siyah çizgili",    use: "Tasarım, mimari" },
                    { name: "🫧 Cam Efekti",     card: "Buzlu cam",             grid: "4 sütun",  header: "Şeffaf blur",       use: "Tech, ajans, lüks" },
                    { name: "🌆 Neon",           card: "Mor ışıltılı çerçeve",  grid: "4 sütun",  header: "Siyah/neon",        use: "Gaming, müzik, gece" },
                    { name: "🎨 Pastel",         card: "Her kart farklı renk",  grid: "4 sütun",  header: "Pembe/yumuşak",    use: "Çocuk, hediye, kozmetik" },
                    { name: "🛒 Katalog",        card: "Sade + Amazon stili",   grid: "5 sütun",  header: "Koyu + sarı arama", use: "Market, toptan" },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="p-2 border border-slate-200 font-semibold text-slate-700">{row.name}</td>
                      <td className="p-2 border border-slate-200 text-slate-600 font-medium">{row.card}</td>
                      <td className="p-2 border border-slate-200 text-slate-600">{row.grid}</td>
                      <td className="p-2 border border-slate-200 text-slate-600">{row.header}</td>
                      <td className="p-2 border border-slate-200 text-slate-500 italic">{row.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}

      {/* ── Kargo ── */}
      {tab === "kargo" && (
        <div className="space-y-4">
          <Section title="Kargo Ayarları" icon={<Truck size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Ücretsiz Kargo Limiti" hint="Bu tutarın üzerindeki siparişlere ücretsiz kargo">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₺</span>
                  <input type="number" value={settings.FreeShippingLimit} onChange={e => set("FreeShippingLimit", e.target.value)} className={inp + " pl-8"} placeholder="500" min="0" />
                </div>
              </Field>
              <Field label="Varsayılan Kargo Ücreti" hint="Limiti geçmeyen siparişlere uygulanır">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₺</span>
                  <input type="number" value={settings.DefaultShippingCost} onChange={e => set("DefaultShippingCost", e.target.value)} className={inp + " pl-8"} placeholder="29.90" min="0" step="0.01" />
                </div>
              </Field>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Özet: </span>
                ₺{settings.FreeShippingLimit || "—"} ve üzeri siparişler ücretsiz, altındakiler ₺{settings.DefaultShippingCost || "—"} kargo ücreti öder.
              </p>
            </div>
          </Section>

          <Section title="Kargo Firmaları" icon={<Truck size={16} />}
            subtitle="Alternatif kargo firmalarını, fiyatları ve takip ayarlarını buradan yönetin. Kargo süreçlerini ve sevkiyat takibini Kargo Takip sayfasından yapabilirsiniz.">
            <CarrierManager />
          </Section>
        </div>
      )}

      {/* ── Menü ── */}
      {tab === "menu" && (
        <Section title="Menü Sıralaması" icon={<Menu size={16} />}
          subtitle="Grupları ve öğeleri sürükle-bırak ya da ok butonlarıyla sıralayın. Grup adını ve ikonunu düzenleyebilir, öğeleri başka gruba taşıyabilirsiniz. Kaydet'e basınca sol menüye yansır.">
          <MenuSorter
            order={menuOrder}
            onOrderChange={setMenuOrder}
            groupConfig={menuGroupConfig}
            onGroupConfigChange={setMenuGroupConfig}
          />
          <div className="mt-3 flex gap-4">
            <button onClick={() => {
              setMenuOrder(ALL_MENU_ITEMS.map(m => m.href));
              setMenuGroupConfig({ groupOrder: DEFAULT_GROUP_ORDER, groupLabels: { ...DEFAULT_GROUP_LABELS }, groupIcons: { ...DEFAULT_GROUP_ICONS }, itemGroups: {} });
            }} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition">
              Tümünü varsayılana sıfırla
            </button>
          </div>
        </Section>
      )}

      {/* ── İçerik ── */}
      {tab === "icerik" && (
        <div className="space-y-4">
          {/* Alt sekmeler */}
          <div className="flex flex-wrap gap-1.5">
            {CONTENT_SUBS.map(s => (
              <button key={s.id} onClick={() => setContentSub(s.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  contentSub === s.id
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* SSS */}
          {contentSub === "sss" && (
            <Section title="Sık Sorulan Sorular" icon={<HelpCircle size={16} />}
              subtitle="Müşteri sitesinde /sss sayfasında görünür. Soru ve cevapları düzenleyebilirsiniz.">
              <FaqEditor value={settings.Page_SSS} onChange={v => set("Page_SSS", v)} />
            </Section>
          )}

          {/* İade & Değişim */}
          {contentSub === "iade" && (
            <Section title="İade & Değişim" icon={<RefreshCw size={16} />}
              subtitle="/iade-degisim sayfasında görünür. Paragraflar arasında boş satır bırakın.">
              <TextEditor label="Sayfa İçeriği" settingKey="Page_IadeVeDegisim"
                value={settings.Page_IadeVeDegisim} onChange={set} rows={16}
                hint="Paragrafları boş satırla ayırın. İpucu: başlık satırı için satır başına # koyabilirsiniz." />
            </Section>
          )}

          {/* Kargo Takibi */}
          {contentSub === "kargo" && (
            <Section title="Kargo Takibi" icon={<Truck size={16} />}
              subtitle="/kargo-takibi sayfasında görünür.">
              <TextEditor label="Sayfa İçeriği" settingKey="Page_KargoTakibi"
                value={settings.Page_KargoTakibi} onChange={set} rows={14} />
            </Section>
          )}

          {/* İletişim */}
          {contentSub === "iletisim" && (
            <Section title="İletişim Sayfası" icon={<Phone size={16} />}
              subtitle="/iletisim sayfasında görünür. Genel e-posta ve telefon Genel sekmesinden alınır.">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="E-posta" hint="Genel sekmedeki ContactEmail kullanılır">
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input value={settings.ContactEmail} onChange={e => set("ContactEmail", e.target.value)} className={inp + " pl-9"} placeholder="destek@keyvora.com" />
                    </div>
                  </Field>
                  <Field label="Telefon">
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input value={settings.ContactPhone} onChange={e => set("ContactPhone", e.target.value)} className={inp + " pl-9"} placeholder="0850 000 00 00" />
                    </div>
                  </Field>
                </div>
                <Field label="Çalışma Saatleri">
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input value={settings.Page_Iletisim_Hours} onChange={e => set("Page_Iletisim_Hours", e.target.value)}
                      className={inp + " pl-9"} placeholder="Hafta içi 09:00 – 18:00, Cumartesi 10:00 – 16:00" />
                  </div>
                </Field>
                <Field label="Adres">
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                    <textarea value={settings.Page_Iletisim_Address} onChange={e => set("Page_Iletisim_Address", e.target.value)}
                      rows={3} className={inp + " pl-9 resize-none"} placeholder="Şirket adresi..." />
                  </div>
                </Field>
                <Field label="Google Maps Embed URL" hint="Google Maps'ten 'Haritayı Göm' > iframe src değeri">
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input value={settings.Page_Iletisim_MapUrl} onChange={e => set("Page_Iletisim_MapUrl", e.target.value)}
                      className={inp + " pl-9"} placeholder="https://maps.google.com/maps?..." />
                  </div>
                </Field>
              </div>
            </Section>
          )}

          {/* Hakkımızda */}
          {contentSub === "hakkimizda" && (
            <Section title="Hakkımızda" icon={<FileText size={16} />}
              subtitle="/hakkimizda sayfasında görünür.">
              <TextEditor label="Sayfa İçeriği" settingKey="Page_Hakkimizda"
                value={settings.Page_Hakkimizda} onChange={set} rows={16} />
            </Section>
          )}

          {/* KVKK */}
          {contentSub === "kvkk" && (
            <Section title="KVKK Metni" icon={<FileText size={16} />}
              subtitle="/kvkk sayfasında görünür. Hukuki metni buraya yapıştırabilirsiniz.">
              <TextEditor label="KVKK İçeriği" settingKey="Page_KVKK"
                value={settings.Page_KVKK} onChange={set} rows={20} />
            </Section>
          )}

          {/* Gizlilik */}
          {contentSub === "gizlilik" && (
            <Section title="Gizlilik Politikası" icon={<FileText size={16} />}
              subtitle="/gizlilik sayfasında görünür.">
              <TextEditor label="Gizlilik Politikası İçeriği" settingKey="Page_Gizlilik"
                value={settings.Page_Gizlilik} onChange={set} rows={20} />
            </Section>
          )}

          {/* Footer */}
          {contentSub === "footer" && (
            <Section title="Footer Bilgileri" icon={<Globe size={16} />}
              subtitle="Müşteri sitesinin alt bölümünde görünen bilgiler.">
              <div className="space-y-4">
                <Field label="Marka Sloganı" hint="Logo altında görünen kısa açıklama. Yeni satır için Enter kullanın.">
                  <textarea value={settings.Footer_Tagline} onChange={e => set("Footer_Tagline", e.target.value)}
                    rows={3} className={inp + " resize-none"} placeholder="Keyifli alışverişin yeni adresi." />
                </Field>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  Sosyal medya bağlantıları için <button className="text-teal-600 underline" onClick={() => setTab("genel")}>Genel sekmesine</button> gidin.
                  İletişim bilgileri (e-posta & telefon) <button className="text-teal-600 underline" onClick={() => setContentSub("iletisim")}>İletişim bölümünden</button> yönetilir.
                </div>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ── Chatbot ── */}
      {tab === "chatbot" && (
        <div className="space-y-5">
          <Section title="Chatbot & Destek" icon={<MessageCircle size={16} />}
            subtitle="WhatsApp veya Telegram üzerinden müşteri desteği sağlayın. n8n entegrasyonu ile akıllı bot yanıtları ekleyebilirsiniz.">
            <div className="space-y-5">
              {/* Enable/disable */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Chatbot Widget</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {settings.ChatbotEnabled === "true"
                      ? "Widget aktif — müşteri sitesinde sohbet butonu görünür."
                      : "Widget pasif — müşteri sitesinde hiç görünmez."}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const next = settings.ChatbotEnabled === "true" ? "false" : "true";
                    set("ChatbotEnabled", next);
                    await api.put("/api/admin/settings", { ...settings, ChatbotEnabled: next });
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.ChatbotEnabled === "true" ? "bg-teal-500" : "bg-slate-300"}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.ChatbotEnabled === "true" ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {/* Provider */}
              <Field label="Kanal" hint="Hangi kanallar gösterilsin?">
                <select value={settings.ChatbotProvider} onChange={e => set("ChatbotProvider", e.target.value)} className={inp}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="both">Her İkisi</option>
                </select>
              </Field>

              {/* WhatsApp */}
              {(settings.ChatbotProvider === "whatsapp" || settings.ChatbotProvider === "both") && (
                <div className="space-y-3 p-4 border border-green-200 rounded-xl bg-green-50/50">
                  <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                    <MessageCircle size={15} /> WhatsApp
                  </p>
                  <Field label="Numara" hint="Uluslararası format: +905xxxxxxxxx">
                    <input value={settings.WhatsAppNumber} onChange={e => set("WhatsAppNumber", e.target.value)}
                      className={inp} placeholder="+905321234567" />
                  </Field>
                  <Field label="Karşılama Mesajı" hint="Müşteri tıkladığında önceden dolu gelecek mesaj">
                    <input value={settings.WhatsAppWelcomeMessage} onChange={e => set("WhatsAppWelcomeMessage", e.target.value)}
                      className={inp} />
                  </Field>
                </div>
              )}

              {/* Telegram */}
              {(settings.ChatbotProvider === "telegram" || settings.ChatbotProvider === "both") && (
                <div className="space-y-3 p-4 border border-blue-200 rounded-xl bg-blue-50/50">
                  <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                    <MessageCircle size={15} /> Telegram
                  </p>
                  <Field label="Bot Kullanıcı Adı" hint="Örn: @KeyvoraBot">
                    <input value={settings.TelegramBotUsername} onChange={e => set("TelegramBotUsername", e.target.value)}
                      className={inp} placeholder="@KeyvoraBot" />
                  </Field>
                  <Field label="Bot Token" hint="BotFather'dan alınan token. Asla halka açık edilmez.">
                    <input type="password" value={settings.TelegramBotToken} onChange={e => set("TelegramBotToken", e.target.value)}
                      className={inp} placeholder="1234567890:AABBCCDDEEFFaabbccddeeff" />
                  </Field>
                </div>
              )}

              {/* n8n */}
              <div className="space-y-3 p-4 border border-violet-200 rounded-xl bg-violet-50/50">
                <p className="text-sm font-semibold text-violet-700 flex items-center gap-2">
                  <Settings size={15} /> n8n / Antigravity Webhook
                  <span className="text-xs font-normal text-violet-500">(İsteğe bağlı — inline chat için)</span>
                </p>
                <Field label="Webhook URL" hint="n8n Webhook node URL'si. Doldurulursa widget içi mesajlaşma aktif olur.">
                  <input value={settings.N8nWebhookUrl} onChange={e => set("N8nWebhookUrl", e.target.value)}
                    className={inp} placeholder="https://n8n.example.com/webhook/chatbot" />
                </Field>
                <Field label="API Key" hint="Opsiyonel. X-Api-Key header'ında gönderilir.">
                  <input type="password" value={settings.N8nApiKey} onChange={e => set("N8nApiKey", e.target.value)}
                    className={inp} placeholder="sk-..." />
                </Field>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── Ödeme ── */}
      {tab === "odeme" && (
        <div className="space-y-5">
          {/* Banka/Havale */}
          <Section title="Banka Havalesi / EFT" icon={<Building2 size={16} />}
            subtitle="Müşteriler sipariş sonrası IBAN'a havale yaparak ödeme yapabilir.">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Havale ile Ödeme</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {settings.PaymentHavaleEnabled === "true"
                    ? "Aktif — ödeme seçeneklerinde görünür."
                    : "Pasif — ödeme seçeneklerinde gösterilmez."}
                </p>
              </div>
              <button onClick={() => set("PaymentHavaleEnabled", settings.PaymentHavaleEnabled === "true" ? "false" : "true")}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.PaymentHavaleEnabled === "true" ? "bg-teal-500" : "bg-slate-300"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.PaymentHavaleEnabled === "true" ? "left-7" : "left-1"}`} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Banka Adı">
                <input value={settings.PaymentHavaleBankName} onChange={e => set("PaymentHavaleBankName", e.target.value)}
                  className={inp} placeholder="Örn: Ziraat Bankası" />
              </Field>
              <Field label="Hesap Sahibi Adı">
                <input value={settings.PaymentHavaleAccountName} onChange={e => set("PaymentHavaleAccountName", e.target.value)}
                  className={inp} placeholder="Şirket / Ad Soyad" />
              </Field>
              <Field label="IBAN" hint="TR ile başlayan 26 haneli numara">
                <input value={settings.PaymentHavaleIBAN} onChange={e => set("PaymentHavaleIBAN", e.target.value)}
                  className={inp + " font-mono"} placeholder="TR00 0000 0000 0000 0000 0000 00" />
              </Field>
              <Field label="Açıklama" hint="Müşteriye gösterilecek havale açıklaması">
                <input value={settings.PaymentHavaleDescription} onChange={e => set("PaymentHavaleDescription", e.target.value)}
                  className={inp} placeholder="Sipariş numarasını açıklamaya yazınız" />
              </Field>
            </div>
          </Section>

          {/* SanalPos */}
          <Section title="Sanal POS / Kredi Kartı" icon={<CreditCard size={16} />}
            subtitle="Ödeme altyapısı entegrasyonu. API bilgileri güvende saklanır.">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Kredi / Banka Kartı ile Ödeme</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {settings.PaymentSanalPosEnabled === "true" ? "Aktif" : "Pasif"}
                </p>
              </div>
              <button onClick={() => set("PaymentSanalPosEnabled", settings.PaymentSanalPosEnabled === "true" ? "false" : "true")}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.PaymentSanalPosEnabled === "true" ? "bg-teal-500" : "bg-slate-300"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.PaymentSanalPosEnabled === "true" ? "left-7" : "left-1"}`} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Ödeme Sağlayıcı">
                <select value={settings.PaymentSanalPosProvider} onChange={e => set("PaymentSanalPosProvider", e.target.value)} className={inp}>
                  <option value="iyzico">İyzico</option>
                  <option value="paytr">PayTR</option>
                  <option value="param">Param</option>
                  <option value="sipay">Sipay</option>
                  <option value="craftgate">Craftgate</option>
                  <option value="stripe">Stripe</option>
                </select>
              </Field>
              <Field label="Test Modu">
                <div className="flex items-center gap-3 mt-1">
                  <button onClick={() => set("PaymentSanalPosTestMode", settings.PaymentSanalPosTestMode === "true" ? "false" : "true")}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.PaymentSanalPosTestMode === "true" ? "bg-amber-400" : "bg-slate-300"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.PaymentSanalPosTestMode === "true" ? "left-7" : "left-1"}`} />
                  </button>
                  <span className="text-xs text-slate-500">
                    {settings.PaymentSanalPosTestMode === "true" ? "Test modu açık — gerçek para çekilmez" : "Canlı mod — gerçek işlemler yapılır"}
                  </span>
                </div>
              </Field>
              <Field label="Merchant ID / Mağaza ID">
                <input value={settings.PaymentSanalPosMerchantId} onChange={e => set("PaymentSanalPosMerchantId", e.target.value)}
                  className={inp} placeholder="12345678" />
              </Field>
              <Field label="API Key">
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-3 text-slate-400" />
                  <input value={settings.PaymentSanalPosApiKey} onChange={e => set("PaymentSanalPosApiKey", e.target.value)}
                    className={inp + " pl-8"} placeholder="api_key_..." />
                </div>
              </Field>
              <Field label="API Secret / Private Key" hint="Şifreli saklanır.">
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-3 text-slate-400" />
                  <input type="password" value={settings.PaymentSanalPosApiSecret} onChange={e => set("PaymentSanalPosApiSecret", e.target.value)}
                    className={inp + " pl-8"} placeholder="••••••••••••••••" />
                </div>
              </Field>
            </div>
            {settings.PaymentSanalPosTestMode !== "true" && settings.PaymentSanalPosEnabled === "true" && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <CreditCard size={14} /> Canlı mod aktif — gerçek kart bilgileri işlenecek. Entegrasyon testini tamamladığınızdan emin olun.
              </div>
            )}
          </Section>
        </div>
      )}

      {/* ── Mesajlar ── */}
      {tab === "mesajlar" && (
        <div className="space-y-5">
          {[
            {
              title: "Doğrulama Mesajları",
              color: "violet",
              icon: "🔒",
              items: [
                { key: "Msg_RequiredField",  label: "Zorunlu Alan",         hint: "Form alanları boş bırakıldığında" },
                { key: "Msg_InvalidEmail",   label: "Geçersiz E-posta",     hint: "E-posta formatı yanlış olduğunda" },
                { key: "Msg_PasswordMin",    label: "Şifre Çok Kısa",       hint: "Şifre minimum uzunluğu karşılamıyor" },
                { key: "Msg_PasswordMatch",  label: "Şifre Uyuşmuyor",      hint: "Şifre tekrar alanı eşleşmiyor" },
              ],
            },
            {
              title: "Sipariş Mesajları",
              color: "teal",
              icon: "📦",
              items: [
                { key: "Msg_OrderSuccess",   label: "Sipariş Oluşturuldu",  hint: "Başarılı sipariş sonrası gösterilir" },
                { key: "Msg_OrderCancelled", label: "Sipariş İptal Edildi", hint: "İptal işlemi sonrası gösterilir" },
                { key: "Msg_OrderShipped",   label: "Kargoya Verildi",      hint: "Kargo durumu güncellenince" },
              ],
            },
            {
              title: "Sepet Mesajları",
              color: "amber",
              icon: "🛒",
              items: [
                { key: "Msg_CartItemAdded",  label: "Ürün Eklendi",         hint: "Sepete ürün eklenince" },
                { key: "Msg_OutOfStock",     label: "Stok Yetersiz",        hint: "İstenen miktar stokta yok" },
                { key: "Msg_CartEmpty",      label: "Sepet Boş",            hint: "Sepet sayfasında ürün yoksa" },
                { key: "Msg_CouponApplied",  label: "Kupon Uygulandı",      hint: "Geçerli kupon girilince" },
                { key: "Msg_CouponInvalid",  label: "Geçersiz Kupon",       hint: "Hatalı veya süresi dolmuş kupon" },
              ],
            },
            {
              title: "Sistem & Hata Mesajları",
              color: "red",
              icon: "⚠️",
              items: [
                { key: "Msg_GenericError",   label: "Genel Hata",           hint: "Beklenmeyen hatalar için" },
                { key: "Msg_NetworkError",   label: "Bağlantı Hatası",      hint: "İnternet kesilince" },
                { key: "Msg_Unauthorized",   label: "Yetkisiz Erişim",      hint: "Giriş gerektiren sayfalarda" },
                { key: "Msg_MaintenanceMode",label: "Bakım Modu",           hint: "Site bakımda iken" },
                { key: "Msg_LowStockWarning",label: "Düşük Stok",          hint: "Az miktarda ürün kaldığında" },
              ],
            },
            {
              title: "Başarı & Bilgi Mesajları",
              color: "emerald",
              icon: "✅",
              items: [
                { key: "Msg_LoginSuccess",    label: "Giriş Başarılı",       hint: "Kullanıcı girişinden sonra" },
                { key: "Msg_RegisterSuccess", label: "Kayıt Başarılı",       hint: "Yeni üyelik oluşturulunca" },
                { key: "Msg_ProfileUpdated",  label: "Profil Güncellendi",   hint: "Hesap bilgileri değiştirilince" },
                { key: "Msg_PasswordChanged", label: "Şifre Değiştirildi",   hint: "Şifre başarıyla güncellenince" },
                { key: "Msg_FreeShipping",    label: "Ücretsiz Kargo Uyarısı", hint: "{limit} placeholder ile" },
                { key: "Msg_ReviewSuccess",   label: "Yorum Alındı",         hint: "Yorum gönderimi sonrası" },
              ],
            },
          ].map(group => {
            const colorMap: Record<string, string> = {
              violet: "border-violet-200 bg-violet-50",
              teal:   "border-teal-200 bg-teal-50",
              amber:  "border-amber-200 bg-amber-50",
              red:    "border-red-200 bg-red-50",
              emerald:"border-emerald-200 bg-emerald-50",
            };
            const badgeMap: Record<string, string> = {
              violet: "bg-violet-100 text-violet-700",
              teal:   "bg-teal-100 text-teal-700",
              amber:  "bg-amber-100 text-amber-700",
              red:    "bg-red-100 text-red-700",
              emerald:"bg-emerald-100 text-emerald-700",
            };
            const isOpen = openMsgGroups.has(group.title);
            const toggleGroup = () => setOpenMsgGroups(prev => {
              const next = new Set(prev);
              if (next.has(group.title)) next.delete(group.title);
              else next.add(group.title);
              return next;
            });
            return (
              <div key={group.title} className={`rounded-2xl border overflow-hidden ${colorMap[group.color]}`}>
                <button
                  type="button"
                  onClick={toggleGroup}
                  className="w-full flex items-center gap-2 px-5 py-4 text-left hover:opacity-90 transition-opacity"
                >
                  <span className="text-lg">{group.icon}</span>
                  <h3 className="text-sm font-bold text-slate-800">{group.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeMap[group.color]}`}>
                    {group.items.length} mesaj
                  </span>
                  <ChevronDown
                    size={15}
                    className={`ml-auto text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 space-y-3">
                    {group.items.map(({ key, label, hint }) => {
                      const defaultVal = DEFAULTS[key] ?? "";
                      const current = settings[key] ?? defaultVal;
                      const isCustomized = current !== defaultVal && current !== "";
                      return (
                        <div key={key} className="bg-white rounded-xl border border-white/80 p-3 shadow-sm">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs font-semibold text-slate-700">{label}</p>
                            <div className="flex items-center gap-2">
                              {isCustomized && (
                                <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-semibold">Özelleştirildi</span>
                              )}
                              {isCustomized && (
                                <button onClick={() => set(key, defaultVal)}
                                  className="text-[10px] text-slate-400 hover:text-red-500 transition underline">
                                  Sıfırla
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 mb-1.5">{hint}</p>
                          <input
                            value={current}
                            onChange={e => set(key, e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white"
                            placeholder={defaultVal}
                          />
                          {defaultVal && current !== defaultVal && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              <span className="font-semibold">Varsayılan:</span> {defaultVal}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {/* Özel Mesajlar */}
          {Object.keys(settings).filter(k => k.startsWith("Msg_Custom_")).length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <button type="button" onClick={() => setOpenMsgGroups(prev => { const s = new Set(prev); s.has("Özel Mesajlar") ? s.delete("Özel Mesajlar") : s.add("Özel Mesajlar"); return s; })}
                className="w-full flex items-center gap-2 px-5 py-4 text-left hover:bg-slate-50 transition">
                <span className="text-lg">✏️</span>
                <h3 className="text-sm font-bold text-slate-800">Özel Mesajlar</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {Object.keys(settings).filter(k => k.startsWith("Msg_Custom_")).length} mesaj
                </span>
                <ChevronDown size={15} className={`ml-auto text-slate-400 transition-transform duration-200 ${openMsgGroups.has("Özel Mesajlar") ? "rotate-180" : ""}`} />
              </button>
              {openMsgGroups.has("Özel Mesajlar") && (
                <div className="px-5 pb-5 space-y-3">
                  {Object.keys(settings).filter(k => k.startsWith("Msg_Custom_")).map(k => (
                    <div key={k} className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex gap-2 items-start">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-700 mb-1">{k.replace("Msg_Custom_", "")}</p>
                        <input value={settings[k] ?? ""} onChange={e => set(k, e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white" />
                      </div>
                      <button onClick={() => { const s = { ...settings }; delete s[k]; setSettings(s); }}
                        className="text-red-400 hover:text-red-600 mt-5 shrink-0" title="Sil">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Yeni Mesaj Ekle */}
          <div className="rounded-2xl border border-dashed border-slate-300 overflow-hidden">
            <button type="button" onClick={() => setNewMsgOpen(v => !v)}
              className="w-full flex items-center gap-2 px-5 py-3.5 text-left hover:bg-slate-50 transition text-slate-600">
              <Plus size={15} className="text-teal-600" />
              <span className="text-sm font-semibold text-teal-700">Yeni Özel Mesaj Ekle</span>
              <ChevronDown size={13} className={`ml-auto text-slate-400 transition-transform duration-200 ${newMsgOpen ? "rotate-180" : ""}`} />
            </button>
            {newMsgOpen && (
              <div className="px-5 pb-5 bg-teal-50/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Anahtar Adı <span className="text-slate-400">(boşluksuz)</span></label>
                    <input value={newMsgLabel} onChange={e => setNewMsgLabel(e.target.value.replace(/\s+/g, "_"))}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white"
                      placeholder="Ornegin_Mesaj_Adi" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Mesaj Metni</label>
                    <input value={newMsgValue} onChange={e => setNewMsgValue(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white"
                      placeholder="Gösterilecek mesaj..." />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!newMsgLabel.trim() || !newMsgValue.trim()}
                  onClick={() => {
                    const key = `Msg_Custom_${newMsgLabel.trim()}`;
                    set(key, newMsgValue.trim());
                    setNewMsgLabel(""); setNewMsgValue(""); setNewMsgOpen(false);
                    setOpenMsgGroups(prev => new Set([...prev, "Özel Mesajlar"]));
                  }}
                  className="mt-3 bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-teal-700 transition disabled:opacity-40"
                >
                  Ekle
                </button>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
            <p className="font-semibold mb-1">Geliştirici Notu</p>
            <p>Bu mesajlar SiteSettings tablosunda saklanır. Frontend bileşenler <code className="font-mono bg-blue-100 px-1 rounded">GET /api/settings/theme</code> endpoint'inden okuyabilir ya da hardcoded varsayılan değerleri kullanabilir. Kaydet butonuna bastıktan sonra aktif olur.</p>
          </div>
        </div>
      )}

      {/* ── Yetkiler ── */}
      {tab === "yetkiler" && (
        <div className="space-y-5">
          <Section title="Rol Bazlı Erişim Kontrolü" icon={<KeyRound size={16} />}
            subtitle="Her modül için rollerin erişim yetkisini açıp kapatın. Kaydet butonuna basarak değişiklikleri uygulayın.">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Lock size={11} /> Süper Admin her zaman tam yetkilidir — değiştirilemez.
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setNewRoleOpen(v => !v); setNewRoleName(""); }}
                  className="flex items-center gap-1.5 text-xs bg-teal-600 text-white hover:bg-teal-700 rounded-lg px-2.5 py-1 transition">
                  <Plus size={11} /> Yeni Rol
                </button>
                <button type="button" onClick={resetRbacMatrix}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg px-2.5 py-1 transition">
                  <RefreshCw size={11} /> Sıfırla
                </button>
              </div>
            </div>
            {newRoleOpen && (
              <div className="mb-3 p-3 bg-teal-50 border border-teal-200 rounded-xl flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Yeni Rol Adı</label>
                  <input value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                    placeholder="Örn: ContentEditor"
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white" />
                </div>
                <button type="button"
                  disabled={!newRoleName.trim() || customRoles.includes(newRoleName.trim()) || ROLE_COLUMNS.some(r => r.key === newRoleName.trim())}
                  onClick={() => {
                    const role = newRoleName.trim();
                    setCustomRoles(prev => [...prev, role]);
                    setRbacMatrix(prev => {
                      const next = { ...prev };
                      PERMISSION_MATRIX.forEach(m => { next[m.module] = next[m.module] ?? m.roles; });
                      return next;
                    });
                    setNewRoleOpen(false); setNewRoleName("");
                  }}
                  className="bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-teal-700 transition disabled:opacity-40">
                  Ekle
                </button>
                <button type="button" onClick={() => setNewRoleOpen(false)}
                  className="text-slate-400 hover:text-slate-600 px-2 py-1.5"><X size={14} /></button>
              </div>
            )}
            {customRoles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {customRoles.map(r => (
                  <span key={r} className="flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-semibold">
                    {r}
                    <button onClick={() => setCustomRoles(prev => prev.filter(x => x !== r))} className="text-teal-400 hover:text-red-500 transition ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-2.5 px-4 text-slate-500 font-semibold whitespace-nowrap w-36">Modül</th>
                    {[...ROLE_COLUMNS, ...customRoles.map(r => ({ key: r, label: r }))].map(r => (
                      <th key={r.key} className={`text-center py-2.5 px-2 font-semibold whitespace-nowrap ${
                        r.key === "SuperAdmin" ? "text-violet-400" : "text-slate-500"
                      }`}>
                        {r.key === "SuperAdmin"
                          ? <span className="flex flex-col items-center gap-0.5">{r.label}<Lock size={9} className="text-violet-300" /></span>
                          : r.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const allCols = [...ROLE_COLUMNS, ...customRoles.map(r => ({ key: r, label: r }))];
                    const rows: React.ReactNode[] = [];
                    let lastGroup = "";
                    PERMISSION_MATRIX.forEach((row, ri) => {
                      if (row.group !== lastGroup) {
                        lastGroup = row.group;
                        rows.push(
                          <tr key={`group-${row.group}`} className="border-b border-slate-200 bg-slate-100/70">
                            <td colSpan={allCols.length + 1} className="py-1.5 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              {row.group}
                            </td>
                          </tr>
                        );
                      }
                      const currentRoles = rbacMatrix[row.module] ?? row.roles;
                      const defaultRoles = defaultMatrix[row.module] ?? row.roles;
                      const isChanged = JSON.stringify([...currentRoles].sort()) !== JSON.stringify([...defaultRoles].sort());
                      rows.push(
                        <tr key={row.module} className={`border-b border-slate-100 transition ${isChanged ? "bg-amber-50/50" : ri % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                          <td className="py-2 px-4 font-medium whitespace-nowrap flex items-center gap-1.5">
                            {row.module}
                            {isChanged && <span className="text-[9px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded font-bold">değişti</span>}
                          </td>
                          {allCols.map(r => {
                            const hasRole = currentRoles.includes(r.key);
                            const isLocked = r.key === "SuperAdmin";
                            return (
                              <td key={r.key} className="py-2 px-2 text-center">
                                {isLocked ? (
                                  <span className="inline-flex w-6 h-6 rounded-full bg-violet-100 text-violet-500 items-center justify-center cursor-not-allowed" title="Süper Admin her zaman tam yetkili">
                                    ✓
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => togglePerm(row.module, r.key)}
                                    title={hasRole ? `${r.label} yetkisini kaldır` : `${r.label} yetkisini ekle`}
                                    className={`inline-flex w-6 h-6 rounded-full items-center justify-center transition-all duration-150 ${
                                      hasRole
                                        ? "bg-teal-100 text-teal-600 hover:bg-red-100 hover:text-red-500 border border-teal-200 hover:border-red-200"
                                        : "bg-slate-100 text-slate-300 hover:bg-teal-50 hover:text-teal-400 border border-slate-200 hover:border-teal-200"
                                    }`}
                                  >
                                    {hasRole ? "✓" : "—"}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    });
                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
              <Users size={12} /> Kullanıcıya rol atamak için <button className="text-teal-600 underline underline-offset-2" onClick={() => window.open("/kullanicilar", "_self")}>Kullanıcılar</button> sayfasına gidin.
            </p>
          </Section>
        </div>
      )}

      {/* ── Sistem ── */}
      {tab === "sistem" && (
        <div className="space-y-5">
          <Section title="Bakım Modu" icon={<Shield size={16} />}
            subtitle="Aktif edildiğinde müşteri sitesi bakım sayfası gösterir. Admin paneli etkilenmez.">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-700">Bakım Modu</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {settings.MaintenanceMode === "true"
                    ? "Site şu anda bakımda. Müşteriler siteye erişemiyor."
                    : "Site aktif. Müşteriler normal şekilde erişebiliyor."}
                </p>
              </div>
              <button onClick={() => set("MaintenanceMode", settings.MaintenanceMode === "true" ? "false" : "true")}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.MaintenanceMode === "true" ? "bg-red-500" : "bg-slate-300"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.MaintenanceMode === "true" ? "left-7" : "left-1"}`} />
              </button>
            </div>
            {settings.MaintenanceMode === "true" && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <Shield size={14} /> Dikkat: Bakım modu aktif. Müşteri sitesi şu anda erişilemez.
              </div>
            )}
          </Section>
          <Section title="E-posta / SMTP Test" icon={<Mail size={16} />}
            subtitle="SMTP yapılandırmanızın çalıştığını doğrulamak için test e-postası gönderin. appsettings.json → Email bölümünü doldurun.">
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1 font-mono">
                <p>SmtpHost → <span className="text-slate-900">appsettings.json : Email:SmtpHost</span></p>
                <p>SmtpPort → <span className="text-slate-900">587 (StartTLS) veya 465 (SSL — UseSsl: true)</span></p>
                <p>Gmail    → host: smtp.gmail.com, port: 587, UseSsl: false</p>
                <p>Mailtrap → host: sandbox.smtp.mailtrap.io, port: 587</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className={inp + " flex-1"}
                  onKeyDown={e => e.key === "Enter" && sendTestEmail()}
                />
                <button onClick={sendTestEmail} disabled={testEmailSending || !testEmail.trim()}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                  {testEmailSending ? <Loader2 size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
                  Gönder
                </button>
              </div>
              {testEmailResult && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
                  testEmailResult.ok
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {testEmailResult.ok ? <CheckCircle size={15} /> : <XCircle size={15} />}
                  {testEmailResult.msg}
                </div>
              )}
            </div>
          </Section>
          <Section title="Ortam Konfigürasyonu" icon={<Database size={16} />}
            subtitle="Her servis için dev / staging / prod URL'lerini tanımlayın. 'Aktif Et' ile ortam geçişi yapın — Kaydet butonuyla uygulanır.">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50">
                <Shield size={14} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">Dikkat:</span> Ortam değişikliği API yeniden başlatılana kadar tam etkili olmaz.
                  Frontend env değişkenleri (.env.local) ayrıca güncellenmesi gerekebilir.
                </p>
              </div>

              {/* Aktif ortam özeti */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">Aktif Ortam:</span>
                {(["dev","staging","prod"] as const).map(env => {
                  const label = env === "dev" ? "Development" : env === "staging" ? "Staging" : "Production";
                  const active = settings.AppEnvironment === (env === "dev" ? "development" : env === "staging" ? "staging" : "production");
                  return (
                    <button key={env} onClick={() => activateEnv(env)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        active
                          ? env === "prod"
                            ? "bg-red-600 text-white border-red-600"
                            : env === "staging"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}>
                      {active && <span className="mr-1">✓</span>}{label}
                    </button>
                  );
                })}
              </div>

              {/* URL tablosu */}
              {[
                { label: "Admin Panel", devKey: "AdminBaseUrl_dev", stagingKey: "AdminBaseUrl_staging", prodKey: "AdminBaseUrl_prod", activeKey: "AdminBaseUrl", devPlaceholder: "http://localhost:3001", stagingPlaceholder: "https://admin-staging.example.com", prodPlaceholder: "https://admin.example.com" },
                { label: "Müşteri Sitesi", devKey: "CustomerBaseUrl_dev", stagingKey: "CustomerBaseUrl_staging", prodKey: "CustomerBaseUrl_prod", activeKey: "CustomerBaseUrl", devPlaceholder: "http://localhost:3000", stagingPlaceholder: "https://staging.example.com", prodPlaceholder: "https://example.com" },
                { label: "API", devKey: "ApiBaseUrl_dev", stagingKey: "ApiBaseUrl_staging", prodKey: "ApiBaseUrl_prod", activeKey: "ApiBaseUrl", devPlaceholder: "http://localhost:5124", stagingPlaceholder: "https://api-staging.example.com", prodPlaceholder: "https://api.example.com" },
              ].map(row => (
                <div key={row.label} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700">{row.label}</span>
                    {settings[row.activeKey] && (
                      <a href={settings[row.activeKey]} target="_blank" rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-800 font-mono">
                        <ExternalLink size={10} />{settings[row.activeKey]}
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-slate-200">
                    {([
                      { env: "dev" as const, key: row.devKey, label: "Development", ph: row.devPlaceholder, color: "emerald" },
                      { env: "staging" as const, key: row.stagingKey, label: "Staging", ph: row.stagingPlaceholder, color: "blue" },
                      { env: "prod" as const, key: row.prodKey, label: "Production", ph: row.prodPlaceholder, color: "red" },
                    ]).map(col => {
                      const envActive = settings.AppEnvironment === (col.env === "dev" ? "development" : col.env === "staging" ? "staging" : "production");
                      const isActiveUrl = settings[row.activeKey] === settings[col.key] && !!settings[col.key];
                      return (
                        <div key={col.env} className={`p-3 space-y-2 ${envActive ? "bg-teal-50/40" : ""}`}>
                          <p className={`text-[10px] font-bold uppercase tracking-wide ${
                            col.env === "prod" ? "text-red-500" : col.env === "staging" ? "text-blue-500" : "text-emerald-600"
                          }`}>{col.label}</p>
                          <input
                            value={settings[col.key] ?? ""}
                            onChange={e => set(col.key, e.target.value)}
                            placeholder={col.ph}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                          />
                          {isActiveUrl ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 font-semibold">
                              <CheckCircle size={10} /> Aktif
                            </span>
                          ) : (
                            <button onClick={() => { set(row.activeKey, settings[col.key] || ""); activateEnv(col.env); }}
                              disabled={!settings[col.key]}
                              className="text-[10px] text-slate-500 hover:text-teal-700 disabled:opacity-30 disabled:cursor-not-allowed font-medium border border-slate-200 hover:border-teal-400 rounded-lg px-2 py-0.5 transition">
                              Aktif Et
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {settings.AppEnvironment === "production" && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <Shield size={14} /> Canlı ortam seçili — tüm değişiklikler gerçek kullanıcıları etkiler.
                </div>
              )}
              {settings.AppEnvironment === "staging" && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                  <Database size={14} /> Hazırlık ortamı — test verileri kullanılabilir, canlı etkilenmez.
                </div>
              )}
            </div>
          </Section>

          <Section title="Servis Yönetimi" icon={<Activity size={16} />}
            subtitle="Arka planda çalışan sistem servislerini izleyin, durdurun veya tetikleyin. Her 10 saniyede otomatik yenilenir.">
            {servicesLoading && services.length === 0 ? (
              <div className="flex items-center justify-center h-16 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin mr-2" /> Yükleniyor...
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                Kayıtlı servis bulunamadı.
              </div>
            ) : (
              <div className="space-y-3">
                {services.map(svc => {
                  const isActing = serviceAction?.startsWith(svc.name);
                  const uptime = svc.uptimeSeconds;
                  const uptimeStr = uptime < 60 ? `${uptime}s` : uptime < 3600 ? `${Math.floor(uptime/60)}dk` : `${Math.floor(uptime/3600)}sa`;
                  return (
                    <div key={svc.name} className={`border rounded-xl p-4 transition ${svc.isPaused ? "border-amber-200 bg-amber-50/40" : svc.isRunning ? "border-teal-300 bg-teal-50/30" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-800">{svc.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              svc.isPaused ? "bg-amber-100 text-amber-700" :
                              svc.isRunning ? "bg-teal-100 text-teal-700 animate-pulse" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {svc.isPaused ? "⏸ Duraklatıldı" : svc.isRunning ? "● Çalışıyor" : "○ Bekliyor"}
                            </span>
                            <span className="text-[10px] text-slate-400">↑ {uptimeStr}</span>
                            <span className="text-[10px] text-slate-400">{svc.runCount} çalışma</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{svc.description}</p>
                          {svc.lastRunAt && (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${svc.lastRunSuccess ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                                {svc.lastRunSuccess ? "✓" : "✗"} {svc.lastRunResult ?? "—"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(svc.lastRunAt).toLocaleTimeString("tr-TR")}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {svc.isPaused ? (
                            <button onClick={() => resumeService(svc.name)} disabled={!!isActing}
                              title="Devam Ettir"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-50">
                              {isActing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                              Devam
                            </button>
                          ) : (
                            <button onClick={() => pauseService(svc.name)} disabled={!!isActing}
                              title="Duraklat"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition disabled:opacity-50">
                              {isActing ? <Loader2 size={12} className="animate-spin" /> : <Pause size={12} />}
                              Duraklat
                            </button>
                          )}
                          <button onClick={() => triggerService(svc.name)} disabled={!!isActing || svc.isRunning}
                            title="Manuel Tetikle"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition disabled:opacity-50">
                            {isActing ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                            Tetikle
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-end">
                  <button onClick={() => {
                    setServicesLoading(true);
                    api.get<ServiceState[]>("/api/admin/services").then(setServices).catch(() => {}).finally(() => setServicesLoading(false));
                  }} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-700 transition">
                    <RefreshCw size={12} className={servicesLoading ? "animate-spin" : ""} /> Yenile
                  </button>
                </div>
              </div>
            )}
          </Section>

          <Section title="Ortam & Konfigürasyon" icon={<Settings size={16} />}
            subtitle="Sunucu tarafındaki çalışma zamanı bilgileri. Hassas veriler maskelendi.">
            {sysInfo ? (
              <div className="space-y-4">
                {/* Ortam */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Ortam", value: sysInfo.environment },
                    { label: "Uygulama Versiyonu", value: sysInfo.appVersion },
                    { label: ".NET Versiyonu", value: sysInfo.runtime?.dotNetVersion?.replace("Microsoft .NET ", "") ?? "—" },
                    { label: "İşlemci Sayısı", value: `${sysInfo.runtime?.processorCount ?? "—"} çekirdek` },
                  ].map(r => (
                    <div key={r.label} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide">{r.label}</p>
                      <p className="text-xs font-semibold text-slate-700 truncate">{r.value}</p>
                    </div>
                  ))}
                </div>

                {/* DB */}
                <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Database size={13} /> Veritabanı
                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-semibold ${sysInfo.database?.isConfigured ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {sysInfo.database?.isConfigured ? "Bağlı" : "Yapılandırılmamış"}
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-slate-400 mb-0.5">Sağlayıcı</p>
                      <p className="text-xs font-semibold text-slate-700">{sysInfo.database?.provider}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-slate-400 mb-0.5">Bağlantı</p>
                      <p className="text-xs font-mono text-slate-500 truncate">{sysInfo.database?.connectionMasked}</p>
                    </div>
                  </div>
                </div>

                {/* Cache + Queue + Email grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      title: "Cache", icon: <Wifi size={13} />,
                      items: [
                        { label: "Sağlayıcı", value: sysInfo.cache?.provider },
                        { label: "Bağlantı", value: sysInfo.cache?.connectionMasked ?? "(InMemory)" },
                      ],
                      ok: sysInfo.cache?.isConfigured,
                    },
                    {
                      title: "Kuyruk (MassTransit)", icon: <Activity size={13} />,
                      items: [
                        { label: "Sağlayıcı", value: sysInfo.queue?.provider },
                        { label: "Host", value: sysInfo.queue?.host },
                        { label: "VHost", value: sysInfo.queue?.virtualHost },
                      ],
                      ok: sysInfo.queue?.isConfigured,
                    },
                    {
                      title: "E-posta (SMTP)", icon: <Mail size={13} />,
                      items: [
                        { label: "SMTP Host", value: sysInfo.email?.smtpHost },
                        { label: "Port", value: sysInfo.email?.smtpPort },
                        { label: "Gönderen", value: sysInfo.email?.senderEmail ?? "—" },
                      ],
                      ok: sysInfo.email?.isConfigured,
                    },
                  ].map(card => (
                    <div key={card.title} className="border border-slate-200 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        {card.icon} {card.title}
                        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${card.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {card.ok ? "Aktif" : "InMemory"}
                        </span>
                      </p>
                      {card.items.map(i => (
                        <div key={i.label} className="flex justify-between text-xs gap-2">
                          <span className="text-slate-400 shrink-0">{i.label}</span>
                          <span className="font-mono text-slate-600 truncate text-right">{i.value ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin mr-2" /> Yükleniyor...
              </div>
            )}
          </Section>

          <Section title="Aktivasyon Anahtarı" icon={<KeyRound size={16} />}
            subtitle="Uygulamayı çalıştırmak için gereken lisans anahtarı. Geçersiz veya eksik lisansta sistem başlamaz ve API yanıt vermez.">

            {/* Durum kartı */}
            {devKeyLoading ? (
              <div className="flex items-center justify-center h-16 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin mr-2" /> Yükleniyor...
              </div>
            ) : !devKeyStatus?.isConfigured ? (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <Shield size={15} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-semibold">Anahtar yapılandırılmamış</p>
                  <p className="text-xs mt-1 text-amber-700">
                    <code className="bg-amber-100 px-1 rounded">appsettings.Development.json</code> dosyasında{" "}
                    <code className="bg-amber-100 px-1 rounded">"License"</code> anahtarı eksik veya boş.
                    Aşağıdaki rehberi takip ederek yapılandır.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Aktivasyon Anahtarı</p>
                    <p className="font-mono text-sm font-semibold text-slate-700 tracking-widest">{devKeyStatus.maskedKey ?? "****-****-****-****"}</p>
                    {!devKeyStatus.revealPasswordSet && (
                      <p className="text-[10px] text-amber-600 mt-1">Görüntüleme şifresi henüz ayarlanmamış (DevRevealPassword eksik).</p>
                    )}
                  </div>
                  <button onClick={openRevealModal} disabled={!devKeyStatus.revealPasswordSet}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                    <Eye size={13} /> Görüntüle
                  </button>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                  <Shield size={12} className="shrink-0 mt-0.5" />
                  <span>Lisans geçerli · RSA-2048 imzası doğrulandı · Geçerlilik: 2026-01-01 – 2028-12-31</span>
                </div>
              </div>
            )}

            {/* Kullanım rehberi */}
            <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                <BookOpen size={13} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-600">Bu anahtarı nasıl kullanırım?</p>
              </div>
              <div className="p-4 space-y-4">

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Adım 1 — Token'ı Görüntüle</p>
                  <ol className="space-y-1">
                    {[
                      '"Görüntüle" butonuna tıkla',
                      'Açılan modalda görüntüleme şifresini gir (sistem yöneticisinden al)',
                      'Tam token ekranda belirir — "Kopyala" butonuna bas',
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Adım 2 — Yapılandırma Dosyasına Yapıştır</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-900 rounded-lg text-[10px] font-mono space-y-1">
                      <p className="text-slate-400">{'// appsettings.Development.json'}</p>
                      <p className="text-amber-300">{'"License": "<buraya yapıştır>"'}</p>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg text-[10px] font-mono space-y-1">
                      <p className="text-slate-400">{'# Production ortam değişkeni'}</p>
                      <p className="text-emerald-300">{'ECOM_LICENSE=<buraya yapıştır>'}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-600 flex items-center gap-1">
                    <Shield size={10} /> appsettings.Development.json gitignore'dadır — token git'e commit edilmez.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Adım 3 — Uygulamayı Yeniden Başlat</p>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-[10px] font-mono">
                    <p className="text-slate-400">{'# backend/ dizininden'}</p>
                    <p className="text-teal-300">{'dotnet run --project src/Ecom.API'}</p>
                  </div>
                  <p className="text-xs text-slate-500">Başarılıysa bu sayfaya geri dön — durum "Yapılandırılmış" olarak güncellenir.</p>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Sorun Giderme</p>
                  {[
                    { s: "Uygulama başlamıyor", c: "Token eksik veya imzası hatalı. Terminal'deki hatayı oku ve token'ı tekrar kopyala/yapıştır." },
                    { s: "Giriş 401 veriyor", c: "JWT anahtarı lisanstan türetilir. Token değişmişse oturumu kapatıp tekrar giriş yap." },
                    { s: "Tüm API'ler 503 veriyor", c: "LicenseMiddleware engelledi. Dosyaya yapıştırılan token tam ve tek satır olmalı." },
                  ].map(r => (
                    <div key={r.s} className="flex gap-2 text-xs">
                      <span className="text-red-500 font-semibold shrink-0 w-40">{r.s}</span>
                      <span className="text-red-700">{r.c}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </Section>
        </div>
      )}

      {/* ── Reveal Key Modal ── */}
      {revealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <KeyRound size={16} className="text-teal-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Aktivasyon Anahtarı</h3>
                  <p className="text-[10px] text-slate-400">Görüntülemek için şifrenizi girin</p>
                </div>
              </div>
              <button onClick={closeRevealModal} className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {!revealedKey ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Görüntüleme Şifresi</label>
                  <input
                    type="password"
                    value={revealPassword}
                    onChange={e => { setRevealPassword(e.target.value); setRevealError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleRevealKey()}
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    autoFocus
                  />
                  {revealError && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <XCircle size={12} /> {revealError}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  Bu şifre, admin giriş şifrenizden bağımsız olarak tanımlanmış özel bir görüntüleme şifresidir.
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={closeRevealModal}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition font-medium">
                    İptal
                  </button>
                  <button onClick={handleRevealKey} disabled={revealLoading || !revealPassword.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition disabled:opacity-50">
                    {revealLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                    Görüntüle
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <p className="text-[10px] text-teal-500 uppercase tracking-wide mb-2 font-semibold">Aktivasyon Anahtarı</p>
                  <p className="font-mono text-sm font-bold text-teal-800 tracking-widest break-all select-all">{revealedKey}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    navigator.clipboard.writeText(revealedKey);
                    setKeyCopied(true);
                    setTimeout(() => setKeyCopied(false), 2000);
                  }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-semibold transition">
                    {keyCopied ? <CheckCircle size={14} className="text-emerald-600" /> : <Lock size={14} />}
                    {keyCopied ? "Kopyalandı!" : "Kopyala"}
                  </button>
                  <button onClick={closeRevealModal}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold transition">
                    Kapat
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center">Bu anahtarı güvenli bir yerde saklayın. Pencereyi kapatırsanız tekrar şifre girmeniz gerekecektir.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lisans ── */}
      {tab === "lisans" && (
        <div className="space-y-5">
          <Section title="Lisans Yönetimi" icon={<KeyRound size={16} />}
            subtitle="Modül lisanslarını buradan yönetin. Süresi dolan veya yaklaşan lisanslar uyarı rozeti gösterir.">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">{licenses.length} lisans kayıtlı</p>
              <button onClick={openLicenseAdd}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition">
                <Plus size={13} /> Yeni Lisans
              </button>
            </div>

            {licensesLoading ? (
              <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin mr-2" /> Yükleniyor...
              </div>
            ) : licenses.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                Henüz lisans kaydı yok.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {licenses.map(lic => {
                  const cardCls = !lic.isActive
                    ? "bg-slate-50 border-slate-200"
                    : lic.isExpired
                    ? "bg-red-50 border-red-200"
                    : lic.daysRemaining <= 30
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50 border-emerald-200";
                  return (
                    <div key={lic.id} className={`p-4 rounded-xl border ${cardCls} flex flex-col gap-2`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{lic.module}</p>
                          {lic.description && <p className="text-xs text-slate-500 mt-0.5">{lic.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openLicenseEdit(lic)}
                            className="text-slate-400 hover:text-teal-600 transition p-1 rounded-lg hover:bg-white/60">
                            <Settings size={13} />
                          </button>
                          <button onClick={() => deleteLicense(lic.id)}
                            className="text-slate-400 hover:text-red-600 transition p-1 rounded-lg hover:bg-white/60">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {lic.licenseKey && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-white/60 rounded px-2 py-0.5 w-fit">
                          <KeyRound size={9} />
                          {lic.licenseKey}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Bitiş: {new Date(lic.expiresAt).toLocaleDateString("tr-TR")}
                        </span>
                        {!lic.isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-semibold text-[10px]">Pasif</span>
                        ) : lic.isExpired ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-700 font-semibold text-[10px]">Süresi Dolmuş</span>
                        ) : lic.daysRemaining <= 30 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-700 font-semibold text-[10px]">{lic.daysRemaining} gün kaldı</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-700 font-semibold text-[10px]">{lic.daysRemaining} gün kaldı</span>
                        )}
                      </div>

                      {lic.notes && (
                        <p className="text-[10px] text-slate-400 bg-white/60 rounded-lg px-2 py-1 italic">{lic.notes}</p>
                      )}

                      {(lic.isExpired || lic.daysRemaining <= 30) && (
                        <button
                          onClick={() => openRenewModal(lic)}
                          className={`w-full mt-1 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                            lic.isExpired
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "bg-amber-500 hover:bg-amber-600 text-white"
                          }`}
                        >
                          <RefreshCw size={11} />
                          {lic.isExpired ? "Lisansı Yenile" : "Süreyi Uzat"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Add / Edit Modal */}
          {licenseModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    {licenseModal.license ? "Lisans Düzenle" : "Yeni Lisans Ekle"}
                  </h3>
                  <button onClick={() => setLicenseModal({ open: false })}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                    <XCircle size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  <Field label="Modül Adı *">
                    <input value={licenseForm.module}
                      onChange={e => setLicenseForm(p => ({ ...p, module: e.target.value }))}
                      className={inp} placeholder="Ör: ERP Entegrasyonu" />
                  </Field>
                  <Field label="Açıklama">
                    <input value={licenseForm.description}
                      onChange={e => setLicenseForm(p => ({ ...p, description: e.target.value }))}
                      className={inp} placeholder="İsteğe bağlı açıklama" />
                  </Field>
                  <Field label="Bitiş Tarihi *">
                    <input type="date" value={licenseForm.expiresAt}
                      onChange={e => setLicenseForm(p => ({ ...p, expiresAt: e.target.value }))}
                      className={inp} />
                  </Field>
                  <Field label="Notlar">
                    <textarea value={licenseForm.notes}
                      onChange={e => setLicenseForm(p => ({ ...p, notes: e.target.value }))}
                      className={inp + " resize-none"} rows={2} placeholder="İsteğe bağlı notlar" />
                  </Field>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">Aktif</span>
                    <button onClick={() => setLicenseForm(p => ({ ...p, isActive: !p.isActive }))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${licenseForm.isActive ? "bg-teal-500" : "bg-slate-300"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${licenseForm.isActive ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>

                {licenseError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <XCircle size={13} /> {licenseError}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-1">
                  <button onClick={() => setLicenseModal({ open: false })}
                    className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition">
                    İptal
                  </button>
                  <button onClick={saveLicense} disabled={licenseSaving}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                    {licenseSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Renew Modal */}
          {renewModal.open && renewModal.license && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Lisans Yenile</h3>
                  <button onClick={() => setRenewModal({ open: false })}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                    <XCircle size={16} />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-0.5">
                  <p className="font-semibold text-slate-800">{renewModal.license.module}</p>
                  {renewModal.license.isExpired ? (
                    <p className="text-red-600">Lisans süresi dolmuş — yenileme bugünden itibaren başlar.</p>
                  ) : (
                    <p>Mevcut bitiş: {new Date(renewModal.license.expiresAt).toLocaleDateString("tr-TR")} — uzatma bu tarihten devam eder.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">Paket Seçin</p>
                  {[
                    { months: 1,  label: "1 Ay",   price: "₺99" },
                    { months: 6,  label: "6 Ay",   price: "₺499" },
                    { months: 12, label: "1 Yıl",  price: "₺799" },
                    { months: 24, label: "2 Yıl",  price: "₺1.399" },
                  ].map(pkg => (
                    <button
                      key={pkg.months}
                      onClick={() => setRenewMonths(pkg.months)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition ${
                        renewMonths === pkg.months
                          ? "border-teal-500 bg-teal-50 text-teal-700 font-semibold"
                          : "border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50/50"
                      }`}
                    >
                      <span>{pkg.label}</span>
                      <span className={`font-bold ${renewMonths === pkg.months ? "text-teal-600" : "text-slate-500"}`}>{pkg.price}</span>
                    </button>
                  ))}
                </div>

                {renewError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <XCircle size={13} /> {renewError}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-1">
                  <button onClick={() => setRenewModal({ open: false })}
                    className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition">
                    İptal
                  </button>
                  <button onClick={submitRenew} disabled={renewing}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                    {renewing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    Yenile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const inp = "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition";

function Section({ title, subtitle, icon, children }: {
  title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-start gap-2">
        <span className="text-teal-600 mt-0.5">{icon}</span>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
