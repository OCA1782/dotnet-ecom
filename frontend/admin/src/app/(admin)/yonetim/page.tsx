"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";
import { api } from "@/lib/api";
import { ADMIN_ROLE_COLUMNS } from "@/lib/roles";
import RichTextEditor from "@/components/RichTextEditor";
import {
  Settings, Globe, Palette, Truck, Menu, Shield, FileText,
  Save, Upload, Loader2, CheckCircle, GripVertical,
  Share2, Image as ImageIcon, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Plus, Pencil, Trash2, HelpCircle, RefreshCw, MapPin, Clock, Phone, Mail,
  SendHorizonal, X, XCircle, MessageCircle, CreditCard, Building2, Lock,
  Users, KeyRound, Database, Wifi, Activity,
  LayoutDashboard, Package, ShoppingCart, Layers, Tag, BarChart3,
  Inbox, BookOpen, Target, Warehouse, MessageSquare, Eye,
  ExternalLink, BellRing, Bell, BellOff, TestTube, AlertTriangle, Copy, Languages, Search,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */
type SiteSettings = Record<string, string>;
type FaqItem = { q: string; a: string };

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
  CustomerTemplate: "spareparts",
  DisabledTemplates: "",
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
  // İş yönetimi
  "I18nJob:EnableAutoRun": "false",
  "I18nJob:AllowSourceMutation": "false",
  "I18nJob:AllowDocsWrite": "false",
  "I18nJob:TriggerBuilderFromScanner": "false",
  "I18nJob:ProjectRoot": "",
  "I18nJob:DocsPath": "",
  "I18nJob:ScheduleTimeZone": "Turkey Standard Time",
  "I18nJob:DictionaryBuilderWindowStart": "01:00:00",
  "I18nJob:DictionaryBuilderWindowEnd": "07:00:00",
  "CustomerI18nJob:EnableAutoRun": "false",
  "CustomerI18nJob:AllowSourceMutation": "false",
  "CustomerI18nJob:AllowDocsWrite": "false",
  "CustomerI18nJob:TriggerBuilderFromScanner": "false",
  "CustomerI18nJob:ProjectRoot": "",
  "CustomerI18nJob:DocsPath": "",
  "CustomerI18nJob:ScheduleTimeZone": "Turkey Standard Time",
  "CustomerI18nJob:DictionaryBuilderWindowStart": "01:00:00",
  "CustomerI18nJob:DictionaryBuilderWindowEnd": "07:00:00",
  "VerificationJob:ApiBaseUrl": "http://localhost:5124",
  "VerificationJob:ProjectRoot": "",
  "VerificationJob:LogFilePath": "",
  "AdminLintAudit:TodoPath": "TODO_PENDING.md",
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
  // Dil
  CustomerLanguageSwitcherEnabled: "false",
  // Şablon içerik — Spareparts
  Spareparts_B2BText: "",
  Spareparts_Phone: "",
  Spareparts_HeroCount: "",
  Spareparts_HeroCountUnit: "",
  Spareparts_HeroSlogan: "",
  Spareparts_HotParts: "",
  Spareparts_TrustedBrands: "",
  Spareparts_Trust1: "",
  Spareparts_Trust2: "",
  Spareparts_Trust3: "",
  Spareparts_Trust4: "",
  Spareparts_Promo1Title: "",
  Spareparts_Promo1Desc: "",
  Spareparts_Promo2Discount: "",
  // Şablon içerik — Marketplace
  Marketplace_FlashBarText: "",
  Marketplace_HeroDiscount: "",
  Marketplace_HeroTitle: "",
  Marketplace_FreeShippingLimit: "",
  Marketplace_Trust1: "",
  Marketplace_Trust2: "",
  Marketplace_Trust3: "",
  Marketplace_Trust4: "",
  // Şablon içerik — Techstore
  Techstore_FlashBarText: "",
  Techstore_HeroTitle: "",
  Techstore_HeroSubtitle: "",
  Techstore_HeroDesc: "",
  Techstore_Brands: "",
  Techstore_Trust1: "",
  Techstore_Trust2: "",
  Techstore_Trust3: "",
  Techstore_Trust4: "",
  // Şablon içerik — Genel (modern, minimal, bold vb.)
  Default_Trust1: "",
  Default_Trust2: "",
  Default_Trust3: "",
  Default_Trust4: "",
  Default_CategoriesTitle: "",
  Default_CategoriesSubtitle: "",
  Default_FeaturedTitle: "",
  Default_FeaturedSubtitle: "",
  Default_DiscountTitle: "",
  Default_DiscountSubtitle: "",
  Default_CampaignsTitle: "",
  Default_CampaignsSubtitle: "",
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
  {
    id: "atolye", name: "Atölye", emoji: "🌷",
    description: "3 sütun, krem arka plan, ortalanmış başlık. Türk halk sanatı estetiği, el işi dükkanları için.",
    tags: ["El İşi", "Krem", "3 Sütun"],
    columns: 3, headerLayout: "centered",
    headerColor: "#F5F0E8", bgColor: "#F5F0E8", cardBg: "#FEFCF7", textColor: "#2C1A10", svgRadius: 8, hasShadow: true,
  },
  {
    id: "anadolu", name: "Anadolu", emoji: "🔵",
    description: "3 sütun, lacivert başlık, krem zemin. Geleneksel Türk renk paleti, butik ve kültürel markalar için.",
    tags: ["Geleneksel", "Lacivert", "3 Sütun"],
    columns: 3, headerLayout: "standard",
    headerColor: "#1E5B8C", bgColor: "#F5F0E8", cardBg: "#FEFCF7", textColor: "#1E3A5F", svgRadius: 4, hasShadow: true,
  },
  {
    id: "cini", name: "Çini", emoji: "🏺",
    description: "4 sütun, terracotta başlık, düz köşeler. Türk çini sanatından ilham, seramik ve el sanatları için.",
    tags: ["Çini", "Terracotta", "Düz"],
    columns: 4, headerLayout: "standard",
    headerColor: "#C74B2A", bgColor: "#F0EBE3", cardBg: "#FEFCF7", textColor: "#2C1A10", svgRadius: 2, hasShadow: false,
  },
  // ── Sektör Şablonları ──
  {
    id: "automotive", name: "Otomotiv", emoji: "🚗",
    description: "3 sütun, derin koyu arka plan, elektrik mavisi vurgular, keskin köşeler. Araç, yedek parça ve aksesuar satışı için.",
    tags: ["Otomotiv", "Koyu", "3 Sütun"],
    columns: 3, headerLayout: "fullwidth-dark",
    headerColor: "#1a1a2e", bgColor: "#0d0d1a", cardBg: "#1e1e35", textColor: "#e2e8f0", svgRadius: 2, hasShadow: true,
  },
  {
    id: "telecom", name: "Telekomünikasyon", emoji: "📡",
    description: "4 sütun, lacivert başlık, temiz beyaz zemin. İnternet, telefon ve teknoloji ürünleri satışı için.",
    tags: ["Telekom", "Kurumsal", "4 Sütun"],
    columns: 4, headerLayout: "standard",
    headerColor: "#003366", bgColor: "#f0f4ff", cardBg: "#ffffff", textColor: "#0a1929", svgRadius: 8, hasShadow: true,
  },
  {
    id: "manufacturing", name: "Üretim & Sanayi", emoji: "🏭",
    description: "4 sütun, siyah başlık, turuncu sanayi vurgular. Makine, ekipman ve endüstriyel ürünler için.",
    tags: ["Sanayi", "Endüstriyel", "4 Sütun"],
    columns: 4, headerLayout: "fullwidth-dark",
    headerColor: "#1a1a1a", bgColor: "#f5f5f0", cardBg: "#ffffff", textColor: "#1a1a1a", svgRadius: 0, hasShadow: false,
  },
  {
    id: "education", name: "Eğitim", emoji: "🎓",
    description: "4 sütun, akademik mavi başlık, yumuşak köşeler. Kurs, kitap, eğitim materyali satışı için.",
    tags: ["Eğitim", "Akademik", "4 Sütun"],
    columns: 4, headerLayout: "standard",
    headerColor: "#1a4f8a", bgColor: "#f0f7ff", cardBg: "#ffffff", textColor: "#0a1929", svgRadius: 12, hasShadow: true,
  },
  {
    id: "legal", name: "Hukuk & Danışmanlık", emoji: "⚖️",
    description: "3 sütun, lacivert zemin, altın tonlar, resmi düzen. Hukuk büroları, danışmanlık ve kurumsal hizmetler için.",
    tags: ["Hukuk", "Resmi", "3 Sütun"],
    columns: 3, headerLayout: "centered",
    headerColor: "#1a2744", bgColor: "#f8f7f4", cardBg: "#ffffff", textColor: "#1a2744", svgRadius: 2, hasShadow: false,
  },
  {
    id: "healthcare", name: "Sağlık & Medikal", emoji: "🏥",
    description: "4 sütun, medikal yeşil başlık, temiz beyaz zemin, yumuşak köşeler. Eczane, sağlık ürünleri ve medikal ekipman için.",
    tags: ["Sağlık", "Medikal", "4 Sütun"],
    columns: 4, headerLayout: "standard",
    headerColor: "#00695c", bgColor: "#f0faf9", cardBg: "#ffffff", textColor: "#004d40", svgRadius: 8, hasShadow: true,
  },
  // ── Pazar / Yedek Parça Şablonları ──
  {
    id: "spareparts", name: "Yedek Parça / Oto", emoji: "🔧",
    description: "4 sütun, koyu başlık, turuncu vurgular, araç filtreli kompakt düzen. Oto aksesuar ve yedek parça siteleri için.",
    tags: ["Otomotiv", "B2B", "4 Sütun"],
    columns: 4, headerLayout: "amazon",
    headerColor: "#111827", bgColor: "#f3f4f6", cardBg: "#ffffff", textColor: "#111827", svgRadius: 2, hasShadow: true,
  },
  {
    id: "marketplace", name: "Pazar Yeri", emoji: "🛍️",
    description: "5 sütun, turuncu başlık, yoğun ürün ızgarası. Hepsiburada / Trendyol tarzı çok kategorili platform için.",
    tags: ["Platform", "Turuncu", "5 Sütun"],
    columns: 5, headerLayout: "fullwidth-dark",
    headerColor: "#e55000", bgColor: "#f5f5f5", cardBg: "#ffffff", textColor: "#1a1a1a", svgRadius: 4, hasShadow: true,
  },
  {
    id: "techstore", name: "Elektronik Mağaza", emoji: "💻",
    description: "4 sütun, kırmızı başlık, beyaz zemin, keskin köşeler. Elektronik, teknoloji ve bilgisayar ürünleri için.",
    tags: ["Elektronik", "Kırmızı", "4 Sütun"],
    columns: 4, headerLayout: "standard",
    headerColor: "#be0000", bgColor: "#f5f5f5", cardBg: "#ffffff", textColor: "#1a1a1a", svgRadius: 2, hasShadow: true,
  },
] as const;

function TemplatePreview({ tmpl, siteName }: { tmpl: typeof TEMPLATES[number]; siteName?: string }) {
  const { headerColor, bgColor, cardBg, textColor, svgRadius, hasShadow, id, columns, headerLayout } = tmpl;
  const shortName = (siteName || "Mağaza").slice(0, 7);

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
    id === "atolye" ? "#1E5B8C" :
    id === "anadolu" ? "#C74B2A" :
    id === "cini" ? "#1E5B8C" :
    id === "automotive" ? "#38bdf8" :
    id === "telecom" ? "#0ea5e9" :
    id === "manufacturing" ? "#f97316" :
    id === "education" ? "#3b82f6" :
    id === "legal" ? "#b8952a" :
    id === "healthcare" ? "#10b981" :
    id === "spareparts" ? "#f97316" :
    id === "marketplace" ? "#ff6000" :
    id === "techstore" ? "#be0000" :
    "#0d9488";

  /* Görsel arka plan */
  const imgBg =
    id === "dark" ? "#334155" :
    id === "luxe" || id === "retro" ? "#fde68a" :
    id === "glassmorphism" ? "rgba(255,255,255,0.15)" :
    id === "neon" ? "#1a003a" :
    id === "instagram" ? "#c8c8c8" :
    id === "catalog" ? "#f0f0f0" :
    id === "atolye" || id === "anadolu" || id === "cini" ? "#E8DFD0" :
    id === "automotive" ? "#2d2d50" :
    id === "telecom" ? "#d0e4ff" :
    id === "manufacturing" ? "#e0e0d8" :
    id === "education" ? "#dbeafe" :
    id === "legal" ? "#e8e4d8" :
    id === "healthcare" ? "#d1faf4" :
    id === "spareparts" ? "#e5e7eb" :
    id === "marketplace" ? "#e0e0e0" :
    id === "techstore" ? "#e5e7eb" :
    "#e2e8f0";

  /* Header açık mı koyu mu */
  const darkHeaders = ["#1e293b","#0f172a","#0a0020","#131921","#0d9488","rgba(255,255,255,0.12)","#1E5B8C","#C74B2A","#1a1a2e","#003366","#1a1a1a","#1a4f8a","#1a2744","#00695c","#111827","#e55000","#be0000"];
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
    id === "atolye" ? "#D4882C33" :
    id === "anadolu" ? "#1E5B8C22" :
    id === "cini" ? "#C74B2A22" :
    id === "automotive" ? "#38bdf833" :
    id === "manufacturing" ? "#f9731622" :
    id === "legal" ? "#b8952a22" :
    id === "spareparts" ? "#f9731633" :
    id === "marketplace" ? "#ff600033" :
    id === "techstore" ? "#be000033" :
    accent + "22";

  /* ── Özel layout: Yedek Parça / Pazar Yeri / Elektronik ── */
  if (id === "spareparts") {
    const brands = ["OPEL","BMW","VW","AUDI","FORD","SEAT","KIA","SKODA"];
    return (
      <svg viewBox="0 0 180 112" xmlns="http://www.w3.org/2000/svg" style={{ display:"block", width:"100%", height:"100%" }}>
        <rect width="180" height="112" fill="#f3f4f6" />
        {/* B2B bilgi çubuğu (koyu) */}
        <rect width="180" height="5" fill="#1c1f2e" />
        <rect x="3" y="1.5" width="10" height="2" rx="1" fill="#f97316" opacity="0.9" />
        <rect x="15" y="1.5" width="30" height="2" rx="1" fill="#6b7280" opacity="0.5" />
        <rect x="155" y="1.5" width="22" height="2" rx="1.5" fill="#f97316" opacity="0.7" />
        {/* Main header — beyaz */}
        <rect y="5" width="180" height="18" fill="#ffffff" />
        <rect x="4" y="8" width="18" height="12" rx="6" fill="#f97316" opacity="0.9" />
        <text x="5.5" y="16.5" fontSize="3" fill="#ffffff" fontFamily="sans-serif" fontWeight="700">{shortName}</text>
        <rect x="26" y="8" width="92" height="12" rx="6" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" />
        <rect x="30" y="12" width="38" height="4" rx="2" fill="#9ca3af" opacity="0.5" />
        <rect x="120" y="8" width="12" height="12" rx="6" fill="#f3f4f6" />
        <rect x="136" y="8" width="12" height="12" rx="6" fill="#f3f4f6" />
        <rect x="152" y="8" width="12" height="12" rx="6" fill="#f97316" opacity="0.12" />
        <rect x="155" y="10" width="6" height="8" rx="1" fill="#f97316" opacity="0.7" />
        {/* Marka pill nav (wrap, yuvarlak) */}
        <rect y="23" width="180" height="12" fill="#ffffff" stroke="#f3f4f6" strokeWidth="0.5" />
        {brands.map((b, i) => {
          const x = 3 + (i % 4) * 44;
          const y2 = 24.5 + Math.floor(i / 4) * 6;
          return (
            <g key={b}>
              <rect x={x} y={y2} width={b.length * 2.8 + 5} height="4.5" rx="2.25"
                fill={i === 0 ? "#f97316" : "#f3f4f6"}
                stroke={i === 0 ? "none" : "#e5e7eb"} strokeWidth="0.4" />
              <text x={x + 2.5} y={y2 + 3.3} fontSize="2.8" fill={i === 0 ? "#ffffff" : "#6b7280"} fontFamily="sans-serif" fontWeight={i===0?"700":"500"}>{b}</text>
            </g>
          );
        })}
        {/* Sol sidebar — yuvarlak */}
        <rect x="0" y="37" width="42" height="75" rx="5" fill="#ffffff" stroke="#f3f4f6" strokeWidth="0.5" />
        {/* Araç seçici header */}
        <rect x="0" y="37" width="42" height="7" rx="0" fill="#374151" />
        <rect x="0" y="40" width="42" height="4" fill="#374151" />
        <rect x="2" y="38.5" width="28" height="3" rx="1.5" fill="#ffffff" opacity="0.7" />
        {/* Seçici input'ları */}
        <rect x="3" y="47" width="36" height="5" rx="2" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="0.4" />
        <rect x="5" y="49" width="16" height="1.5" rx="0.75" fill="#9ca3af" opacity="0.6" />
        <rect x="3" y="54" width="36" height="5" rx="2" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="0.4" />
        <rect x="5" y="56" width="12" height="1.5" rx="0.75" fill="#9ca3af" opacity="0.6" />
        <rect x="3" y="61" width="36" height="5" rx="2" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="0.4" />
        <rect x="5" y="63" width="18" height="1.5" rx="0.75" fill="#9ca3af" opacity="0.6" />
        {/* Ara butonu — yuvarlak */}
        <rect x="3" y="68.5" width="36" height="6" rx="3" fill="#f97316" />
        <text x="13" y="73" fontSize="3.5" fill="#ffffff" fontFamily="sans-serif" fontWeight="700">Parça Ara</text>
        {/* Kategori başlığı */}
        <rect x="0" y="77" width="42" height="6" fill="#f97316" />
        <rect x="0" y="79" width="42" height="4" fill="#f97316" />
        <rect x="2" y="78.5" width="22" height="2.5" rx="1.25" fill="#ffffff" opacity="0.8" />
        {/* Kategori satırları */}
        {[0,1,2,3].map(i => (
          <g key={i}>
            <rect x="3" y={84 + i * 6} width="36" height="4.5" rx="2" fill="#f9fafb" />
            <rect x="5" y={85.2 + i * 6} width="20" height="2" rx="1" fill="#9ca3af" opacity="0.55" />
          </g>
        ))}
        {/* Sağ içerik */}
        {/* Promo area — 4 kolon */}
        {/* Sol küçük */}
        <rect x="45" y="37" width="30" height="26" rx="5" fill="#ffffff" stroke="#f3f4f6" strokeWidth="0.5" />
        <rect x="48" y="41" width="16" height="2" rx="1" fill="#9ca3af" opacity="0.5" />
        <rect x="48" y="45" width="22" height="3" rx="1.5" fill="#374151" opacity="0.7" />
        <rect x="48" y="57" width="14" height="3" rx="1.5" fill="#f97316" opacity="0.7" />
        {/* Orta hero */}
        <rect x="77" y="37" width="57" height="26" rx="5" fill="#16213e" />
        <rect x="80" y="42" width="18" height="3" rx="1.5" fill="#f97316" opacity="0.9" />
        <rect x="80" y="47" width="30" height="5" rx="1" fill="#ffffff" opacity="0.8" />
        <rect x="80" y="55" width="22" height="5" rx="2.5" fill="#f97316" />
        <rect x="83" y="57" width="16" height="1.5" rx="0.75" fill="#ffffff" opacity="0.9" />
        {/* Sağ promo */}
        <rect x="136" y="37" width="42" height="26" rx="5" fill="#f97316" />
        <rect x="139" y="42" width="22" height="3" rx="1.5" fill="#ffffff" opacity="0.7" />
        <rect x="139" y="47" width="18" height="4" rx="1" fill="#ffffff" opacity="0.9" />
        <rect x="139" y="54" width="28" height="6" rx="3" fill="#ffffff" />
        <rect x="142" y="56.5" width="22" height="1.5" rx="0.75" fill="#f97316" opacity="0.8" />
        {/* Ürün grid (3 kolon) — yuvarlak kartlar */}
        {[0,1,2].map(i => {
          const cx = 45 + i * 45;
          return (
            <g key={i}>
              <rect x={cx} y="66" width="43" height="22" rx="5" fill="#ffffff" />
              <rect x={cx+2} y="68" width="39" height="11" rx="3" fill="#f3f4f6" />
              <rect x={cx+3} y="81" width="22" height="2" rx="1" fill="#374151" opacity="0.6" />
              <rect x={cx+3} y="84.5" width="14" height="2" rx="1" fill="#f97316" opacity="0.8" />
              <rect x={cx} y="91" width="43" height="20" rx="5" fill="#ffffff" />
              <rect x={cx+2} y="93" width="39" height="10" rx="3" fill="#f3f4f6" />
              <rect x={cx+3} y="105" width="22" height="2" rx="1" fill="#374151" opacity="0.6" />
              <rect x={cx+3} y="108" width="14" height="2" rx="1" fill="#f97316" opacity="0.8" />
            </g>
          );
        })}
      </svg>
    );
  }

  if (id === "marketplace") {
    const mktCats = ["Elektronik","Moda","Ev","Spor","Kozmetik","Kitap","Oyun","Çocuk"];
    const mktColors = ["#e8f0fe","#fce7f3","#ecfdf5","#fff7ed","#fdf4ff","#fffbeb","#f0fdf4","#eff6ff"];
    const mktTexts  = ["#1a56db","#be185d","#065f46","#c2410c","#7e22ce","#b45309","#166534","#1d4ed8"];
    return (
      <svg viewBox="0 0 180 112" xmlns="http://www.w3.org/2000/svg" style={{ display:"block", width:"100%", height:"100%" }}>
        <rect width="180" height="112" fill="#f7f7f7" />
        {/* Header (turuncu, handled by CSS) */}
        <rect width="180" height="20" fill="#FF6000" />
        <rect x="4" y="4" width="20" height="12" rx="6" fill="rgba(255,255,255,0.3)" />
        <rect x="7" y="7" width="14" height="6" rx="3" fill="rgba(255,255,255,0.85)" />
        <text x="8" y="12" fontSize="3" fill="#FF6000" fontFamily="sans-serif" fontWeight="700">{shortName}</text>
        <rect x="28" y="4" width="88" height="12" rx="6" fill="rgba(255,255,255,0.95)" />
        <rect x="32" y="8" width="38" height="4" rx="2" fill="#d1d5db" opacity="0.6" />
        <rect x="118" y="4" width="12" height="12" rx="6" fill="rgba(255,255,255,0.25)" />
        <rect x="134" y="4" width="12" height="12" rx="6" fill="rgba(255,255,255,0.25)" />
        <rect x="150" y="4" width="12" height="12" rx="6" fill="rgba(255,255,255,0.25)" />
        <rect x="165" y="4" width="12" height="12" rx="6" fill="rgba(255,255,255,0.2)" />
        {/* Pill kategori nav */}
        <rect y="20" width="180" height="13" fill="#ffffff" />
        {mktCats.slice(0,7).map((c, i) => (
          <g key={c}>
            <rect x={3 + i * 24} y="23" width={i === 0 ? 20 : 18} height="7" rx="3.5"
              fill={i === 0 ? "#FF6000" : "#f3f4f6"}
              stroke={i === 0 ? "none" : "#e5e7eb"} strokeWidth="0.4" />
            <text x={5 + i * 24} y="28.5" fontSize="3" fill={i === 0 ? "#ffffff" : "#6b7280"} fontFamily="sans-serif" fontWeight={i===0?"700":"500"}>{c.slice(0,4)}</text>
          </g>
        ))}
        {/* Hero banner (rounded) */}
        <rect x="2" y="35" width="118" height="28" rx="6" fill="#FF6000" />
        <rect x="7" y="40" width="32" height="4" rx="2" fill="rgba(255,255,255,0.9)" />
        <rect x="7" y="46" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.6)" />
        <rect x="7" y="52" width="28" height="7" rx="3.5" fill="#ffffff" />
        <rect x="11" y="54.5" width="20" height="2" rx="1" fill="#FF6000" opacity="0.8" />
        {/* Sağ mini kartlar */}
        <rect x="122" y="35" width="27" height="13" rx="4" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.5" />
        <rect x="125" y="38" width="11" height="4" rx="1.5" fill="#e5e7eb" />
        <rect x="125" y="44" width="16" height="2" rx="1" fill="#9ca3af" opacity="0.6" />
        <rect x="151" y="35" width="27" height="13" rx="4" fill="#fff8f4" stroke="#fed7aa" strokeWidth="0.5" />
        <rect x="154" y="38" width="11" height="4" rx="1.5" fill="#fed7aa" />
        <rect x="154" y="44" width="16" height="2" rx="1" fill="#f97316" opacity="0.5" />
        <rect x="122" y="50" width="56" height="13" rx="4" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.5" />
        {/* Kategori dairesel ikonlar */}
        <rect x="2" y="65" width="176" height="16" rx="5" fill="#ffffff" stroke="#f3f4f6" strokeWidth="0.5" />
        {mktCats.map((c, i) => (
          <g key={c}>
            <circle cx={13 + i * 22} cy="73" r="5" fill={mktColors[i]} />
            <text x={10 + i * 22} cy="73" y="75.5" fontSize="3.5" fill={mktTexts[i]} fontFamily="sans-serif" fontWeight="700">{c.slice(0,2).toUpperCase()}</text>
          </g>
        ))}
        {/* Ürün grid (5 kolon, yuvarlak kartlar) */}
        {[0,1,2,3,4].map(i => {
          const cx = 2 + i * 35;
          return (
            <g key={i}>
              <rect x={cx} y="83" width="33" height="27" rx="4" fill="#ffffff" />
              <rect x={cx+2} y="85" width="29" height="14" rx="3" fill="#f3f4f6" />
              <rect x={cx+3} y="101" width="17" height="2.5" rx="1.25" fill="#374151" opacity="0.6" />
              <rect x={cx+3} y="105" width="11" height="2.5" rx="1.25" fill="#FF6000" opacity="0.8" />
            </g>
          );
        })}
      </svg>
    );
  }

  if (id === "techstore") {
    const techCats = ["LP","AT","TV","BE","OY","AK"];
    const techBgs  = ["#1e293b","#1e3a5f","#1c1917","#1a2e1a","#2d1b3d","#2a1515"];
    const techFgs  = ["#94a3b8","#60a5fa","#a8a29e","#86efac","#c084fc","#fca5a5"];
    return (
      <svg viewBox="0 0 180 112" xmlns="http://www.w3.org/2000/svg" style={{ display:"block", width:"100%", height:"100%" }}>
        <rect width="180" height="112" fill="#f2f2f2" />
        {/* Header (kırmızı, CSS ile) */}
        <rect width="180" height="20" fill="#cc0000" />
        <rect x="4" y="4" width="20" height="12" rx="6" fill="rgba(255,255,255,0.2)" />
        <rect x="6" y="7" width="16" height="6" rx="3" fill="rgba(255,255,255,0.9)" />
        <text x="7" y="12" fontSize="3" fill="#cc0000" fontFamily="sans-serif" fontWeight="700">{shortName}</text>
        <rect x="28" y="4" width="88" height="12" rx="6" fill="#ffffff" />
        <rect x="32" y="8" width="38" height="4" rx="2" fill="#d1d5db" opacity="0.6" />
        <rect x="118" y="4" width="12" height="12" rx="6" fill="rgba(255,255,255,0.25)" />
        <rect x="134" y="4" width="12" height="12" rx="6" fill="rgba(255,255,255,0.25)" />
        <rect x="150" y="4" width="12" height="12" rx="6" fill="rgba(255,255,255,0.25)" />
        <rect x="165" y="4" width="12" height="12" rx="6" fill="rgba(255,255,255,0.2)" />
        {/* Kategori nav bar (koyu) */}
        <rect y="20" width="180" height="9" fill="#1a1a1a" />
        <rect x="0" y="20" width="24" height="9" fill="#cc0000" />
        <text x="2" y="27" fontSize="3" fill="#ffffff" fontFamily="sans-serif" fontWeight="700">Kategoriler</text>
        {["Bilg.","Tel.","Tablet","TV","Beyaz","Oyun"].map((c, i) => (
          <text key={c} x={26 + i * 25} y="27" fontSize="3" fill="rgba(255,255,255,0.75)" fontFamily="sans-serif">{c}</text>
        ))}
        {/* Pill hızlı linkler */}
        <rect y="29" width="180" height="8" fill="#ffffff" />
        {["Kampanya","Çok Satan","Yeni","Favoriler"].map((c, i) => (
          <g key={c}>
            <rect x={3 + i * 43} y="31" width={c.length * 3.2 + 4} height="4.5" rx="2.25" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="0.4" />
            <text x={5 + i * 43} y="34.5" fontSize="2.8" fill="#6b7280" fontFamily="sans-serif">{c}</text>
          </g>
        ))}
        {/* Hero banner (rounded) */}
        <rect x="2" y="39" width="118" height="26" rx="6" fill="#1a1a1a" />
        <rect x="5" y="44" width="20" height="3" rx="1.5" fill="#cc0000" />
        <rect x="5" y="49" width="32" height="4" rx="2" fill="#ffffff" opacity="0.9" />
        <rect x="5" y="55" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.45)" />
        <rect x="5" y="60" width="26" height="3.5" rx="1.75" fill="#cc0000" />
        {/* Sağ mini kartlar */}
        <rect x="122" y="39" width="27" height="12" rx="4" fill="#cc0000" />
        <rect x="125" y="42" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.7)" />
        <rect x="125" y="46" width="10" height="2" rx="1" fill="rgba(255,255,255,0.4)" />
        <rect x="151" y="39" width="27" height="12" rx="4" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.5" />
        <rect x="154" y="42" width="14" height="3" rx="1.5" fill="#e5e7eb" />
        <rect x="154" y="46" width="10" height="2" rx="1" fill="#9ca3af" opacity="0.5" />
        <rect x="122" y="53" width="56" height="12" rx="4" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.5" />
        {/* 6 kategori kutusu (koyu, yuvarlak) */}
        {techCats.map((abbr, i) => (
          <g key={abbr}>
            <rect x={2 + i * 29.5} y="67" width="27" height="14" rx="5" fill={techBgs[i]} />
            <text x={8 + i * 29.5} y="77" fontSize="4" fill={techFgs[i]} fontFamily="sans-serif" fontWeight="700">{abbr}</text>
          </g>
        ))}
        {/* Ürün grid (4 kolon) */}
        {[0,1,2,3].map(i => {
          const cx = 2 + i * 44;
          return (
            <g key={i}>
              <rect x={cx} y="83" width="42" height="27" rx="5" fill="#ffffff" />
              <rect x={cx+2} y="85" width="38" height="14" rx="3" fill="#f3f4f6" />
              <rect x={cx+3} y="101" width="22" height="2.5" rx="1.25" fill="#374151" opacity="0.7" />
              <rect x={cx+3} y="105" width="14" height="2.5" rx="1.25" fill="#cc0000" opacity="0.8" />
            </g>
          );
        })}
      </svg>
    );
  }

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

type Tab = "genel" | "gorunum" | "sablon" | "kargo" | "menu" | "icerik" | "chatbot" | "odeme" | "mesajlar" | "mail" | "yetkiler" | "lisans" | "otomasyon" | "sistem" | "bildirimler" | "dil";

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
  { id: "mail",     label: "Mail Log", icon: <Mail size={14} /> },
  { id: "yetkiler", label: "Yetkiler", icon: <Shield size={14} /> },
  { id: "lisans",   label: "Lisans",   icon: <KeyRound size={14} /> },
  { id: "otomasyon", label: "Otomasyon", icon: <Activity size={14} /> },
  { id: "bildirimler", label: "Bildirimler", icon: <BellRing size={14} /> },
  { id: "dil",        label: "Dil",         icon: <Languages size={14} /> },
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
// ROLE_COLUMNS → @/lib/roles.ts ADMIN_ROLE_COLUMNS'dan beslenir (tutarlılık için)
const ROLE_COLUMNS = ADMIN_ROLE_COLUMNS;

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
  // Test: production'da ortam koruması uygulanır (SuperAdmin bile olsa prod'da varsayılan gizli)
  { module: "Test",          group: "Sistem",    roles: ["SuperAdmin"] },
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
  const { t } = useI18n();
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
                  {t("auto.bosGrup", "Boş grup — buraya sürükleyin")}
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
  const { t } = useI18n();
  const [items, setItems] = useState<FaqItem[]>(() => {
    try { return JSON.parse(value) as FaqItem[]; } catch { return []; }
  });
  const lastValue = useRef(value);

  useEffect(() => {
    if (value !== lastValue.current) {
      lastValue.current = value;
      const timer = window.setTimeout(() => {
        try { setItems(JSON.parse(value) as FaqItem[]); } catch { setItems([]); }
      }, 0);
      return () => window.clearTimeout(timer);
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
          {t("auto.henuzSoruYok", "Henüz soru yok. Eklemek için aşağıdaki butonu kullanın.")}
        </div>
      )}
      {items.map((item, i) => (
        <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <HelpCircle size={14} className="text-teal-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-500">{t("auto.soruN", "Soru")} {i + 1}</span>
            <button onClick={() => remove(i)}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
              <Trash2 size={13} />
            </button>
          </div>
          <input value={item.q} onChange={e => setField(i, "q", e.target.value)}
            placeholder={t("auto.soruMetni", "Soru metni...")}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <RichTextEditor
            value={item.a}
            onChange={v => setField(i, "a", v)}
            placeholder="Cevap metni..."
          />
        </div>
      ))}
      <button onClick={add}
        className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 border border-teal-200 hover:border-teal-400 bg-teal-50 hover:bg-teal-100 rounded-xl px-4 py-2.5 transition w-full justify-center">
        <Plus size={15} /> {t("auto.soruEkle", "Soru Ekle")}
      </button>
    </div>
  );
}

/* ─── Text page editor ───────────────────────────────────────────────── */
function TextEditor({ label, settingKey, value, onChange, hint }: {
  label: string; settingKey: string; value: string;
  onChange: (key: string, val: string) => void;
  rows?: number; hint?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-600 block">{label}</label>
      <RichTextEditor value={value} onChange={v => onChange(settingKey, v)} placeholder={t("auto.icerikBurayaGirilecek", "İçerik buraya girilecek...")} />
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

function hexToLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const toLinear = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  try {
    const l1 = hexToLuminance(hex1);
    const l2 = hexToLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker  = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  } catch {
    return 21;
  }
}

function CarrierManager() {
  const { t } = useI18n();
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

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

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
    if (!form.name.trim() || !form.code.trim()) { setFormError(t("auto.firmaAdiKodZorunlu", "Firma adı ve kod zorunludur.")); return; }
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
          <p className="text-sm font-bold text-slate-700">{t("auto.kargoFirmalari", "Kargo Firmaları")}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t("auto.kargoFirmalarıAciklama", "Alternatif kargo firmalarını, fiyatları ve takip URL şablonlarını yönetin.")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition">
            <RefreshCw size={14} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition">
            <Plus size={14} /> {t("auto.firmaEkle", "Firma Ekle")}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 py-4 text-center">{t("action.loading", "Yükleniyor...")}</p>
      ) : carriers.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center">
          <Truck size={24} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">{t("auto.henuzKargoYok", "Henüz kargo firması eklenmemiş.")}</p>
          <button onClick={openCreate} className="mt-3 px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition">{t("action.add", "Ekle")}</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">{t("auto.firma", "Firma")}</th>
                <th className="text-left px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">{t("auto.kod", "Kod")}</th>
                <th className="text-right px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">{t("auto.bazFiyat", "Baz Fiyat")}</th>
                <th className="text-right px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">{t("auto.ucretsizEsik", "Ücretsiz Eşik")}</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">{t("auto.gun", "Gün")}</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">{t("label.status", "Durum")}</th>
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
                      ? <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{t("status.active", "Aktif")}</span>
                      : <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{t("status.passive", "Pasif")}</span>}
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
                {modal === "create" ? t("carrier.newFirm", "Yeni Kargo Firması") : t("carrier.editFirm", "Firma Düzenle")}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{formError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={cl}>{t("auto.firmaAdi", "Firma Adı")} <span className="text-red-500">*</span></label><input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={ci} placeholder="Yurtiçi Kargo" /></div>
                <div><label className={cl}>{t("auto.kod", "Kod")} <span className="text-red-500">*</span></label><input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value.toLowerCase()}))} className={ci} placeholder="yurtici" /></div>
                <div><label className={cl}>{t("auto.bazFiyatTry", "Baz Fiyat (TRY)")}</label><input type="number" min={0} step={0.01} value={form.basePrice} onChange={e => setForm(f => ({...f, basePrice: +e.target.value}))} className={ci} /></div>
                <div><label className={cl}>{t("auto.ucretsizKargoEsigi", "Ücretsiz Kargo Eşiği (TRY)")}</label><input type="number" min={0} step={0.01} value={form.freeShippingThreshold ?? ""} onChange={e => setForm(f => ({...f, freeShippingThreshold: e.target.value ? +e.target.value : null}))} className={ci} placeholder={t("auto.bosYok", "Boş = yok")} /></div>
                <div><label className={cl}>{t("auto.tahminTeslimat", "Tahmini Teslimat (gün)")}</label><input type="number" min={1} max={30} value={form.estimatedDays} onChange={e => setForm(f => ({...f, estimatedDays: +e.target.value}))} className={ci} /></div>
                <div><label className={cl}>{t("auto.maksAgirlik", "Maks. Ağırlık (kg)")}</label><input type="number" min={0} step={0.1} value={form.maxWeightKg ?? ""} onChange={e => setForm(f => ({...f, maxWeightKg: e.target.value ? +e.target.value : null}))} className={ci} placeholder={t("auto.bosSinirsiz", "Boş = sınırsız")} /></div>
              </div>
              <div><label className={cl}>{t("auto.takipUrlSablonu", "Takip URL Şablonu")}</label><input value={form.trackingUrlTemplate} onChange={e => setForm(f => ({...f, trackingUrlTemplate: e.target.value}))} className={ci} placeholder="https://track.example.com/{0}" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={cl}>{t("label.url", "Logo URL")}</label><input value={form.logoUrl} onChange={e => setForm(f => ({...f, logoUrl: e.target.value}))} className={ci} /></div>
                <div><label className={cl}>API Endpoint</label><input value={form.apiEndpoint} onChange={e => setForm(f => ({...f, apiEndpoint: e.target.value}))} className={ci} /></div>
              </div>
              <div><label className={cl}>{t("auto.notlar", "Notlar")}</label><textarea rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className={ci + " resize-none"} /></div>
              <div>
                <label className={cl}>{t("auto.agirlikFiyatlandirma", "Ağırlık Bazlı Fiyatlandırma (JSON)")}</label>
                <textarea rows={3} value={form.weightPricingJson} onChange={e => setForm(f => ({...f, weightPricingJson: e.target.value}))} className={ci + " resize-none font-mono text-xs"} placeholder='[{"minKg":0,"maxKg":1,"price":29.90}]' />
              </div>
              {modal === "edit" && (
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({...f, isActive: e.target.checked}))} className="sr-only peer" />
                    <div className="w-10 h-5 bg-slate-200 peer-checked:bg-teal-500 rounded-full peer transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                  </label>
                  <span className="text-sm text-slate-700">{t("status.active", "Aktif")}</span>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">{t("action.cancel", "Vazgeç")}</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-60">
                  {saving ? t("action.saving", "Kaydediliyor...") : modal === "create" ? t("action.add", "Ekle") : t("action.save", "Kaydet")}
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
              <div><h3 className="font-bold text-slate-800">{t("auto.firmaySil", "Firmayı Sil")}</h3><p className="text-sm text-slate-500">{deleteTarget.name}</p></div>
            </div>
            <p className="text-sm text-slate-600">{t("msg.confirmDelete", "Silmek istediğinizden emin misiniz?")}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition">{t("action.cancel", "Vazgeç")}</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">{t("action.delete", "Sil")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Ana sayfa ─────────────────────────────────────────────────────── */
const VALID_TABS: Tab[] = ["genel","gorunum","sablon","kargo","menu","icerik","chatbot","odeme","mesajlar","yetkiler","lisans","otomasyon","sistem","bildirimler","dil"];

export default function YonetimPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const initialTab = (VALID_TABS as string[]).includes(searchParams.get("tab") ?? "")
    ? searchParams.get("tab") as Tab
    : "genel";
  const [tab, setTab]             = useState<Tab>(initialTab);
  const [contentSub, setContentSub] = useState<ContentSub>("sss");
  const [settings, setSettings]   = useState<SiteSettings>(DEFAULTS);
  const [tmplPage, setTmplPage]               = useState(0);
  const [tmplPerPage, setTmplPerPage]         = useState(9);
  const [showHiddenTmpls, setShowHiddenTmpls] = useState(false);
  const [tmplFilter, setTmplFilter]           = useState("");
  const [cmpPage, setCmpPage]                 = useState(1);
  const [cmpPerPage, setCmpPerPage]           = useState(8);
  const [cmpFilter, setCmpFilter]             = useState("");
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [testEmail, setTestEmail]               = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult]   = useState<{ ok: boolean; msg: string } | null>(null);

  // Mail log state
  type MailLogEntry = { id: string; sentAt: string; toEmail: string; toName: string; subject: string; templateName: string; isSuccess: boolean; isDevMode: boolean; errorMessage: string | null };
  const [mailLogs, setMailLogs]           = useState<MailLogEntry[]>([]);
  const [mailLogsTotal, setMailLogsTotal] = useState(0);
  const [mailLogsPage, setMailLogsPage]   = useState(1);
  const [mailLogsLoading, setMailLogsLoading] = useState(false);
  const [mailLogsStatus, setMailLogsStatus]   = useState<string>("");
  const [mailLogsSearch, setMailLogsSearch]   = useState("");
  const [mailLogsTemplate, setMailLogsTemplate] = useState("");
  const [mailGuideOpen, setMailGuideOpen]       = useState(false);
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

  const [devKeyStatus, setDevKeyStatus] = useState<{ isConfigured: boolean; maskedKey: string | null; fullKey?: string; issuer?: string; notBefore?: string; expiresAt?: string; isValid?: boolean; validationError?: string; revealPasswordSet: boolean } | null>(null);
  const [devKeyLoading, setDevKeyLoading] = useState(false);

  // Lisans üretici state (SuperAdmin only)
  const isSuperAdmin = (() => {
    if (typeof window === "undefined") return false;
    try { return (JSON.parse(localStorage.getItem("admin_user") ?? "{}") as { roles?: string[] }).roles?.includes("SuperAdmin") ?? false; }
    catch { return false; }
  })();
  const [licGenPrivKey, setLicGenPrivKey] = useState("");
  const [licGenIssuer, setLicGenIssuer] = useState("OCA1782");
  const [licGenHost, setLicGenHost] = useState(""); // sunucu hostname/IP binding
  const [licGenNbf, setLicGenNbf] = useState(() => new Date().toISOString().slice(0, 10));
  const [licGenExp, setLicGenExp] = useState(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 2); return d.toISOString().slice(0, 10); });
  const [licGenToken, setLicGenToken] = useState<string | null>(null);
  const [licGenError, setLicGenError] = useState("");
  const [licGenLoading, setLicGenLoading] = useState(false);
  const [licGenCopied, setLicGenCopied] = useState(false);
  const [licGenPubKey, setLicGenPubKey] = useState<string | null>(null);
  const [licGenKeyPairLoading, setLicGenKeyPairLoading] = useState(false);
  const [licGenPubKeyCopied, setLicGenPubKeyCopied] = useState(false);

  // License assignment state (SuperAdmin)
  const [licAssignEmail, setLicAssignEmail]   = useState(""); // e-posta veya Ad Soyad
  const [licAssignToken, setLicAssignToken]   = useState("");
  const [licAssignNotes, setLicAssignNotes]   = useState("");
  const [licAssignLoading, setLicAssignLoading] = useState(false);
  const [licAssignError, setLicAssignError]   = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [licAssignResult, setLicAssignResult] = useState<any>(null);
  const [copiedViewPwd, setCopiedViewPwd]     = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [licAssignments, setLicAssignments]   = useState<any[]>([]);
  const [licAssignmentsLoading, setLicAssignmentsLoading] = useState(false);
  const [resetResults, setResetResults]       = useState<Record<string, string>>({});
  const [copiedResetId, setCopiedResetId]     = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [licHistory, setLicHistory]           = useState<any[]>([]);
  const [licHistoryLoading, setLicHistoryLoading] = useState(false);

  // My license reveal state (regular Admin)
  const [myViewPassword, setMyViewPassword]   = useState("");
  const [myViewLoading, setMyViewLoading]     = useState(false);
  const [myViewError, setMyViewError]         = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myLicense, setMyLicense]             = useState<any>(null);
  const [myLicCopied, setMyLicCopied]         = useState(false);

  // Full key copy (SuperAdmin)
  const [fullKeyCopied, setFullKeyCopied]     = useState(false);

  // SuperAdmin key auto-hide (15 s)
  const [superAdminKeyVisible, setSuperAdminKeyVisible]     = useState(false);
  const [superAdminKeyCountdown, setSuperAdminKeyCountdown] = useState(0);
  const superAdminKeyTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const superAdminKeyTick  = useRef<ReturnType<typeof setInterval> | null>(null);

  // My-license auto-hide (15 s)
  const [myLicCountdown, setMyLicCountdown] = useState(0);
  const myLicTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const myLicTick  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Revoke assignment modal
  const [revokeTarget, setRevokeTarget]   = useState<{ id: string; adminEmail: string; adminName: string } | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Legacy state — referenced by old Sistem tab code wrapped in {false && ...}, kept for TS compatibility
  const [revealModal]                          = useState(false);
  const [revealPassword, setRevealPassword]   = useState("");
  const [revealedKey]                          = useState<string | null>(null);
  const [revealError, setRevealError]         = useState("");
  const [revealLoading, setRevealLoading]     = useState(false);
  const [keyCopied, setKeyCopied]             = useState(false);
  const [openTmplSection, setOpenTmplSection] = useState<string | null>(null);
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
      setOpenTmplSection(s => s ?? (["spareparts","marketplace","techstore"].includes(data.CustomerTemplate || "") ? data.CustomerTemplate! : "default"));
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

  // Legacy functions — referenced by old Sistem tab code wrapped in {false && ...}, kept for TS compatibility
  function openRevealModal() { setRevealPassword(""); setRevealLoading(false); setRevealError(""); setKeyCopied(false); }
  function closeRevealModal() { setRevealPassword(""); setRevealError(""); setKeyCopied(false); }
  async function handleRevealKey() { if (!revealPassword.trim()) { setRevealError(""); return; } setRevealLoading(true); setRevealLoading(false); }

  const loadLicenseAssignments = useCallback(() => {
    setLicAssignmentsLoading(true);
    api.get<unknown[]>("/api/admin/license-assignments")
      .then(setLicAssignments)
      .catch(() => {})
      .finally(() => setLicAssignmentsLoading(false));
  }, []);

  const loadLicenseHistory = useCallback(() => {
    setLicHistoryLoading(true);
    api.get<unknown[]>("/api/admin/license-assignments/history?limit=50")
      .then(setLicHistory)
      .catch(() => {})
      .finally(() => setLicHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "lisans") return;
    const timer = window.setTimeout(() => {
      setDevKeyLoading(true);
      api.get<{ isConfigured: boolean; maskedKey: string | null; fullKey?: string; issuer?: string; notBefore?: string; expiresAt?: string; revealPasswordSet: boolean }>("/api/admin/dev-key")
        .then(setDevKeyStatus)
        .catch(() => {})
        .finally(() => setDevKeyLoading(false));
      if (isSuperAdmin) { loadLicenseAssignments(); loadLicenseHistory(); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tab, isSuperAdmin, loadLicenseAssignments, loadLicenseHistory]);

  // ── IP Whitelist state ─────────────────────────────────────────────────────
  const [ipEnabled, setIpEnabled]   = useState(false);
  const [ipList, setIpList]         = useState<string[]>([]);
  const [ipNewEntry, setIpNewEntry] = useState("");
  const [ipSaving, setIpSaving]     = useState(false);
  const [ipSaved, setIpSaved]       = useState(false);

  // ── Bildirimler tab state ───────────────────────────────────────────────────
  const [alertEnabled, setAlertEnabled]   = useState(false);
  const [alertEmails, setAlertEmails]     = useState<string[]>([]);
  const [alertNewEmail, setAlertNewEmail] = useState("");
  const [alertSaving, setAlertSaving]     = useState(false);
  const [alertSaved, setAlertSaved]       = useState(false);
  const [alertTesting, setAlertTesting]   = useState(false);
  const [alertTestMsg, setAlertTestMsg]   = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "mail") return;
    void loadMailLogs(1, "", "", "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMailLogsStatus("");
    setMailLogsSearch("");
    setMailLogsTemplate("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== "sistem") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIpEnabled(settings["Security:IpWhitelistEnabled"] === "true");
    setIpList((settings["Security:IpWhitelist"] ?? "").split(",").map(s => s.trim()).filter(Boolean));
  }, [tab, settings]);

  useEffect(() => {
    if (tab !== "bildirimler") return;
    const timer = window.setTimeout(() => {
      const enabled = settings["Alert:Enabled"] === "true";
      const emails  = (settings["Alert:Emails"] ?? "")
        .split(",").map(e => e.trim()).filter(Boolean);
      setAlertEnabled(enabled);
      setAlertEmails(emails);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tab, settings]);

  async function saveIpWhitelist() {
    setIpSaving(true);
    try {
      await api.put("/api/admin/settings", {
        "Security:IpWhitelistEnabled": ipEnabled ? "true" : "false",
        "Security:IpWhitelist": ipList.join(","),
      });
      set("Security:IpWhitelistEnabled", ipEnabled ? "true" : "false");
      set("Security:IpWhitelist", ipList.join(","));
      setIpSaved(true);
      setTimeout(() => setIpSaved(false), 2500);
    } catch { } finally {
      setIpSaving(false);
    }
  }

  async function saveAlertSettings() {
    setAlertSaving(true);
    try {
      await api.put("/api/admin/settings", {
        "Alert:Enabled": alertEnabled ? "true" : "false",
        "Alert:Emails": alertEmails.join(","),
      });
      set("Alert:Enabled", alertEnabled ? "true" : "false");
      set("Alert:Emails", alertEmails.join(","));
      setAlertSaved(true);
      setTimeout(() => setAlertSaved(false), 2500);
    } catch { } finally {
      setAlertSaving(false);
    }
  }

  async function sendTestAlert() {
    if (alertEmails.length === 0) { setAlertTestMsg("En az bir e-posta adresi ekleyin."); return; }
    setAlertTesting(true);
    setAlertTestMsg(null);
    try {
      await api.post("/api/admin/settings/test-alert", { emails: alertEmails });
      setAlertTestMsg("Test maili gönderildi!");
    } catch (e: unknown) {
      setAlertTestMsg(e instanceof Error ? e.message : "Gönderilemedi");
    } finally {
      setAlertTesting(false);
    }
  }

  // Legacy functions — referenced by old Sistem tab code wrapped in {false && ...}, kept for TS compatibility
  async function handleAssignLicense() {
    setLicAssignError(""); setLicAssignResult(null);
    if (!licAssignEmail.trim()) { setLicAssignError("E-posta veya kullanıcı adı zorunludur."); return; }
    if (!licAssignToken.trim()) { setLicAssignError("Lisans token zorunludur."); return; }
    setLicAssignLoading(true);
    try {
      const res = await api.post<{ viewPassword: string; message: string }>("/api/admin/license-assignments", {
        adminIdentifier: licAssignEmail.trim(),
        licenseToken: licAssignToken.trim(),
        notes: licAssignNotes.trim() || null,
      });
      setLicAssignResult(res);
      setLicAssignEmail(""); setLicAssignToken(""); setLicAssignNotes("");
      loadLicenseAssignments();
    } catch (e: unknown) {
      setLicAssignError(e instanceof Error ? e.message : "Atama başarısız.");
    } finally {
      setLicAssignLoading(false);
    }
  }

  async function executeRevoke() {
    if (!revokeTarget) return;
    setRevokeLoading(true);
    try {
      await api.delete(`/api/admin/license-assignments/${revokeTarget.id}`);
      setRevokeTarget(null);
      loadLicenseAssignments();
    } catch { } finally {
      setRevokeLoading(false);
    }
  }

  async function handleResetViewPassword(id: string, adminEmail: string) {
    if (!confirm(`${adminEmail} kullanıcısının görüntüleme şifresi yenilenecek ve yeni şifre e-posta ile gönderilecek. Onaylıyor musunuz?`)) return;
    try {
      const res = await api.post<{ viewPassword: string; message: string }>(`/api/admin/license-assignments/${id}/reset-password`, {});
      setResetResults(prev => ({ ...prev, [id]: res.viewPassword }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Şifre yenilenemedi.");
    }
  }

  function copyResetPassword(id: string, pw: string) {
    navigator.clipboard.writeText(pw);
    setCopiedResetId(id);
    setTimeout(() => setCopiedResetId(null), 2000);
  }

  function showSuperAdminKey() {
    if (superAdminKeyTimer.current) clearTimeout(superAdminKeyTimer.current);
    if (superAdminKeyTick.current)  clearInterval(superAdminKeyTick.current);
    setSuperAdminKeyVisible(true);
    setSuperAdminKeyCountdown(15);
    superAdminKeyTick.current = setInterval(() => {
      setSuperAdminKeyCountdown(p => { if (p <= 1) { clearInterval(superAdminKeyTick.current!); return 0; } return p - 1; });
    }, 1000);
    superAdminKeyTimer.current = setTimeout(() => { setSuperAdminKeyVisible(false); setSuperAdminKeyCountdown(0); }, 15000);
  }

  async function handleRevealMyLicense() {
    if (!myViewPassword.trim()) { setMyViewError("Şifre boş olamaz."); return; }
    setMyViewLoading(true); setMyViewError("");
    try {
      const res = await api.post<{ licenseToken: string; issuer: string; notBefore: string; expiresAt: string; app: string }>("/api/admin/license-assignments/my-license", { password: myViewPassword });
      setMyLicense(res);
      if (myLicTimer.current) clearTimeout(myLicTimer.current);
      if (myLicTick.current)  clearInterval(myLicTick.current);
      setMyLicCountdown(15);
      myLicTick.current = setInterval(() => {
        setMyLicCountdown(p => { if (p <= 1) { clearInterval(myLicTick.current!); return 0; } return p - 1; });
      }, 1000);
      myLicTimer.current = setTimeout(() => { setMyLicense(null); setMyViewPassword(""); setMyLicCountdown(0); }, 15000);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setMyViewError(msg ?? "Geçersiz şifre.");
    } finally {
      setMyViewLoading(false);
    }
  }

  async function handleGenerateKeyPair() {
    setLicGenKeyPairLoading(true);
    setLicGenPubKey(null);
    setLicGenPrivKey("");
    setLicGenError("");
    setLicGenToken(null);
    try {
      const keyPair = await crypto.subtle.generateKey(
        { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true, ["sign", "verify"]
      );
      const privDer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
      const pubDer  = await crypto.subtle.exportKey("spki",  keyPair.publicKey);
      const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
      setLicGenPrivKey(toB64(privDer));
      setLicGenPubKey(toB64(pubDer));
    } catch (e) {
      setLicGenError(`Anahtar üretim hatası: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLicGenKeyPairLoading(false);
    }
  }

  async function handleGenerateLicense() {
    setLicGenError(""); setLicGenToken(null);
    if (!licGenPrivKey.trim()) { setLicGenError("Private key boş olamaz."); return; }
    setLicGenLoading(true);
    try {
      const keyB64 = licGenPrivKey.trim().replace(/\s/g, "");
      const keyBinary = atob(keyB64);
      const keyBuffer = new ArrayBuffer(keyBinary.length);
      const keyView = new Uint8Array(keyBuffer);
      for (let i = 0; i < keyBinary.length; i++) keyView[i] = keyBinary.charCodeAt(i);
      const cryptoKey = await crypto.subtle.importKey(
        "pkcs8", keyBuffer,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false, ["sign"]
      );
      const payloadObj: Record<string, string> = { app: "Ecom", iss: licGenIssuer, nbf: licGenNbf, exp: licGenExp };
      if (licGenHost.trim()) payloadObj.host = licGenHost.trim();
      const payload = JSON.stringify(payloadObj);
      const payloadBytes = new TextEncoder().encode(payload);
      const sigBytes = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, payloadBytes);
      const b64url = (arr: Uint8Array) => btoa(String.fromCharCode(...arr)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
      setLicGenToken(`${b64url(payloadBytes)}.${b64url(new Uint8Array(sigBytes))}`);
    } catch (e) {
      setLicGenError(`Hata: ${e instanceof Error ? e.message : String(e)} — Private key PKCS8 DER base64 formatında olmalı.`);
    } finally {
      setLicGenLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      await api.put("/api/admin/settings", {
        ...settings,
        AdminMenuOrder: JSON.stringify(menuOrder),
        AdminMenuConfig: JSON.stringify(menuGroupConfig),
        AdminRbacMatrix: JSON.stringify(rbacMatrix),
        AdminCustomRoles: JSON.stringify(customRoles),
      });
      // Kayıt sonrası DB'den yeniden yükle — kalıcılığı doğrular
      const fresh = await api.get<SiteSettings>("/api/admin/settings");
      setSettings({ ...DEFAULTS, ...fresh });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      window.dispatchEvent(new CustomEvent("ecom:settings-updated", { detail: fresh }));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Kaydedilemedi.");
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


  async function loadMailLogs(page = 1, status = mailLogsStatus, search = mailLogsSearch, template = mailLogsTemplate) {
    setMailLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "30" });
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      if (template) params.set("template", template);
      const data = await api.get<{ total: number; page: number; logs: MailLogEntry[] }>(`/api/admin/mail-logs?${params}`);
      setMailLogs(data.logs);
      setMailLogsTotal(data.total);
      setMailLogsPage(page);
    } catch { /* ignore */ }
    finally { setMailLogsLoading(false); }
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
          <CheckCircle size={16} /> {t("msg.saved", "Başarıyla kaydedildi")}
        </div>
      )}
      {saveError && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-lg cursor-pointer" onClick={() => setSaveError(null)}>
          <span>⚠</span> {saveError}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav./yonetim", "Yönetim")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("auto.sitePanelAyarlari", "Site, panel ve içerik ayarları")}</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {t("action.save", "Kaydet")}
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
            {TABS.map(tabItem => {
              const tabLabel: Record<string, string> = {
                genel:       t("settings.tab.genel", "Genel"),
                gorunum:     t("settings.tab.gorunum", "Görünüm"),
                sablon:      t("settings.tab.sablon", "Şablon"),
                kargo:       t("settings.tab.kargo", "Kargo"),
                menu:        t("settings.tab.menu", "Menü"),
                icerik:      t("settings.tab.icerikler", "İçerik"),
                chatbot:     t("settings.tab.chatbot", "Chatbot"),
                odeme:       t("settings.tab.odeme", "Ödeme"),
                mesajlar:    t("settings.tab.mesajlar", "Mesajlar"),
                mail:        t("settings.tab.mail", "Mail Log"),
                yetkiler:    t("settings.tab.yetkiler", "Yetkiler"),
                lisans:      t("settings.tab.lisans", "Lisans"),
                otomasyon:   t("settings.tab.otomasyon", "Otomasyon"),
                bildirimler: t("settings.tab.bildirim", "Bildirimler"),
                sistem:      t("settings.tab.sistem", "Sistem"),
              };
              return (
                <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap shrink-0 ${
                    tab === tabItem.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}>
                  {tabItem.icon} {tabLabel[tabItem.id] ?? tabItem.label}
                </button>
              );
            })}
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
          <Section title={t("settings.site", "Site Bilgileri")} icon={<Globe size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t("settings.siteName", "Site Adı")} hint="Müşteri sitesi tarayıcı sekmesi, başlık ve tüm sayfalarda görünür">
                <input value={settings.SiteName} onChange={e => set("SiteName", e.target.value)} className={inp} placeholder="Örn: Mağaza Adı" />
              </Field>
              <Field label={t("settings.adminTitle", "Admin Panel Başlığı")} hint="Admin paneli sol üst köşesi ve tarayıcı sekmesinde görünür">
                <input value={settings.AdminTitle} onChange={e => set("AdminTitle", e.target.value)} className={inp} placeholder="Örn: Yönetim Paneli" />
              </Field>
              <Field label={t("settings.currency", "Para Birimi")}>
                <select value={settings.Currency} onChange={e => set("Currency", e.target.value)} className={inp}>
                  <option value="TRY">{t("auto.currencyTRY", "TRY — Türk Lirası")}</option>
                  <option value="USD">{t("auto.currencyUSD", "USD — Amerikan Doları")}</option>
                  <option value="EUR">{t("auto.currencyEUR", "EUR — Euro")}</option>
                  <option value="GBP">{t("auto.currencyGBP", "GBP — İngiliz Sterlini")}</option>
                </select>
              </Field>
              <Field label={t("settings.taxRate", "KDV Oranı (%)")} hint="Varsayılan vergi oranı">
                <input type="number" value={settings.DefaultTaxRate} onChange={e => set("DefaultTaxRate", e.target.value)} className={inp} min="0" max="100" />
              </Field>
            </div>
          </Section>
          <Section title={t("settings.contact", "İletişim Bilgileri")} icon={<Settings size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t("settings.contactEmail", "İletişim E-postası")}>
                <input type="email" value={settings.ContactEmail} onChange={e => set("ContactEmail", e.target.value)} className={inp} placeholder="info@magaza.com" />
              </Field>
              <Field label={t("settings.contactPhone", "İletişim Telefonu")}>
                <input value={settings.ContactPhone} onChange={e => set("ContactPhone", e.target.value)} className={inp} placeholder="+90 532 000 00 00" />
              </Field>
            </div>
          </Section>
          <Section title={t("settings.social", "Sosyal Medya")} icon={<Share2 size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "Instagram", key: "SocialInstagram", ph: "https://instagram.com/magaza" },
                { label: "Twitter / X", key: "SocialTwitter", ph: "https://twitter.com/magaza" },
                { label: "Facebook", key: "SocialFacebook", ph: "https://facebook.com/magaza" },
                { label: "YouTube", key: "SocialYoutube", ph: "https://youtube.com/@magaza" },
                { label: "LinkedIn", key: "SocialLinkedin", ph: "https://linkedin.com/company/magaza" },
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

          {/* ── Logo Sistemi Kullanım Kılavuzu ── */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <ImageIcon size={14} />
              </div>
              <div>
                <p className="text-sm font-bold text-teal-900">{t("auto.logoSistemiNasil", "Logo Sistemi Nasıl Çalışır?")}</p>
                <p className="text-xs text-teal-700 mt-0.5 leading-relaxed">
                  {t("auto.logoSistemiAciklama", "Sistem iki mod arasında otomatik geçiş yapar:")} <strong>{t("auto.gorselLogo", "Görsel Logo")}</strong> {t("auto.yukledginizPng", "(yüklediğiniz PNG/JPG/SVG)")} {t("auto.veyaMetinLogo", "veya")} <strong>{t("auto.metinLogo", "Metin Logo")}</strong> {t("auto.siteAdinizYaziTipi", "(site adınız şık bir yazı tipinde).")}
                </p>
              </div>
            </div>

            {/* Öncelik akışı */}
            <div className="bg-white rounded-xl border border-teal-100 p-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("auto.musteriSitesiLogoPriority", "Müşteri Sitesi — Header Logo Öncelik Sırası")}</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{t("auto.isimliLogoYukluyse", "İsimli Logo yüklüyse → görsel gösterilir")}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5"><code className="bg-slate-100 px-1 rounded">CustomerLogoNamed</code> dolu ise bu resim header&apos;da öncelikli olarak görünür. En fazla 280 × 72 px alan kullanır.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-400 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{t("auto.isimliYoksaIsimsiz", "İsimli yoksa, İsimsiz Logo yüklüyse → o gösterilir")}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5"><code className="bg-slate-100 px-1 rounded">CustomerLogoIcon</code> dolu ise ikon resmi header&apos;da görünür.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-400 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{t("auto.herIkisiBossaMetin", "Her ikisi de boşsa → Metin Logo otomatik devreye girer")}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Site adınız (<code className="bg-slate-100 px-1 rounded">SiteName</code>) Pacifico yazı tipiyle logo gibi işlenir.
                      Üç ve daha fazla kelimeli adlarda son kelime vurgu rengiyle ayrı satırda gösterilir.
                      Örnek: <em className="text-teal-600">&quot;Neslinin Rengi&nbsp;<span className="text-orange-500">Atölyesi</span>&quot;</em>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tablo: alan → nerede kullanılır */}
            <div className="bg-white rounded-xl border border-teal-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("auto.alan", "Alan")}</th>
                    <th className="text-left px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Header</th>
                    <th className="text-left px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Footer</th>
                    <th className="text-left px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Favicon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr>
                    <td className="px-3 py-2 font-medium text-slate-700">{t("auto.musteriIsimliLogo", "Müşteri İsimli Logo")}</td>
                    <td className="px-3 py-2 text-teal-600">✓ {t("auto.oncelikli", "Öncelikli")}</td>
                    <td className="px-3 py-2 text-slate-400">—</td>
                    <td className="px-3 py-2 text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-slate-700">{t("auto.musteriIsimsizLogo", "Müşteri İsimsiz Logo")}</td>
                    <td className="px-3 py-2 text-teal-500">✓ {t("auto.yedek", "Yedek")}</td>
                    <td className="px-3 py-2 text-teal-600">✓ {t("auto.ikonKutusu", "İkon kutusu")}</td>
                    <td className="px-3 py-2 text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-slate-700">{t("auto.musteriFavicon", "Müşteri Favicon")}</td>
                    <td className="px-3 py-2 text-slate-400">—</td>
                    <td className="px-3 py-2 text-slate-400">—</td>
                    <td className="px-3 py-2 text-teal-600">✓ Sekme ikonu</td>
                  </tr>
                  <tr className="bg-orange-50">
                    <td className="px-3 py-2 font-medium text-slate-700">{t("auto.metinLogoOtomatik", "Metin Logo")} <span className="text-[10px] text-orange-500 font-normal">({t("auto.otomatik", "otomatik")})</span></td>
                    <td className="px-3 py-2 text-orange-500">✓ {t("auto.ikisiBossa", "İkisi de boşsa")}</td>
                    <td className="px-3 py-2 text-orange-500">✓ {t("auto.herZaman", "Her zaman")}</td>
                    <td className="px-3 py-2 text-slate-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Admin sidebar notu */}
            <div className="bg-white rounded-xl border border-teal-100 p-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("auto.adminPaneliSidebarLogo", "Admin Paneli — Sidebar Logo")}</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-400 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">◀</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{t("auto.daraltilmisSidebar", "Daraltılmış sidebar → her zaman Admin İsimsiz Logo ikonu")}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5"><code className="bg-slate-100 px-1 rounded">AdminLogoIcon</code> boşsa <code className="bg-slate-100 px-1 rounded">/logo-icon.svg</code> gösterilir.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">▶</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{t("auto.genisletilmisIsimliYukluyse", "Genişletilmiş + Admin İsimli Logo yüklüyse → görsel")}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5"><code className="bg-slate-100 px-1 rounded">AdminLogoNamed</code> dolu olduğunda tam logo görseli gösterilir.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-400 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">▶</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{t("auto.genisletilmisIsimliBosMetnLogo", "Genişletilmiş + İsimli Logo boşsa → Metin Logo")}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Site adı Inter Bold yazı tipiyle beyaz renkte, 3+ kelimeli adlarda son kelime teal vurguyla alt satırda gösterilir.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-teal-600 bg-teal-100 rounded-xl px-3 py-2">
              <span>💡</span>
              <span>
                <strong>{t("auto.metinLogoyaGecmekIcin", "Metin logoya geçmek için:")}</strong> {t("auto.metinLogoyaGecAciklama", "Müşteri İsimli Logo ve İsimsiz Logo alanlarını boşaltın (URL'yi silin + Kaydet). Site adınız otomatik olarak Pacifico yazı tipiyle logo gibi görünecektir.")}
              </span>
            </div>
          </div>

          {/* Admin Panel Görselleri */}
          <Section title={t("auto.adminPanelGorselleri", "Admin Panel Görselleri")} icon={<ImageIcon size={16} />}
            subtitle={t("auto.adminPanelGorselleriAciklama", "Admin panelinin sidebar'ında ve tarayıcı sekmesinde görünen görseller.")}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* İsimli Logo */}
              {(() => {
                const key = "AdminLogoNamed";
                const busy = uploadingKey === key;
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">{t("auto.isimliLogo", "İsimli Logo")}</p>
                    <p className="text-[11px] text-slate-400">{t("auto.isimliLogoAciklama", "Marka adı içeren tam logo (sidebar genişken).")}</p>
                    <div className="h-36 rounded-xl bg-[#1c2044] border border-slate-200 flex items-center justify-center overflow-hidden px-4">
                      {settings[key]
                        ? <img src={settings[key]} alt="İsimli Logo" className="max-h-full max-w-full object-contain" /> // eslint-disable-line
                        : <span className="text-slate-500 text-xs">{t("msg.loadFailed", "Yüklenemedi.")}</span>}
                    </div>
                    <input ref={adminLogoNamedRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadFor(e.target.files[0], key)} />
                    <div className="flex gap-2">
                      <button onClick={() => adminLogoNamedRef.current?.click()} disabled={busy}
                        className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition flex-1 justify-center">
                        {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {busy ? t("action.loading", "Yükleniyor...") : t("action.upload", "Yükle")}
                      </button>
                      {settings[key] && (
                        <button onClick={() => set(key, "")}
                          className="flex items-center gap-1 text-xs border border-red-200 text-red-500 rounded-xl px-3 py-2 hover:bg-red-50 transition">
                          <Trash2 size={12} /> {t("action.delete", "Sil")}
                        </button>
                      )}
                    </div>
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
                    <p className="text-xs font-bold text-slate-700">{t("auto.isimsizLogo", "İsimsiz Logo")}</p>
                    <p className="text-[11px] text-slate-400">{t("auto.isimsizLogoAciklama", "Sadece ikon (sidebar daraltılmışken).")}</p>
                    <div className="h-36 rounded-xl bg-[#1c2044] border border-slate-200 flex items-center justify-center overflow-hidden">
                      {settings[key]
                        ? <img src={settings[key]} alt="İsimsiz Logo" className="w-24 h-24 object-contain" /> // eslint-disable-line
                        : <span className="text-slate-500 text-xs">{t("msg.loadFailed", "Yüklenemedi.")}</span>}
                    </div>
                    <input ref={adminLogoIconRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadFor(e.target.files[0], key)} />
                    <div className="flex gap-2">
                      <button onClick={() => adminLogoIconRef.current?.click()} disabled={busy}
                        className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition flex-1 justify-center">
                        {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {busy ? t("action.loading", "Yükleniyor...") : t("action.upload", "Yükle")}
                      </button>
                      {settings[key] && (
                        <button onClick={() => set(key, "")}
                          className="flex items-center gap-1 text-xs border border-red-200 text-red-500 rounded-xl px-3 py-2 hover:bg-red-50 transition">
                          <Trash2 size={12} /> {t("action.delete", "Sil")}
                        </button>
                      )}
                    </div>
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
                const title = settings.AdminTitle || "Admin Panel";
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">Favicon</p>
                    <p className="text-[11px] text-slate-400">{t("auto.adminFaviconAciklama", "Admin paneli tarayıcı sekmesi ikonu.")}</p>
                    {/* Büyük önizleme */}
                    <div className="h-44 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                      {settings[key]
                        ? <img src={settings[key]} alt="Favicon" className="w-32 h-32 object-contain" /> // eslint-disable-line
                        : <Globe size={48} className="text-slate-300" />}
                    </div>
                    {/* Sekme simülasyonu */}
                    {settings[key] && (
                      <div className="flex items-center gap-1.5 bg-slate-200 rounded-t-lg px-2 py-1.5 w-fit max-w-full">
                        <img src={settings[key]} alt="" className="w-3.5 h-3.5 object-contain shrink-0" /> {/* eslint-disable-line */}
                        <span className="text-[10px] text-slate-600 truncate max-w-[100px]">{title}</span>
                        <span className="text-slate-400 ml-0.5 text-[10px]">×</span>
                      </div>
                    )}
                    <input ref={adminFaviconRef} type="file" accept="image/*,image/x-icon,image/vnd.microsoft.icon,.ico" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadFor(e.target.files[0], key)} />
                    <button type="button" onClick={() => adminFaviconRef.current?.click()} disabled={busy}
                      className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition w-full justify-center">
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {busy ? t("action.loading", "Yükleniyor...") : t("action.upload", "Yükle")}
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
          <Section title={t("auto.musteriSitesiGorselleri", "Müşteri Sitesi Görselleri")} icon={<ImageIcon size={16} />}
            subtitle={t("auto.musteriSitesiGorselleriAciklama", "Müşteri mağazasının header'ında ve tarayıcı sekmesinde görünen görseller.")}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* İsimli Logo */}
              {(() => {
                const key = "CustomerLogoNamed";
                const busy = uploadingKey === key;
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">{t("auto.isimliLogo", "İsimli Logo")}</p>
                    <p className="text-[11px] text-slate-400">{t("auto.isimliLogoMusteriAciklama", "Marka adı dahil tam logo (header'da öncelikli).")}</p>
                    <div className="h-36 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden px-4">
                      {settings[key]
                        ? <img src={settings[key]} alt="İsimli Logo" className="max-h-full max-w-full object-contain" /> // eslint-disable-line
                        : <span className="text-slate-400 text-xs">{t("msg.loadFailed", "Yüklenemedi.")}</span>}
                    </div>
                    <input ref={customerLogoNamedRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadFor(e.target.files[0], key)} />
                    <div className="flex gap-2">
                      <button onClick={() => customerLogoNamedRef.current?.click()} disabled={busy}
                        className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition flex-1 justify-center">
                        {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {busy ? t("action.loading", "Yükleniyor...") : t("action.upload", "Yükle")}
                      </button>
                      {settings[key] && (
                        <button onClick={() => set(key, "")}
                          className="flex items-center gap-1 text-xs border border-red-200 text-red-500 rounded-xl px-3 py-2 hover:bg-red-50 transition">
                          <Trash2 size={12} /> {t("action.delete", "Sil")}
                        </button>
                      )}
                    </div>
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
                    <p className="text-xs font-bold text-slate-700">{t("auto.isimsizLogo", "İsimsiz Logo")}</p>
                    <p className="text-[11px] text-slate-400">{t("auto.isimsizLogoMusteriAciklama", "Sadece marka ikonu / sembolü.")}</p>
                    <div className="h-36 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                      {settings[key]
                        ? <img src={settings[key]} alt="İsimsiz Logo" className="w-24 h-24 object-contain" /> // eslint-disable-line
                        : <span className="text-slate-400 text-xs">{t("msg.loadFailed", "Yüklenemedi.")}</span>}
                    </div>
                    <input ref={customerLogoIconRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadFor(e.target.files[0], key)} />
                    <div className="flex gap-2">
                      <button onClick={() => customerLogoIconRef.current?.click()} disabled={busy}
                        className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition flex-1 justify-center">
                        {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {busy ? t("action.loading", "Yükleniyor...") : t("action.upload", "Yükle")}
                      </button>
                      {settings[key] && (
                        <button onClick={() => set(key, "")}
                          className="flex items-center gap-1 text-xs border border-red-200 text-red-500 rounded-xl px-3 py-2 hover:bg-red-50 transition">
                          <Trash2 size={12} /> {t("action.delete", "Sil")}
                        </button>
                      )}
                    </div>
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
                const siteName = settings.SiteName || "";
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">Favicon</p>
                    <p className="text-[11px] text-slate-400">{t("auto.musteriFaviconAciklama", "Müşteri sitesi tarayıcı sekmesi ikonu.")}</p>
                    {/* Büyük önizleme */}
                    <div className="h-44 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                      {settings[key]
                        ? <img src={settings[key]} alt="Favicon" className="w-32 h-32 object-contain" /> // eslint-disable-line
                        : <Globe size={48} className="text-slate-300" />}
                    </div>
                    {/* Sekme simülasyonu */}
                    {settings[key] && (
                      <div className="flex items-center gap-1.5 bg-slate-200 rounded-t-lg px-2 py-1.5 w-fit max-w-full">
                        <img src={settings[key]} alt="" className="w-3.5 h-3.5 object-contain shrink-0" /> {/* eslint-disable-line */}
                        <span className="text-[10px] text-slate-600 truncate max-w-[100px]">{siteName}</span>
                        <span className="text-slate-400 ml-0.5 text-[10px]">×</span>
                      </div>
                    )}
                    <input ref={customerFaviconRef} type="file" accept="image/*,image/x-icon,image/vnd.microsoft.icon,.ico" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadFor(e.target.files[0], key)} />
                    <button type="button" onClick={() => customerFaviconRef.current?.click()} disabled={busy}
                      className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 transition w-full justify-center">
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {busy ? t("action.loading", "Yükleniyor...") : t("action.upload", "Yükle")}
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
          <Section title={t("auto.temaOnAyarlari", "Tema Ön Ayarları")} icon={<Palette size={16} />}>
            <p className="text-xs text-slate-500 mb-3">{t("auto.hazirTemaPaketleri", "Hazır tema paketlerinden birini seçerek tüm renkleri tek seferde uygulayın.")}</p>
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

          <Section title={t("auto.musteriSitesiRenkleri", "Müşteri Sitesi Renkleri")} icon={<Palette size={16} />}>
            {/* Canlı kontrast önizlemesi */}
            {(() => {
              const bg   = settings.CustomerBgColor   || "#F7FAFA";
              const text = settings.CustomerTextColor || "#1c2044";
              const ratio = getContrastRatio(bg, text);
              const ok = ratio >= 4.5;
              const aa = ratio >= 3;
              return (
                <div className="mb-4 rounded-xl border overflow-hidden" style={{ borderColor: ok ? "#bbf7d0" : aa ? "#fde68a" : "#fca5a5" }}>
                  <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: bg }}>
                    <span className="text-sm font-semibold" style={{ color: text }}>{t("auto.ornekSayfaMetni", "Örnek Sayfa Metni")}</span>
                    <span className="text-xs opacity-60" style={{ color: text }}>Aa 123</span>
                  </div>
                  <div className={`px-3 py-1.5 text-[11px] font-medium flex items-center gap-2 ${ok ? "bg-green-50 text-green-700" : aa ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                    <span>{ok ? "✓" : aa ? "⚠" : "✗"}</span>
                    <span>{t("auto.kontrastOrani", "Kontrast oranı:")} {ratio.toFixed(1)}:1 — {ok ? t("auto.wcagAAAGece", "WCAG AA/AAA geçer") : aa ? t("auto.yalnızcaBuyukMetin", "Yalnızca büyük metin için yeterli") : t("auto.kontrastYetersiz", "Kontrast yetersiz — yazı görünmeyebilir")}</span>
                  </div>
                </div>
              );
            })()}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: t("auto.birincilRenkButon", "Birincil Renk (Butonlar, linkler)"), key: "PrimaryColor", default: "#0d9488" },
                { label: t("auto.vurguRenkiRozet", "Vurgu Rengi (Rozetler, öne çıkan)"), key: "AccentColor", default: "#7c3aed" },
                { label: t("auto.arkaplanRengi", "Arka Plan Rengi"), key: "CustomerBgColor", default: "#F7FAFA" },
                { label: t("auto.yaziRengi", "Yazı Rengi"), key: "CustomerTextColor", default: "#1c2044" },
                { label: t("auto.kartIcerikArkaplan", "Kart / İçerik Arka Planı"), key: "CustomerCardBgColor", default: "#ffffff" },
                { label: t("auto.headerArkaplan", "Header Arka Planı"), key: "CustomerHeaderBgColor", default: "#ffffff" },
                { label: t("auto.kenarlikBorderRengi", "Kenarlık / Border Rengi"), key: "CustomerBorderColor", default: "#ccfbf1" },
                { label: t("auto.butonYaziRengi", "Buton Yazı Rengi"), key: "CustomerButtonTextColor", default: "#ffffff" },
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

          <Section title={t("auto.adminPanelRenkleri", "Admin Panel Renkleri")} icon={<Palette size={16} />}>
            {/* Sidebar önizlemesi */}
            {(() => {
              const sidebar  = settings.AdminSidebarColor  || "#1c2044";
              const primary  = settings.AdminPrimaryColor  || "#0d9488";
              const ratio    = getContrastRatio(sidebar, "#ffffff");
              const ok       = ratio >= 4.5;
              return (
                <div className="mb-4 rounded-xl border overflow-hidden" style={{ borderColor: ok ? "#bbf7d0" : "#fca5a5" }}>
                  <div className="px-3 py-2 flex items-center gap-3" style={{ backgroundColor: sidebar }}>
                    <span className="text-sm font-bold text-white">Sidebar</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: primary, color: "#fff" }}>Birincil</span>
                  </div>
                  <div className={`px-3 py-1.5 text-[11px] font-medium flex items-center gap-2 ${ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    <span>{ok ? "✓" : "✗"}</span>
                    <span>{t("auto.sidebarKontrastOrani", "Sidebar ↔ Beyaz metin kontrastı:")} {ratio.toFixed(1)}:1 — {ok ? t("auto.okunabilir", "Okunabilir") : t("auto.yazilarGorunmeyebilir", "Yazılar görünmeyebilir")}</span>
                  </div>
                </div>
              );
            })()}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t("auto.sidebarRengi", "Sidebar Rengi"), key: "AdminSidebarColor", default: "#1c2044" },
                { label: t("auto.birincilRenk", "Birincil Renk"), key: "AdminPrimaryColor", default: "#0d9488" },
                { label: t("auto.vurguRengi", "Vurgu Rengi"), key: "AdminAccentColor", default: "#7c3aed" },
                { label: t("auto.icerikArkaplan", "İçerik Arka Planı"), key: "AdminBgColor", default: "#f8fafc" },
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

          <Section title={t("settings.fonts", "Yazı Tipi & Boyutu")} icon={<Palette size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer font */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> {t("auto.musteriSitesi", "Müşteri Sitesi")}
                </p>
                <Field label={t("auto.yaziTipi", "Yazı Tipi")}>
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
                <Field label={t("auto.yaziBoyutu", "Yazı Boyutu")}>
                  <select value={settings.CustomerFontSize || "base"} onChange={e => set("CustomerFontSize", e.target.value)} className={inp}>
                    <option value="sm">{t("auto.kucukSm", "Küçük (sm) — 14px temel")}</option>
                    <option value="base">{t("auto.normalBase", "Normal (base) — 16px temel")}</option>
                    <option value="lg">{t("auto.buyukLg", "Büyük (lg) — 18px temel")}</option>
                    <option value="xl">{t("auto.cokBuyukXl", "Çok Büyük (xl) — 20px temel")}</option>
                  </select>
                </Field>
                {/* Preview */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">{t("auto.onizleme", "Önizleme")}</p>
                  <div style={{ fontFamily: `"${settings.CustomerFontFamily || "Inter"}", sans-serif` }}>
                    <p className="text-lg font-bold mb-1" style={{ color: settings.PrimaryColor || "#0d9488" }}>{t("auto.baslikMetni", "Başlık Metni")}</p>
                    <p className="text-sm text-slate-600">{t("auto.normalParagrafMetni", "Normal paragraf metni. Ürün açıklamaları ve sayfa içerikleri bu fontla görünür.")}</p>
                    <p className="text-xs mt-2" style={{ color: settings.AccentColor || "#7c3aed" }}>{t("auto.vurguMetniRozetler", "Vurgu metni ve rozetler")}</p>
                  </div>
                </div>
              </div>
              {/* Admin font */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> {t("auto.adminPanel", "Admin Panel")}
                </p>
                <Field label={t("auto.yaziTipi", "Yazı Tipi")}>
                  <select value={settings.AdminFontFamily || "Inter"} onChange={e => set("AdminFontFamily", e.target.value)} className={inp}>
                    {FONT_OPTIONS.filter(f => f.category === "Sans-serif").map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    <option disabled>— Serif —</option>
                    {FONT_OPTIONS.filter(f => f.category === "Serif").map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    <option disabled>— Monospace —</option>
                    {FONT_OPTIONS.filter(f => f.category === "Monospace").map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </Field>
                <Field label={t("auto.yaziBoyutu", "Yazı Boyutu")}>
                  <select value={settings.AdminFontSize || "base"} onChange={e => set("AdminFontSize", e.target.value)} className={inp}>
                    <option value="sm">{t("auto.kucukSm", "Küçük (sm) — 14px temel")}</option>
                    <option value="base">{t("auto.normalBase", "Normal (base) — 16px temel")}</option>
                    <option value="lg">{t("auto.buyukLg", "Büyük (lg) — 18px temel")}</option>
                    <option value="xl">{t("auto.cokBuyukXl", "Çok Büyük (xl) — 20px temel")}</option>
                  </select>
                </Field>
                {/* Preview */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">{t("auto.onizleme", "Önizleme")}</p>
                  <div style={{ fontFamily: `"${settings.AdminFontFamily || "Inter"}", sans-serif` }}>
                    <p className="text-lg font-bold mb-1" style={{ color: settings.AdminPrimaryColor || "#0d9488" }}>{t("auto.panelBasligi", "Panel Başlığı")}</p>
                    <p className="text-sm text-slate-600">{t("auto.dashboardFontKullanilir", "Dashboard ve yönetim ekranlarında bu font kullanılır.")}</p>
                    <p className="text-xs mt-2 font-mono" style={{ color: settings.AdminAccentColor || "#7c3aed" }}>{t("auto.badgeEtiketUyari", "BADGE · ETİKET · UYARI")}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              {t("auto.fontRenkKaydetSonraUygula", "Font ve renk değişiklikleri kaydedildikten sonra sayfa yenilenince tam olarak uygulanır.")}
            </div>
          </Section>
        </div>
      )}

      {/* ── Şablon ── */}
      {tab === "sablon" && (
        <div className="space-y-5">
          <Section title={t("auto.musteriSitesiSablon", "Müşteri Sitesi Şablonu")} icon={<Layers size={16} />}>
            <p className="text-xs text-slate-500 mb-5">
              {t("auto.sablonAciklama", "Şablon, müşteri sitesinin genel yerleşimini, başlık stilini, köşe yuvarlaklığını ve arka plan renklerini belirler. Görünüm sekmesindeki renk ve font özelleştirmeleri seçtiğiniz şablonun üzerine uygulanır.")}
            </p>
            {/* Template list with paging + hide/show */}
            {(() => {
              const disabledIds = new Set((settings.DisabledTemplates || "").split(",").map(s => s.trim()).filter(Boolean));
              const activeId = settings.CustomerTemplate || "spareparts";
              const toggleDisabled = (id: string) => {
                const ids = new Set(disabledIds);
                if (ids.has(id)) ids.delete(id); else ids.add(id);
                set("DisabledTemplates", [...ids].join(","));
              };
              const baseTemplates = showHiddenTmpls
                ? [...TEMPLATES]
                : [...TEMPLATES].filter(t => !disabledIds.has(t.id));
              const visibleTemplates = tmplFilter
                ? baseTemplates.filter(t =>
                    t.name.toLowerCase().includes(tmplFilter.toLowerCase()) ||
                    t.tags.some(tag => tag.toLowerCase().includes(tmplFilter.toLowerCase())) ||
                    t.description.toLowerCase().includes(tmplFilter.toLowerCase())
                  )
                : baseTemplates;
              const totalPages = tmplPerPage === 0 ? 1 : Math.ceil(visibleTemplates.length / tmplPerPage);
              const pageTmpls = tmplPerPage === 0 ? visibleTemplates : visibleTemplates.slice(tmplPage * tmplPerPage, tmplPage * tmplPerPage + tmplPerPage);
              const hiddenCount = disabledIds.size;

              return (
                <>
                  {/* Paging controls top */}
                  <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      {/* Arama input */}
                      <div className="relative">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={tmplFilter}
                          onChange={e => { setTmplFilter(e.target.value); setTmplPage(0); }}
                          placeholder="Şablon ara..."
                          className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-36 bg-white"
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        {visibleTemplates.length} {t("auto.sablonVar", "şablon")} · {t("auto.sayfaGosteriliyor", "sayfa")} {Math.min(tmplPage + 1, totalPages)}/{totalPages}
                      </p>
                      {hiddenCount > 0 && (
                        <button
                          onClick={() => setShowHiddenTmpls(v => !v)}
                          className={`text-xs px-2.5 py-1 rounded-xl border transition-colors flex items-center gap-1 ${
                            showHiddenTmpls ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          {showHiddenTmpls ? "🙈" : "👁"} {hiddenCount} {t("auto.gizliSablon", "gizli şablon")}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{t("auto.sayfadaGoster", "Sayfada göster:")}</span>
                      {([6, 9, 12, 18, 0] as const).map(n => (
                        <button
                          key={n}
                          onClick={() => { setTmplPerPage(n); setTmplPage(0); }}
                          className={`text-xs px-2 py-1 rounded-xl border transition-colors ${
                            tmplPerPage === n
                              ? "bg-teal-500 text-white border-teal-500"
                              : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                          }`}
                        >{n === 0 ? t("auto.tmumu", "Tümü") : n}</button>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable grid */}
                  <div className="overflow-y-auto" style={{ maxHeight: tmplPerPage === 0 ? undefined : "640px" }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pageTmpls.map(tmpl => {
                        const isActive = activeId === tmpl.id;
                        const isDisabled = disabledIds.has(tmpl.id);
                        return (
                          <div key={tmpl.id} className={`relative rounded-2xl border-2 transition-all overflow-hidden ${
                            isActive ? "border-teal-500 ring-2 ring-teal-200 shadow-lg shadow-teal-100/50"
                            : isDisabled ? "border-slate-200 opacity-50"
                            : "border-slate-200 hover:border-teal-300 hover:shadow-md"
                          }`}>
                            {/* SVG Mockup — clickable only if not disabled */}
                            <button
                              className="w-full text-left group"
                              onClick={() => { if (!isDisabled) set("CustomerTemplate", tmpl.id); }}
                              disabled={isDisabled}
                            >
                              <div className="relative w-full bg-slate-100" style={{ paddingBottom: "62%" }}>
                                <div className="absolute inset-0">
                                  <TemplatePreview tmpl={tmpl} siteName={settings.SiteName} />
                                </div>
                                {isActive && (
                                  <div className="absolute top-2 right-2 bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                    ✓ {t("status.active", "Aktif")}
                                  </div>
                                )}
                                {isDisabled && (
                                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold bg-slate-700/80 px-3 py-1 rounded-full">Gizli</span>
                                  </div>
                                )}
                              </div>
                            </button>

                            {/* Card info */}
                            <div className={`p-3.5 border-t ${isActive ? "border-teal-100 bg-teal-50/50" : isDisabled ? "border-slate-100 bg-slate-50" : "border-slate-100 bg-white"}`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg leading-none">{tmpl.emoji}</span>
                                  <span className="font-bold text-sm text-slate-800">{tmpl.name}</span>
                                </div>
                                {!isActive && (
                                  <button
                                    onClick={() => toggleDisabled(tmpl.id)}
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors shrink-0 ${
                                      isDisabled
                                        ? "border-teal-300 text-teal-600 hover:bg-teal-50"
                                        : "border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                                    }`}
                                    title={isDisabled ? "Şablonu göster" : "Şablonu gizle"}
                                  >{isDisabled ? "Göster" : "Gizle"}</button>
                                )}
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
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pagination nav */}
                  {tmplPerPage > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 mt-4">
                      <button
                        onClick={() => setTmplPage(p => Math.max(0, p - 1))}
                        disabled={tmplPage === 0}
                        className="px-3 py-1.5 text-xs rounded border border-slate-200 disabled:opacity-40 hover:border-teal-300 transition-colors"
                      >‹ {t("auto.onceki", "Önceki")}</button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setTmplPage(i)}
                          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                            tmplPage === i ? "bg-teal-500 text-white border-teal-500" : "border-slate-200 hover:border-teal-300"
                          }`}
                        >{i + 1}</button>
                      ))}
                      <button
                        onClick={() => setTmplPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={tmplPage >= totalPages - 1}
                        className="px-3 py-1.5 text-xs rounded border border-slate-200 disabled:opacity-40 hover:border-teal-300 transition-colors"
                      >{t("auto.sonraki", "Sonraki")} ›</button>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="mt-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
              <p className="text-xs text-amber-800">
                <strong>{t("auto.not", "Not:")}</strong> {t("auto.sablonDegisiklikNot", "Şablon değişikliği kaydedildikten sonra müşteri sitesinin yenilenmesi gerekebilir (Next.js cache). Koyu tema şablonunda bazı bileşenler henüz tam uyumlu olmayabilir — zamanla iyileştirilecektir.")}
              </p>
            </div>
          </Section>

          {/* Canlı Önizleme */}
          <Section title={t("auto.sablonKarsilastirma", "Şablon Karşılaştırması")} icon={<Eye size={16} />}>
            {(() => {
              const CMP_ROWS = [
                { name: "✨ Modern",                 card: "Yuvarlak + gölge",       grid: "4 sütun",  header: "Beyaz",                   use: "Genel amaçlı" },
                { name: "◻️ Minimalist",             card: "Sade + ince kenarlık",   grid: "4 sütun",  header: "Beyaz/düz",               use: "Moda, tasarım, Apple" },
                { name: "💪 Güçlü",                  card: "Pill şekil",             grid: "4 sütun",  header: "Renkli (teal)",           use: "Spor, kampanya" },
                { name: "🌙 Koyu Tema",               card: "Koyu + mavi vurgu",     grid: "4 sütun",  header: "Gece mavisi",             use: "Gaming, müzik, tech" },
                { name: "🖼️ Vitrin",                 card: "Çok uzun görsel",        grid: "2 sütun",  header: "Beyaz",                   use: "Lüks, moda, koleksiyon" },
                { name: "👑 Lüks",                   card: "Altın kenarlık",         grid: "3 sütun",  header: "2 satır + ortalı",        use: "Butik, mücevher" },
                { name: "⚡ Spor",                   card: "Sert köşe + turuncu",    grid: "5 sütun",  header: "Tam genişlik/koyu",       use: "Spor, outdoor" },
                { name: "🕰️ Retro",                  card: "Kalın kenarlık offset",  grid: "2 sütun",  header: "Sarı/sıcak",             use: "Vintage, el yapımı" },
                { name: "📸 Instagram",              card: "Kare + hover overlay",   grid: "3 sütun",  header: "İnce/beyaz",              use: "Görsel ürünler" },
                { name: "🧱 Masonry",                card: "Değişken yükseklik",     grid: "CSS col.", header: "Doğal/beyaz",             use: "El yapımı, sanat" },
                { name: "🏗️ Brutalist",              card: "Siyah çerçeve + offset", grid: "3 sütun",  header: "Siyah çizgili",           use: "Tasarım, mimari" },
                { name: "🫧 Cam Efekti",             card: "Buzlu cam",              grid: "4 sütun",  header: "Şeffaf blur",             use: "Tech, ajans, lüks" },
                { name: "🌆 Neon",                   card: "Mor ışıltılı çerçeve",   grid: "4 sütun",  header: "Siyah/neon",              use: "Gaming, müzik, gece" },
                { name: "🎨 Pastel",                 card: "Her kart farklı renk",   grid: "4 sütun",  header: "Pembe/yumuşak",           use: "Çocuk, hediye, kozmetik" },
                { name: "🛒 Katalog",                card: "Sade + Amazon stili",    grid: "5 sütun",  header: "Koyu + sarı arama",       use: "Market, toptan" },
                { name: "🚗 Otomotiv",               card: "Koyu kart + gölge",      grid: "3 sütun",  header: "Derin koyu",              use: "Araç, yedek parça" },
                { name: "📡 Telekomünikasyon",       card: "Beyaz + mavi vurgu",     grid: "4 sütun",  header: "Lacivert",                use: "Telekom, teknoloji" },
                { name: "🏭 Üretim & Sanayi",        card: "Sade + siyah/turuncu",   grid: "4 sütun",  header: "Siyah endüstriyel",       use: "Makine, ekipman" },
                { name: "🎓 Eğitim",                 card: "Yuvarlak + mavi",        grid: "4 sütun",  header: "Akademik mavi",           use: "Kurs, kitap, eğitim" },
                { name: "⚖️ Hukuk & Danışmanlık",   card: "Resmi + altın",          grid: "3 sütun",  header: "Lacivert/ortalı",         use: "Hukuk, danışmanlık" },
                { name: "🏥 Sağlık & Medikal",       card: "Temiz + yeşil vurgu",    grid: "4 sütun",  header: "Medikal yeşil",           use: "Eczane, klinik" },
                { name: "🔧 Yedek Parça / Oto",      card: "Sade + turuncu",         grid: "4 sütun",  header: "Koyu + turuncu",          use: "Yedek parça, oto aksesuar, B2B" },
                { name: "🛍️ Pazar Yeri",             card: "Kompakt + gölge",        grid: "5 sütun",  header: "Turuncu tam genişlik",    use: "Çok kategorili platform" },
                { name: "💻 Elektronik Mağaza",      card: "Sade + kırmızı",         grid: "4 sütun",  header: "Kırmızı",                 use: "Elektronik, bilgisayar, teknoloji" },
              ];
              const perPageOpts = [6, 8, 12, 0];
              const filteredCmpRows = cmpFilter
                ? CMP_ROWS.filter(r =>
                    r.name.toLowerCase().includes(cmpFilter.toLowerCase()) ||
                    r.use.toLowerCase().includes(cmpFilter.toLowerCase()) ||
                    r.card.toLowerCase().includes(cmpFilter.toLowerCase())
                  )
                : CMP_ROWS;
              const totalCmpPages = cmpPerPage === 0 ? 1 : Math.ceil(filteredCmpRows.length / cmpPerPage);
              const visibleRows = cmpPerPage === 0 ? filteredCmpRows : filteredCmpRows.slice((cmpPage - 1) * cmpPerPage, cmpPage * cmpPerPage);
              return (
                <>
                  <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={cmpFilter}
                          onChange={e => { setCmpFilter(e.target.value); setCmpPage(1); }}
                          placeholder="Şablon, kullanım veya kart ara..."
                          className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 w-52 bg-white"
                        />
                      </div>
                      <p className="text-xs text-slate-500">{filteredCmpRows.length} {t("auto.sablonVar", "şablon")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{t("table.perPage", "Sayfa başı:")}</span>
                      {perPageOpts.map(n => (
                        <button key={n} onClick={() => { setCmpPerPage(n); setCmpPage(1); }}
                          className={`px-2 py-1 rounded-xl text-xs font-medium border transition ${cmpPerPage === n ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"}`}>
                          {n === 0 ? t("filter.all", "Tümü") : n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto" style={{ maxHeight: cmpPerPage === 0 ? "480px" : undefined, overflowY: cmpPerPage === 0 ? "auto" : undefined }}>
                    <table className="w-full text-xs border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50">
                          <th className="text-left p-2 font-semibold text-slate-600 border border-slate-200">{t("auto.sablon", "Şablon")}</th>
                          <th className="text-left p-2 font-semibold text-slate-600 border border-slate-200">{t("auto.kartTipi", "Kart Tipi")}</th>
                          <th className="text-left p-2 font-semibold text-slate-600 border border-slate-200">{t("auto.izgara", "Izgara")}</th>
                          <th className="text-left p-2 font-semibold text-slate-600 border border-slate-200">{t("auto.baslik", "Başlık")}</th>
                          <th className="text-left p-2 font-semibold text-slate-600 border border-slate-200">{t("auto.uygunKullanim", "Uygun Kullanım")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.map((row, i) => (
                          <tr key={row.name} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
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
                  {totalCmpPages > 1 && (
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-slate-500">{(cmpPage - 1) * cmpPerPage + 1}–{Math.min(cmpPage * cmpPerPage, filteredCmpRows.length)} / {filteredCmpRows.length}</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setCmpPage(p => Math.max(1, p - 1))} disabled={cmpPage <= 1}
                          className="px-3 py-1 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition">
                          ←
                        </button>
                        <span className="text-xs text-slate-600 font-medium px-1">{cmpPage} / {totalCmpPages}</span>
                        <button onClick={() => setCmpPage(p => Math.min(totalCmpPages, p + 1))} disabled={cmpPage >= totalCmpPages}
                          className="px-3 py-1 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition">
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </Section>

          {/* ── Şablon İçerik Editörü ── */}
          <Section title="Şablon İçerik" icon={<FileText size={16} />}>
            <p className="text-xs text-slate-500 mb-4">
              Her şablonun anasayfasındaki statik içerikleri düzenleyin. Boş bırakılan alanlar varsayılan değerleri kullanır.
              {settings.CustomerTemplate && <span> Aktif şablon: <strong>{settings.CustomerTemplate}</strong></span>}
            </p>
            {(
              [
                { key: "default",     label: "🏪 Genel Şablonlar",   sub: "modern, minimal, bold, dark ve diğerleri", color: "text-slate-700"  },
                { key: "spareparts",  label: "🔧 Yedek Parça",        sub: "Oto yedek parça şablonu",                  color: "text-orange-700" },
                { key: "marketplace", label: "⚡ Pazar Yeri",          sub: "Trendyol / Hepsiburada tarzı",             color: "text-orange-600" },
                { key: "techstore",   label: "💻 Elektronik Mağaza",  sub: "MediaMarkt / Vatan tarzı",                 color: "text-red-700"    },
              ] as const
            ).map(({ key, label, sub, color }) => {
              const isActive = settings.CustomerTemplate === key ||
                (key === "default" && !["spareparts","marketplace","techstore"].includes(settings.CustomerTemplate || "modern"));
              const isOpen = openTmplSection === key;
              return (
                <div key={key} className={`border rounded-xl overflow-hidden mb-3 transition-all ${isActive ? "border-teal-300 bg-teal-50/30" : "border-slate-200"}`}>
                  <button type="button" onClick={() => setOpenTmplSection(isOpen ? null : key)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${color}`}>{label}</span>
                      <span className="text-xs text-slate-400 hidden sm:inline">{sub}</span>
                      {isActive && <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">Aktif</span>}
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-slate-100">

                      {/* ── GENEL ŞABLONLAR ── */}
                      {key === "default" && (
                        <div className="space-y-4 pt-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-2">Avantaj Şeridi — format: <code className="bg-slate-100 px-1 rounded text-slate-700">emoji|başlık|açıklama</code></p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {(["Default_Trust1","Default_Trust2","Default_Trust3","Default_Trust4"] as const).map((k,i) => (
                                <input key={k} className={inp} value={settings[k] || ""} onChange={e => set(k, e.target.value)}
                                  placeholder={["🚀|Hızlı Kargo|2-3 iş günü teslimat","🔒|Güvenli Ödeme|256-bit SSL şifreleme","↩️|Kolay İade|14 gün iade garantisi","💬|7/24 Destek|Her zaman yanınızdayız"][i]} />
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Kategoriler Başlığı">
                              <input className={inp} value={settings.Default_CategoriesTitle || ""} onChange={e => set("Default_CategoriesTitle", e.target.value)} placeholder="Kategoriler" />
                            </Field>
                            <Field label="Kategoriler Alt Başlığı">
                              <input className={inp} value={settings.Default_CategoriesSubtitle || ""} onChange={e => set("Default_CategoriesSubtitle", e.target.value)} placeholder="İhtiyacına göre kategorilere göz at" />
                            </Field>
                            <Field label="Öne Çıkan Ürünler Başlığı">
                              <input className={inp} value={settings.Default_FeaturedTitle || ""} onChange={e => set("Default_FeaturedTitle", e.target.value)} placeholder="Öne Çıkan Ürünler" />
                            </Field>
                            <Field label="Öne Çıkan Ürünler Alt Başlığı">
                              <input className={inp} value={settings.Default_FeaturedSubtitle || ""} onChange={e => set("Default_FeaturedSubtitle", e.target.value)} placeholder="Popüler ürünleri avantajlı fiyatlarla keşfet" />
                            </Field>
                            <Field label="İndirimler Başlığı">
                              <input className={inp} value={settings.Default_DiscountTitle || ""} onChange={e => set("Default_DiscountTitle", e.target.value)} placeholder="Fırsat İndirimi" />
                            </Field>
                            <Field label="İndirimler Alt Başlığı">
                              <input className={inp} value={settings.Default_DiscountSubtitle || ""} onChange={e => set("Default_DiscountSubtitle", e.target.value)} placeholder="İndirimli ürünleri kaçırma" />
                            </Field>
                            <Field label="Kampanyalar Başlığı">
                              <input className={inp} value={settings.Default_CampaignsTitle || ""} onChange={e => set("Default_CampaignsTitle", e.target.value)} placeholder="Kampanyalar" />
                            </Field>
                            <Field label="Kampanyalar Alt Başlığı">
                              <input className={inp} value={settings.Default_CampaignsSubtitle || ""} onChange={e => set("Default_CampaignsSubtitle", e.target.value)} placeholder="Kaçırmak istemeyeceğin fırsatlar" />
                            </Field>
                          </div>
                        </div>
                      )}

                      {/* ── YEDEK PARÇA ── */}
                      {key === "spareparts" && (
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="B2B Bar Metni" hint="Üst çubuktaki bayi daveti mesajı">
                              <input className={inp} value={settings.Spareparts_B2BText || ""} onChange={e => set("Spareparts_B2BText", e.target.value)} placeholder="Servis ve bayi hesabı açın — özel fiyatlar, hızlı sipariş ve öncelikli destek" />
                            </Field>
                            <Field label="Telefon Numarası" hint="B2B barda gösterilen numara">
                              <input className={inp} value={settings.Spareparts_Phone || ""} onChange={e => set("Spareparts_Phone", e.target.value)} placeholder="0850 XXX XX XX" />
                            </Field>
                            <Field label="Hero Ürün Sayısı" hint='Örn: "700+"'>
                              <input className={inp} value={settings.Spareparts_HeroCount || ""} onChange={e => set("Spareparts_HeroCount", e.target.value)} placeholder="700+" />
                            </Field>
                            <Field label="Hero Sayı Birimi" hint='Örn: "BİN ÜRÜN"'>
                              <input className={inp} value={settings.Spareparts_HeroCountUnit || ""} onChange={e => set("Spareparts_HeroCountUnit", e.target.value)} placeholder="BİN ÜRÜN" />
                            </Field>
                            <Field label="Hero Slogan" hint="Ana hero alanındaki şirket sloganı">
                              <input className={inp} value={settings.Spareparts_HeroSlogan || ""} onChange={e => set("Spareparts_HeroSlogan", e.target.value)} placeholder="TÜRKİYE'NİN EN BÜYÜK OTO PARÇA MAĞAZASI" />
                            </Field>
                            <Field label="Sol Promo Başlık">
                              <input className={inp} value={settings.Spareparts_Promo1Title || ""} onChange={e => set("Spareparts_Promo1Title", e.target.value)} placeholder="Filtre & Yağ Seti" />
                            </Field>
                            <Field label="Sol Promo Açıklama">
                              <input className={inp} value={settings.Spareparts_Promo1Desc || ""} onChange={e => set("Spareparts_Promo1Desc", e.target.value)} placeholder="Aracınıza uygun orijinal filtre setleri" />
                            </Field>
                            <Field label="Kampanya İndirim Metni">
                              <input className={inp} value={settings.Spareparts_Promo2Discount || ""} onChange={e => set("Spareparts_Promo2Discount", e.target.value)} placeholder="%40'a varan indirim" />
                            </Field>
                          </div>
                          <Field label="En Çok Aranan Parçalar" hint="Virgülle ayrılmış liste">
                            <textarea className={inp} rows={2} value={settings.Spareparts_HotParts || ""} onChange={e => set("Spareparts_HotParts", e.target.value)} placeholder="Fren Diski,Motor Yağı,Hava Filtresi,Akü,Buji Seti,Amortisör,Debriyaj,Radyatör" />
                          </Field>
                          <Field label="Güvenilir Markalar" hint="Virgülle ayrılmış marka listesi">
                            <textarea className={inp} rows={2} value={settings.Spareparts_TrustedBrands || ""} onChange={e => set("Spareparts_TrustedBrands", e.target.value)} placeholder="BOSCH,NGK,MANN,VALEO,BREMBO,CASTROL,MOBIL,TOTAL,SKF,GATES" />
                          </Field>
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-2">Güvence Şeridi — format: <code className="bg-slate-100 px-1 rounded text-slate-700">ikon|başlık|açıklama</code></p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {(["Spareparts_Trust1","Spareparts_Trust2","Spareparts_Trust3","Spareparts_Trust4"] as const).map((k,i) => (
                                <input key={k} className={inp} value={settings[k] || ""} onChange={e => set(k, e.target.value)}
                                  placeholder={["OEM|Orijinal Parçalar|OEM kalite güvencesi","2G|Hızlı Kargo|1-2 iş günü teslimat","30G|30 Gün İade|Koşulsuz iade garantisi","7/24|Teknik Destek|Uzman ekip her an hazır"][i]} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── PAZAR YERİ ── */}
                      {key === "marketplace" && (
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Flash Bar Metni">
                              <input className={inp} value={settings.Marketplace_FlashBarText || ""} onChange={e => set("Marketplace_FlashBarText", e.target.value)} placeholder="Bugünün Süper Fırsatları — Bitmeden Kaçırma!" />
                            </Field>
                            <Field label="Hero İndirim Yüzdesi" hint={"Örn: %70'e Varan"}>
                              <input className={inp} value={settings.Marketplace_HeroDiscount || ""} onChange={e => set("Marketplace_HeroDiscount", e.target.value)} placeholder="%70'e Varan" />
                            </Field>
                            <Field label="Hero Başlık" hint='Örn: "Flash İndirimler"'>
                              <input className={inp} value={settings.Marketplace_HeroTitle || ""} onChange={e => set("Marketplace_HeroTitle", e.target.value)} placeholder="Flash İndirimler" />
                            </Field>
                            <Field label="Ücretsiz Kargo Limiti (TL)">
                              <input className={inp} type="number" min="0" value={settings.Marketplace_FreeShippingLimit || ""} onChange={e => set("Marketplace_FreeShippingLimit", e.target.value)} placeholder="300" />
                            </Field>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-2">Güvence Şeridi — format: <code className="bg-slate-100 px-1 rounded text-slate-700">ikon|başlık|açıklama</code></p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {(["Marketplace_Trust1","Marketplace_Trust2","Marketplace_Trust3","Marketplace_Trust4"] as const).map((k,i) => (
                                <input key={k} className={inp} value={settings[k] || ""} onChange={e => set(k, e.target.value)}
                                  placeholder={["🔒|Güvenli Alışveriş|256-bit SSL şifreleme","🚚|Hızlı Teslimat|1-3 iş günü kargo","↩️|Kolay İade|14 gün iade hakkı","⭐|Güvenilir Satıcı|Onaylı mağaza garantisi"][i]} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── ELEKTRONİK MAĞAZA ── */}
                      {key === "techstore" && (
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Flash Bar Metni">
                              <input className={inp} value={settings.Techstore_FlashBarText || ""} onChange={e => set("Techstore_FlashBarText", e.target.value)} placeholder="Bugüne Özel Teknoloji Fırsatları!" />
                            </Field>
                            <Field label="Hero Ana Başlık">
                              <input className={inp} value={settings.Techstore_HeroTitle || ""} onChange={e => set("Techstore_HeroTitle", e.target.value)} placeholder="En Yeni Teknoloji" />
                            </Field>
                            <Field label="Hero Alt Başlık">
                              <input className={inp} value={settings.Techstore_HeroSubtitle || ""} onChange={e => set("Techstore_HeroSubtitle", e.target.value)} placeholder="En Uygun Fiyatla" />
                            </Field>
                            <Field label="Hero Açıklama Metni">
                              <input className={inp} value={settings.Techstore_HeroDesc || ""} onChange={e => set("Techstore_HeroDesc", e.target.value)} placeholder="Binlerce elektronik ürün, resmi garanti, güvenli ödeme" />
                            </Field>
                          </div>
                          <Field label="Yetkili Markalar" hint="Virgülle ayrılmış marka listesi">
                            <textarea className={inp} rows={2} value={settings.Techstore_Brands || ""} onChange={e => set("Techstore_Brands", e.target.value)} placeholder="APPLE,SAMSUNG,SONY,LG,ASUS,LENOVO,HUAWEI,XIAOMI" />
                          </Field>
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-2">Güvence Şeridi — format: <code className="bg-slate-100 px-1 rounded text-slate-700">ikon|başlık|açıklama</code></p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {(["Techstore_Trust1","Techstore_Trust2","Techstore_Trust3","Techstore_Trust4"] as const).map((k,i) => (
                                <input key={k} className={inp} value={settings[k] || ""} onChange={e => set(k, e.target.value)}
                                  placeholder={["🏅|Resmi Garanti|Türkiye distribütörü","🔒|Güvenli Ödeme|3D Secure & SSL","🔧|Teknik Servis|Yetkili servis desteği","↩️|14 Gün İade|Sorunsuz iade garantisi"][i]} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </Section>
        </div>
      )}

      {/* ── Kargo ── */}
      {tab === "kargo" && (
        <div className="space-y-4">
          <Section title={t("auto.kargoAyarlari", "Kargo Ayarları")} icon={<Truck size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t("auto.ucretsizKargoLimiti", "Ücretsiz Kargo Limiti")} hint={t("auto.ucretsizKargoLimitiHint", "Bu tutarın üzerindeki siparişlere ücretsiz kargo")}>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₺</span>
                  <input type="number" value={settings.FreeShippingLimit} onChange={e => set("FreeShippingLimit", e.target.value)} className={inp + " pl-8"} placeholder="500" min="0" />
                </div>
              </Field>
              <Field label={t("auto.varsayilanKargoUcreti", "Varsayılan Kargo Ücreti")} hint={t("auto.varsayilanKargoUcretiHint", "Limiti geçmeyen siparişlere uygulanır")}>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₺</span>
                  <input type="number" value={settings.DefaultShippingCost} onChange={e => set("DefaultShippingCost", e.target.value)} className={inp + " pl-8"} placeholder="29.90" min="0" step="0.01" />
                </div>
              </Field>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">{t("auto.ozet", "Özet:")} </span>
                ₺{settings.FreeShippingLimit || "—"} {t("auto.kargoOzetMesaj", "ve üzeri siparişler ücretsiz, altındakiler")} ₺{settings.DefaultShippingCost || "—"} {t("auto.kargoUcretiOder", "kargo ücreti öder.")}
              </p>
            </div>
          </Section>

          <Section title={t("auto.kargoFirmalari", "Kargo Firmaları")} icon={<Truck size={16} />}
            subtitle={t("auto.kargoFirmalariAciklama2", "Alternatif kargo firmalarını, fiyatları ve takip ayarlarını buradan yönetin. Kargo süreçlerini ve sevkiyat takibini Kargo Takip sayfasından yapabilirsiniz.")}>
            <CarrierManager />
          </Section>
        </div>
      )}

      {/* ── Menü ── */}
      {tab === "menu" && (
        <Section title={t("auto.menuSiralamasi", "Menü Sıralaması")} icon={<Menu size={16} />}
          subtitle={t("auto.menuSiralamasiAciklama", "Grupları ve öğeleri sürükle-bırak ya da ok butonlarıyla sıralayın. Grup adını ve ikonunu düzenleyebilir, öğeleri başka gruba taşıyabilirsiniz. Kaydet'e basınca sol menüye yansır.")}>
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
              {t("auto.tumunuVarsayilanaSifirla", "Tümünü varsayılana sıfırla")}
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
            <Section title={t("auto.sss", "Sık Sorulan Sorular")} icon={<HelpCircle size={16} />}
              subtitle={t("auto.sssAciklama", "Müşteri sitesinde /sss sayfasında görünür. Soru ve cevapları düzenleyebilirsiniz.")}>
              <FaqEditor value={settings.Page_SSS} onChange={v => set("Page_SSS", v)} />
            </Section>
          )}

          {/* İade & Değişim */}
          {contentSub === "iade" && (
            <Section title={t("auto.iadeDegisim", "İade & Değişim")} icon={<RefreshCw size={16} />}
              subtitle={t("auto.iadeDegisimAciklama", "/iade-degisim sayfasında görünür. Paragraflar arasında boş satır bırakın.")}>
              <TextEditor label={t("auto.sayfaIcerigi", "Sayfa İçeriği")} settingKey="Page_IadeVeDegisim"
                value={settings.Page_IadeVeDegisim} onChange={set} rows={16}
                hint={t("auto.paragraflariBosAyirin", "Paragrafları boş satırla ayırın. İpucu: başlık satırı için satır başına # koyabilirsiniz.")} />
            </Section>
          )}

          {/* Kargo Takibi */}
          {contentSub === "kargo" && (
            <Section title={t("auto.kargoTakibi", "Kargo Takibi")} icon={<Truck size={16} />}
              subtitle={t("auto.kargoTakibiAciklama", "/kargo-takibi sayfasında görünür.")}>
              <TextEditor label={t("auto.sayfaIcerigi", "Sayfa İçeriği")} settingKey="Page_KargoTakibi"
                value={settings.Page_KargoTakibi} onChange={set} rows={14} />
            </Section>
          )}

          {/* İletişim */}
          {contentSub === "iletisim" && (
            <Section title={t("auto.iletisimSayfasi", "İletişim Sayfası")} icon={<Phone size={16} />}
              subtitle={t("auto.iletisimSayfasiAciklama", "/iletisim sayfasında görünür. Genel e-posta ve telefon Genel sekmesinden alınır.")}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label={t("label.email", "E-posta")} hint={t("auto.genelSekmeContactEmail", "Genel sekmedeki ContactEmail kullanılır")}>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input value={settings.ContactEmail} onChange={e => set("ContactEmail", e.target.value)} className={inp + " pl-9"} placeholder="destek@magaza.com" />
                    </div>
                  </Field>
                  <Field label={t("label.phone", "Telefon")}>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input value={settings.ContactPhone} onChange={e => set("ContactPhone", e.target.value)} className={inp + " pl-9"} placeholder="0850 000 00 00" />
                    </div>
                  </Field>
                </div>
                <Field label={t("auto.calismaSaatleri", "Çalışma Saatleri")}>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input value={settings.Page_Iletisim_Hours} onChange={e => set("Page_Iletisim_Hours", e.target.value)}
                      className={inp + " pl-9"} placeholder={t("auto.calismaSaatleriPlaceholder", "Hafta içi 09:00 – 18:00, Cumartesi 10:00 – 16:00")} />
                  </div>
                </Field>
                <Field label={t("auto.adres", "Adres")}>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                    <textarea value={settings.Page_Iletisim_Address} onChange={e => set("Page_Iletisim_Address", e.target.value)}
                      rows={3} className={inp + " pl-9 resize-none"} placeholder={t("auto.sirketAdresi", "Şirket adresi...")} />
                  </div>
                </Field>
                <Field label="Google Maps Embed URL" hint={t("auto.googleMapsHint", "Google Maps'ten 'Haritayı Göm' > iframe src değeri")}>
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
            <Section title={t("auto.hakkimizda", "Hakkımızda")} icon={<FileText size={16} />}
              subtitle={t("auto.hakkimizdaAciklama", "/hakkimizda sayfasında görünür.")}>
              <TextEditor label={t("auto.sayfaIcerigi", "Sayfa İçeriği")} settingKey="Page_Hakkimizda"
                value={settings.Page_Hakkimizda} onChange={set} rows={16} />
            </Section>
          )}

          {/* KVKK */}
          {contentSub === "kvkk" && (
            <Section title={t("auto.kvkkMetni", "KVKK Metni")} icon={<FileText size={16} />}
              subtitle={t("auto.kvkkAciklama", "/kvkk sayfasında görünür. Hukuki metni buraya yapıştırabilirsiniz.")}>
              <TextEditor label={t("auto.kvkkIcerigi", "KVKK İçeriği")} settingKey="Page_KVKK"
                value={settings.Page_KVKK} onChange={set} rows={20} />
            </Section>
          )}

          {/* Gizlilik */}
          {contentSub === "gizlilik" && (
            <Section title={t("auto.gizlilikPolitikasi", "Gizlilik Politikası")} icon={<FileText size={16} />}
              subtitle={t("auto.gizlilikAciklama", "/gizlilik sayfasında görünür.")}>
              <TextEditor label={t("auto.gizlilikPolitikasiIcerigi", "Gizlilik Politikası İçeriği")} settingKey="Page_Gizlilik"
                value={settings.Page_Gizlilik} onChange={set} rows={20} />
            </Section>
          )}

          {/* Footer */}
          {contentSub === "footer" && (
            <Section title={t("auto.footerBilgileri", "Footer Bilgileri")} icon={<Globe size={16} />}
              subtitle={t("auto.footerBilgileriAciklama", "Müşteri sitesinin alt bölümünde görünen bilgiler.")}>
              <div className="space-y-4">
                <Field label={t("auto.markaSlogani", "Marka Sloganı")} hint={t("auto.markaSloganiHint", "Logo altında görünen kısa açıklama. Yeni satır için Enter kullanın.")}>
                  <textarea value={settings.Footer_Tagline} onChange={e => set("Footer_Tagline", e.target.value)}
                    rows={3} className={inp + " resize-none"} placeholder={t("auto.keyifliAlisverisPlaceholder", "Keyifli alışverişin yeni adresi.")} />
                </Field>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  {t("auto.sosyalMedyaIcin", "Sosyal medya bağlantıları için")} <button className="text-teal-600 underline" onClick={() => setTab("genel")}>{t("auto.genelSekmesine", "Genel sekmesine")}</button> {t("auto.gidin", "gidin.")}
                  {t("auto.iletisimBilgileriYonetilir", "İletişim bilgileri (e-posta & telefon)")} <button className="text-teal-600 underline" onClick={() => setContentSub("iletisim")}>{t("auto.iletisimBolumunden", "İletişim bölümünden")}</button> {t("auto.yonetilir", "yönetilir.")}
                </div>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ── Chatbot ── */}
      {tab === "chatbot" && (
        <div className="space-y-5">
          <Section title={t("auto.chatbotDestek", "Chatbot & Destek")} icon={<MessageCircle size={16} />}
            subtitle={t("auto.chatbotDestekAciklama", "WhatsApp veya Telegram üzerinden müşteri desteği sağlayın. n8n entegrasyonu ile akıllı bot yanıtları ekleyebilirsiniz.")}>
            <div className="space-y-5">
              {/* Enable/disable */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{t("auto.chatbotWidget", "Chatbot Widget")}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {settings.ChatbotEnabled === "true"
                      ? t("auto.widgetAktif", "Widget aktif — müşteri sitesinde sohbet butonu görünür.")
                      : t("auto.widgetPasif", "Widget pasif — müşteri sitesinde hiç görünmez.")}
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
              <Field label={t("auto.kanal", "Kanal")} hint={t("auto.kanalHint", "Hangi kanallar gösterilsin?")}>
                <select value={settings.ChatbotProvider} onChange={e => set("ChatbotProvider", e.target.value)} className={inp}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="both">{t("auto.herIkisi", "Her İkisi")}</option>
                </select>
              </Field>

              {/* WhatsApp */}
              {(settings.ChatbotProvider === "whatsapp" || settings.ChatbotProvider === "both") && (
                <div className="space-y-3 p-4 border border-green-200 rounded-xl bg-green-50/50">
                  <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                    <MessageCircle size={15} /> WhatsApp
                  </p>
                  <Field label={t("auto.numara", "Numara")} hint={t("auto.numaraHint", "Uluslararası format: +905xxxxxxxxx")}>
                    <input value={settings.WhatsAppNumber} onChange={e => set("WhatsAppNumber", e.target.value)}
                      className={inp} placeholder="+905321234567" />
                  </Field>
                  <Field label={t("auto.karsilamaMesaji", "Karşılama Mesajı")} hint={t("auto.karsilamaMesajiHint", "Müşteri tıkladığında önceden dolu gelecek mesaj")}>
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
                  <Field label={t("auto.botKullaniciAdi", "Bot Kullanıcı Adı")} hint={t("auto.botKullaniciAdiHint", "Örn: @MagazaBot")}>
                    <input value={settings.TelegramBotUsername} onChange={e => set("TelegramBotUsername", e.target.value)}
                      className={inp} placeholder="@MagazaBot" />
                  </Field>
                  <Field label={t("auto.botToken", "Bot Token")} hint={t("auto.botTokenHint", "BotFather'dan alınan token. Asla halka açık edilmez.")}>
                    <input type="password" value={settings.TelegramBotToken} onChange={e => set("TelegramBotToken", e.target.value)}
                      className={inp} placeholder="1234567890:AABBCCDDEEFFaabbccddeeff" />
                  </Field>
                </div>
              )}

              {/* n8n */}
              <div className="space-y-3 p-4 border border-violet-200 rounded-xl bg-violet-50/50">
                <p className="text-sm font-semibold text-violet-700 flex items-center gap-2">
                  <Settings size={15} /> n8n / Antigravity Webhook
                  <span className="text-xs font-normal text-violet-500">({t("auto.istegeBagliInlineChat", "İsteğe bağlı — inline chat için")})</span>
                </p>
                <Field label="Webhook URL" hint={t("auto.webhookUrlHint", "n8n Webhook node URL'si. Doldurulursa widget içi mesajlaşma aktif olur.")}>
                  <input value={settings.N8nWebhookUrl} onChange={e => set("N8nWebhookUrl", e.target.value)}
                    className={inp} placeholder="https://n8n.example.com/webhook/chatbot" />
                </Field>
                <Field label="API Key" hint={t("auto.apiKeyOpsiyonel", "Opsiyonel. X-Api-Key header'ında gönderilir.")}>
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
          <Section title={t("auto.bankaHavalesi", "Banka Havalesi / EFT")} icon={<Building2 size={16} />}
            subtitle={t("auto.bankaHavalesiAciklama", "Müşteriler sipariş sonrası IBAN'a havale yaparak ödeme yapabilir.")}>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">{t("auto.havaleIleOdeme", "Havale ile Ödeme")}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {settings.PaymentHavaleEnabled === "true"
                    ? t("auto.havaleAktif", "Aktif — ödeme seçeneklerinde görünür.")
                    : t("auto.havalePasif", "Pasif — ödeme seçeneklerinde gösterilmez.")}
                </p>
              </div>
              <button onClick={() => set("PaymentHavaleEnabled", settings.PaymentHavaleEnabled === "true" ? "false" : "true")}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.PaymentHavaleEnabled === "true" ? "bg-teal-500" : "bg-slate-300"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.PaymentHavaleEnabled === "true" ? "left-7" : "left-1"}`} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t("auto.bankaAdi", "Banka Adı")}>
                <input value={settings.PaymentHavaleBankName} onChange={e => set("PaymentHavaleBankName", e.target.value)}
                  className={inp} placeholder={t("auto.orneginZiraat", "Örn: Ziraat Bankası")} />
              </Field>
              <Field label={t("auto.hesapSahibiAdi", "Hesap Sahibi Adı")}>
                <input value={settings.PaymentHavaleAccountName} onChange={e => set("PaymentHavaleAccountName", e.target.value)}
                  className={inp} placeholder={t("auto.sirketAdSoyad", "Şirket / Ad Soyad")} />
              </Field>
              <Field label="IBAN" hint={t("auto.ibanHint", "TR ile başlayan 26 haneli numara")}>
                <input value={settings.PaymentHavaleIBAN} onChange={e => set("PaymentHavaleIBAN", e.target.value)}
                  className={inp + " font-mono"} placeholder="TR00 0000 0000 0000 0000 0000 00" />
              </Field>
              <Field label={t("label.description", "Açıklama")} hint={t("auto.havaleAciklamaHint", "Müşteriye gösterilecek havale açıklaması")}>
                <input value={settings.PaymentHavaleDescription} onChange={e => set("PaymentHavaleDescription", e.target.value)}
                  className={inp} placeholder="Sipariş numarasını açıklamaya yazınız" />
              </Field>
            </div>
          </Section>

          {/* SanalPos */}
          <Section title={t("auto.sanalPosKrediKart", "Sanal POS / Kredi Kartı")} icon={<CreditCard size={16} />}
            subtitle={t("auto.sanalPosAciklama", "Ödeme altyapısı entegrasyonu. API bilgileri güvende saklanır.")}>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">{t("auto.krediKartiIleOdeme", "Kredi / Banka Kartı ile Ödeme")}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {settings.PaymentSanalPosEnabled === "true" ? t("status.active", "Aktif") : t("status.passive", "Pasif")}
                </p>
              </div>
              <button onClick={() => set("PaymentSanalPosEnabled", settings.PaymentSanalPosEnabled === "true" ? "false" : "true")}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.PaymentSanalPosEnabled === "true" ? "bg-teal-500" : "bg-slate-300"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.PaymentSanalPosEnabled === "true" ? "left-7" : "left-1"}`} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t("auto.odemeSaglayici", "Ödeme Sağlayıcı")}>
                <select value={settings.PaymentSanalPosProvider} onChange={e => set("PaymentSanalPosProvider", e.target.value)} className={inp}>
                  <option value="iyzico">İyzico</option>
                  <option value="paytr">PayTR</option>
                  <option value="param">Param</option>
                  <option value="sipay">Sipay</option>
                  <option value="craftgate">Craftgate</option>
                  <option value="stripe">Stripe</option>
                </select>
              </Field>
              <Field label={t("auto.testModu", "Test Modu")}>
                <div className="flex items-center gap-3 mt-1">
                  <button onClick={() => set("PaymentSanalPosTestMode", settings.PaymentSanalPosTestMode === "true" ? "false" : "true")}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.PaymentSanalPosTestMode === "true" ? "bg-amber-400" : "bg-slate-300"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.PaymentSanalPosTestMode === "true" ? "left-7" : "left-1"}`} />
                  </button>
                  <span className="text-xs text-slate-500">
                    {settings.PaymentSanalPosTestMode === "true" ? t("auto.testModuAcik", "Test modu açık — gerçek para çekilmez") : t("auto.canliMod", "Canlı mod — gerçek işlemler yapılır")}
                  </span>
                </div>
              </Field>
              <Field label={t("auto.merchantId", "Merchant ID / Mağaza ID")}>
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
              <Field label={t("auto.apiSecretPrivateKey", "API Secret / Private Key")} hint={t("auto.sifreliSaklanir", "Şifreli saklanır.")}>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-3 text-slate-400" />
                  <input type="password" value={settings.PaymentSanalPosApiSecret} onChange={e => set("PaymentSanalPosApiSecret", e.target.value)}
                    className={inp + " pl-8"} placeholder="••••••••••••••••" />
                </div>
              </Field>
            </div>
            {settings.PaymentSanalPosTestMode !== "true" && settings.PaymentSanalPosEnabled === "true" && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <CreditCard size={14} /> {t("auto.canliModAktifKart", "Canlı mod aktif — gerçek kart bilgileri işlenecek. Entegrasyon testini tamamladığınızdan emin olun.")}
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
              title: t("auto.dogrulamaMesajlari", "Doğrulama Mesajları"),
              color: "violet",
              icon: "🔒",
              items: [
                { key: "Msg_RequiredField",  label: t("auto.zorunluAlan", "Zorunlu Alan"),         hint: t("auto.zorunluAlanHint", "Form alanları boş bırakıldığında") },
                { key: "Msg_InvalidEmail",   label: t("auto.gecersizEposta", "Geçersiz E-posta"),     hint: t("auto.gecersizEpostaHint", "E-posta formatı yanlış olduğunda") },
                { key: "Msg_PasswordMin",    label: t("auto.sifreCokKisa", "Şifre Çok Kısa"),       hint: t("auto.sifreCokKisaHint", "Şifre minimum uzunluğu karşılamıyor") },
                { key: "Msg_PasswordMatch",  label: t("auto.sifreUyusmuyor", "Şifre Uyuşmuyor"),      hint: t("auto.sifreUyusmuyorHint", "Şifre tekrar alanı eşleşmiyor") },
              ],
            },
            {
              title: t("auto.siparissMesajlari", "Sipariş Mesajları"),
              color: "teal",
              icon: "📦",
              items: [
                { key: "Msg_OrderSuccess",   label: t("auto.siparisOlusturuldu", "Sipariş Oluşturuldu"),  hint: t("auto.siparisOlusturulduHint", "Başarılı sipariş sonrası gösterilir") },
                { key: "Msg_OrderCancelled", label: t("auto.siparisIptalEdildi", "Sipariş İptal Edildi"), hint: t("auto.siparisIptalEdildiHint", "İptal işlemi sonrası gösterilir") },
                { key: "Msg_OrderShipped",   label: t("auto.kargoyaVerildi", "Kargoya Verildi"),      hint: t("auto.kargoyaVerildiHint", "Kargo durumu güncellenince") },
              ],
            },
            {
              title: t("auto.sepetMesajlari", "Sepet Mesajları"),
              color: "amber",
              icon: "🛒",
              items: [
                { key: "Msg_CartItemAdded",  label: t("auto.urunEklendi", "Ürün Eklendi"),         hint: t("auto.urunEklendiHint", "Sepete ürün eklenince") },
                { key: "Msg_OutOfStock",     label: t("auto.stokYetersiz", "Stok Yetersiz"),        hint: t("auto.stokYetersizHint", "İstenen miktar stokta yok") },
                { key: "Msg_CartEmpty",      label: t("auto.sepetBos", "Sepet Boş"),            hint: t("auto.sepetBosHint", "Sepet sayfasında ürün yoksa") },
                { key: "Msg_CouponApplied",  label: t("auto.kuponUygulandi", "Kupon Uygulandı"),      hint: t("auto.kuponUygulandiHint", "Geçerli kupon girilince") },
                { key: "Msg_CouponInvalid",  label: t("auto.gecersizKupon", "Geçersiz Kupon"),       hint: t("auto.gecersizKuponHint", "Hatalı veya süresi dolmuş kupon") },
              ],
            },
            {
              title: t("auto.sistemHataMesajlari", "Sistem & Hata Mesajları"),
              color: "red",
              icon: "⚠️",
              items: [
                { key: "Msg_GenericError",   label: t("auto.genelHata", "Genel Hata"),           hint: t("auto.genelHataHint", "Beklenmeyen hatalar için") },
                { key: "Msg_NetworkError",   label: t("auto.baglantiHatasi", "Bağlantı Hatası"),      hint: t("auto.baglantiHatasiHint", "İnternet kesilince") },
                { key: "Msg_Unauthorized",   label: t("auto.yetkisizErisim", "Yetkisiz Erişim"),      hint: t("auto.yetkisizErisimHint", "Giriş gerektiren sayfalarda") },
                { key: "Msg_MaintenanceMode",label: t("auto.bakimModu", "Bakım Modu"),           hint: t("auto.bakimModuHint", "Site bakımda iken") },
                { key: "Msg_LowStockWarning",label: t("auto.dusukStok", "Düşük Stok"),          hint: t("auto.dusukStokHint", "Az miktarda ürün kaldığında") },
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
              <button type="button" onClick={() => setOpenMsgGroups(prev => {
                const s = new Set(prev);
                if (s.has("Özel Mesajlar")) s.delete("Özel Mesajlar");
                else s.add("Özel Mesajlar");
                return s;
              })}
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
            <p>Bu mesajlar SiteSettings tablosunda saklanır. Frontend bileşenler <code className="font-mono bg-blue-100 px-1 rounded">GET /api/settings/theme</code> endpoint&apos;inden okuyabilir ya da hardcoded varsayılan değerleri kullanabilir. Kaydet butonuna bastıktan sonra aktif olur.</p>
          </div>
        </div>
      )}

      {/* ── Mail Log ── */}
      {tab === "mail" && (
        <div className="space-y-5">

          {/* ── Nasıl Çalışır? ── */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 overflow-hidden">
            <button type="button" onClick={() => setMailGuideOpen(v => !v)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-blue-100/60 transition">
              <Mail size={16} className="text-blue-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-800">Mail Sistemi — Nasıl Çalışır?</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {mailGuideOpen
                    ? "Tüm mail kaynakları, loglanan alanlar ve dev modu davranışı aşağıda açıklanmaktadır."
                    : "Hangi servisler/joblar mail gönderiyor? Dev modda ne olur? Loglanan alanlar neler? — Genişletmek için tıkla."}
                </p>
              </div>
              <ChevronDown size={15} className={`text-blue-400 transition-transform shrink-0 ${mailGuideOpen ? "rotate-180" : ""}`} />
            </button>

            {mailGuideOpen && (
              <div className="px-5 pb-5 space-y-5 border-t border-blue-100">

                {/* Dev Modu */}
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Dev Modu Davranışı
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <code className="bg-amber-100 px-1 rounded font-mono">Email:SmtpHost</code> boş veya{" "}
                    <code className="bg-amber-100 px-1 rounded font-mono">smtp.example.com</code> ise sistem dev modundadır.{" "}
                    Gerçek SMTP bağlantısı <strong>kurulmaz</strong>, mail gönderilmez.
                    Ancak gönderim girişimi <strong>her zaman loglanır</strong> — tabloda{" "}
                    <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">Dev</span>{" "}
                    badge&apos;i ile görünür.
                    SMTP yapılandırmak için{" "}
                    <strong>Yönetim → Sistem → E-posta / SMTP Test</strong> bölümüne bakın.
                  </p>
                </div>

                {/* Loglanan Alanlar */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Logda Tutulan Bilgiler (MailLog tablosu)</p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Alan</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Açıklama</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          ["SentAt",       "Gönderim zamanı (UTC)"],
                          ["ToEmail",      "Alıcı e-posta adresi"],
                          ["ToName",       "Alıcı adı"],
                          ["Subject",      "E-posta konusu"],
                          ["TemplateName", "Kullanılan şablon adı (bkz. aşağı)"],
                          ["IsSuccess",    "Gönderim başarılı mı? (SMTP hatasında false)"],
                          ["IsDevMode",    "Dev modunda mı gönderildi? (SMTP bağlantısı kurulmadı)"],
                          ["ErrorMessage", "Başarısızsa SMTP hata mesajı"],
                        ].map(([f, d]) => (
                          <tr key={f} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono text-teal-700">{f}</td>
                            <td className="px-3 py-2 text-slate-600">{d}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Şablon → Kaynak Tablosu */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Mail Kaynakları — Kim, Ne Zaman, Hangi Şablonla?</p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-3 py-2 font-semibold text-slate-500 w-36">Şablon</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500 w-28">Kaynak Tipi</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Tetikleyici / Servis</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Aralık / Endpoint</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {([
                          ["OrderConfirmation",    "Outbox Consumer", "OrderCreatedConsumer",       "Sipariş oluşturunca otomatik"],
                          ["PaymentSuccess",       "Outbox Consumer", "PaymentCompletedConsumer",   "Ödeme tamamlanınca otomatik"],
                          ["ShippingNotification", "Command Handler", "CreateShipmentCommand",      "POST /api/admin/shipments"],
                          ["EmailVerification",    "Command Handler", "RegisterCommand",            "POST /api/auth/register"],
                          ["VerificationReminder", "Command Handler", "ResendVerificationCommand",  "POST /api/auth/resend-verification"],
                          ["VerificationReminder", "Job (12 saat)",   "VerificationReminderJob",    "Her 720 dk otomatik"],
                          ["PasswordReset",        "Command Handler", "ForgotPasswordCommand",      "POST /api/auth/forgot-password"],
                          ["PasswordReminder",     "Job (24 saat)",   "PasswordReminderJob",        "Her 1440 dk — 60+ gün değiştirmeyenlere"],
                          ["ReviewRejection",      "Command Handler", "ApproveReviewCommand",       "PUT /api/admin/reviews/{id}/approve"],
                          ["LowStockAlertBatch",   "Job (5 dk)",      "StockAlertJob",              "Her 5 dk — kritik stok altı ürün varsa"],
                          ["Alert",                "Job (60 dk)",     "ModuleHealthCheckJob",       "Her 60 dk — sağlık sorunu varsa"],
                          ["Alert",                "Admin API",       "SettingsController",         "POST /api/admin/settings/test-alert"],
                          ["TestEmail",            "Admin API",       "EmailController",            "POST /api/admin/email/test"],
                          ["ContactForm",          "Public API",      "ContactController",          "POST /api/contact"],
                          ["LicenseAssignment",    "EcomLicence Servis", "LicenseAssignmentsController (dotnet-ecom-licence)", "Lisans atama / yenileme"],
                        ] as [string,string,string,string][]).map(([tpl, src, svc, ep], i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono text-teal-700 whitespace-nowrap">{tpl}</td>
                            <td className="px-3 py-2">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                src.includes("Job")      ? "bg-violet-100 text-violet-700" :
                                src.includes("Consumer") ? "bg-blue-100 text-blue-700"     :
                                src.includes("Licen")    ? "bg-orange-100 text-orange-700" :
                                src.includes("Admin")    ? "bg-teal-100 text-teal-700"     :
                                src.includes("Public")   ? "bg-slate-100 text-slate-600"   :
                                "bg-indigo-100 text-indigo-700"
                              }`}>{src}</span>
                            </td>
                            <td className="px-3 py-2 text-slate-700 font-medium">{svc}</td>
                            <td className="px-3 py-2 text-slate-500 font-mono text-[10px]">{ep}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Akış diyagramı */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Mail Akışı</p>
                  <div className="bg-slate-900 rounded-xl p-4 text-[11px] font-mono text-slate-300 space-y-1 leading-relaxed">
                    <p><span className="text-teal-400">Tetikleyici</span> (kayıt / sipariş / job / admin)</p>
                    <p className="pl-4">→ <span className="text-blue-400">IEmailService</span> metodu çağrılır</p>
                    <p className="pl-8">→ private <span className="text-yellow-400">SendAsync(toEmail, toName, subject, body, templateName, ct)</span></p>
                    <p className="pl-12">→ Dev mi? <span className="text-amber-400">evet</span>: SMTP atlanır, log yazılır <span className="text-amber-400">[IsDevMode=true]</span></p>
                    <p className="pl-12">→ Dev mi? <span className="text-green-400">hayır</span>: MailKit → SMTP gönderim</p>
                    <p className="pl-16">→ Başarı: log <span className="text-green-400">[IsSuccess=true]</span></p>
                    <p className="pl-16">→ Hata:  log <span className="text-red-400">[IsSuccess=false, ErrorMessage=...]</span>, exception fırlatılır</p>
                    <p className="pl-12 text-slate-500">{"// TryLogAsync exception fırlatsa bile mail akışını kesmez"}</p>
                  </div>
                </div>

              </div>
            )}
          </div>

          <Section title="Mail Gönderim Logu" icon={<Mail size={16} />}
            subtitle="Sistemin gönderdiği tüm e-postalar burada loglanır. Dev modda gerçek mail gönderilmez, yalnızca loglanır.">
            {/* Filtreler */}
            <div className="flex flex-wrap gap-2 mb-4">
              <input
                type="text"
                placeholder="E-posta veya konu ara..."
                value={mailLogsSearch}
                onChange={e => setMailLogsSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && void loadMailLogs(1, mailLogsStatus, mailLogsSearch, mailLogsTemplate)}
                className={inp + " flex-1 min-w-[200px]"}
              />
              <select
                value={mailLogsStatus}
                onChange={e => { setMailLogsStatus(e.target.value); void loadMailLogs(1, e.target.value, mailLogsSearch, mailLogsTemplate); }}
                className={inp + " w-36"}
              >
                <option value="">Tüm Durumlar</option>
                <option value="success">Başarılı</option>
                <option value="failed">Başarısız</option>
                <option value="dev">Dev Modu</option>
              </select>
              <select
                value={mailLogsTemplate}
                onChange={e => { setMailLogsTemplate(e.target.value); void loadMailLogs(1, mailLogsStatus, mailLogsSearch, e.target.value); }}
                className={inp + " w-44"}
              >
                <option value="">Tüm Şablonlar</option>
                {["OrderConfirmation","PaymentSuccess","ShippingNotification","EmailVerification","VerificationReminder","PasswordReminder","PasswordReset","LowStockAlert","LowStockAlertBatch","ReviewRejection","ContactForm","LicenseAssignment","TestEmail","Alert"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button onClick={() => void loadMailLogs(1, mailLogsStatus, mailLogsSearch, mailLogsTemplate)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-600 transition">
                <RefreshCw size={13} /> Yenile
              </button>
            </div>

            {/* Tablo */}
            {mailLogsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={22} className="animate-spin text-slate-400" />
              </div>
            ) : mailLogs.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">Kayıt bulunamadı</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Zaman</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Alıcı</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Konu</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Şablon</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mailLogs.map(log => (
                      <tr key={log.id} className={`hover:bg-slate-50 transition ${log.isSuccess ? "" : "bg-red-50"}`}>
                        <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">
                          {new Date(log.sentAt).toLocaleString("tr-TR")}
                        </td>
                        <td className="px-3 py-2.5 max-w-[160px] truncate" title={`${log.toName} <${log.toEmail}>`}>
                          <span className="font-medium">{log.toName}</span>
                          <span className="text-slate-400 ml-1">({log.toEmail})</span>
                        </td>
                        <td className="px-3 py-2.5 max-w-[220px] truncate" title={log.subject}>{log.subject}</td>
                        <td className="px-3 py-2.5">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{log.templateName}</span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {log.isDevMode ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Dev</span>
                          ) : log.isSuccess ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Gönderildi</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold" title={log.errorMessage ?? ""}>Hata</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {mailLogsTotal > 30 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-400">{mailLogsTotal} kayıt, sayfa {mailLogsPage}/{Math.ceil(mailLogsTotal / 30)}</p>
                <div className="flex gap-1">
                  <button disabled={mailLogsPage <= 1} onClick={() => void loadMailLogs(mailLogsPage - 1)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition">Önceki</button>
                  <button disabled={mailLogsPage >= Math.ceil(mailLogsTotal / 30)} onClick={() => void loadMailLogs(mailLogsPage + 1)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition">Sonraki</button>
                </div>
              </div>
            )}
          </Section>
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
                          <td className="py-2 px-4 font-medium whitespace-nowrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {row.module}
                              {row.module === "Test" && (
                                <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-1 py-0.5 rounded font-bold" title="Production ortamında SuperAdmin bile olsa varsayılan gizlidir">
                                  prod&apos;da gizli
                                </span>
                              )}
                              {isChanged && <span className="text-[9px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded font-bold">değişti</span>}
                            </div>
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

      {/* ── Otomasyon ── */}
      {tab === "otomasyon" && (
        <div className="space-y-5">
          <Section
            title={t("auto.jobKonfigurasyonlari", "Job Konfigürasyonları")}
            icon={<Activity size={16} />}
            subtitle={t("auto.jobKonfigurasyonlariAciklama", "Bu ayarlar arka plan işlerinin otomatik çalışmasını, hangi dosyalara yazabileceğini ve i18n tarama penceresini belirler. Kaydettikten sonra scheduler bir sonraki döngüde yeni değerleri okur.")}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ToggleRow
                  label={t("auto.i18nAutoRun", "I18n jobları otomatik çalışsın")}
                  checked={settings["I18nJob:EnableAutoRun"] === "true"}
                  onToggle={() => set("I18nJob:EnableAutoRun", settings["I18nJob:EnableAutoRun"] === "true" ? "false" : "true")}
                  hint={t("auto.i18nAutoRunHint", "Scheduler yalnızca bu bayrak açıksa i18n joblarını zaman penceresine göre otomatik çalıştırır.")}
                />
                <ToggleRow
                  label={t("auto.i18nSourceMutation", "Kaynak dosyalarına yazılsın")}
                  checked={settings["I18nJob:AllowSourceMutation"] === "true"}
                  onToggle={() => set("I18nJob:AllowSourceMutation", settings["I18nJob:AllowSourceMutation"] === "true" ? "false" : "true")}
                  hint={t("auto.i18nSourceMutationHint", "Açılırsa dictionary builder i18n.ts dosyasını günceller; kapalıysa yalnızca öneri modunda kalır.")}
                />
                <ToggleRow
                  label={t("auto.i18nDocsWrite", "Dokümanlara yazılsın")}
                  checked={settings["I18nJob:AllowDocsWrite"] === "true"}
                  onToggle={() => set("I18nJob:AllowDocsWrite", settings["I18nJob:AllowDocsWrite"] === "true" ? "false" : "true")}
                  hint={t("auto.i18nDocsWriteHint", "Açılırsa i18n tarama ve durum raporları dotnet-ecom-docs içine yazılır.")}
                />
                <ToggleRow
                  label={t("auto.i18nTriggerBuilder", "Scanner builder'ı tetiklesin")}
                  checked={settings["I18nJob:TriggerBuilderFromScanner"] === "true"}
                  onToggle={() => set("I18nJob:TriggerBuilderFromScanner", settings["I18nJob:TriggerBuilderFromScanner"] === "true" ? "false" : "true")}
                  hint={t("auto.i18nTriggerBuilderHint", "Scanner hardcoded satır bulursa dictionary builder job'ını kuyruklar.")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t("auto.i18nProjectRoot", "Proje Kökü")} hint={t("auto.i18nProjectRootHint", "Boş bırakılırsa backend otomatik kök dizini arar.")}>
                  <input value={settings["I18nJob:ProjectRoot"]} onChange={e => set("I18nJob:ProjectRoot", e.target.value)} className={inp} placeholder="C:\\PROJECTS\\DOTNET\\Ecom" />
                </Field>
                <Field label={t("auto.i18nDocsPath", "Doküman Klasörü")} hint={t("auto.i18nDocsPathHint", "Boş bırakılırsa sibling dotnet-ecom-docs klasörü aranır.")}>
                  <input value={settings["I18nJob:DocsPath"]} onChange={e => set("I18nJob:DocsPath", e.target.value)} className={inp} placeholder="C:\\PROJECTS\\DOTNET\\dotnet-ecom-docs" />
                </Field>
                <Field label={t("auto.i18nTimeZone", "Zaman Dilimi")}>
                  <input value={settings["I18nJob:ScheduleTimeZone"]} onChange={e => set("I18nJob:ScheduleTimeZone", e.target.value)} className={inp} placeholder="Turkey Standard Time" />
                </Field>
                <Field label={t("auto.i18nWindowStart", "Dictionary Window Başlangıç")}>
                  <input value={settings["I18nJob:DictionaryBuilderWindowStart"]} onChange={e => set("I18nJob:DictionaryBuilderWindowStart", e.target.value)} className={inp} placeholder="01:00:00" />
                </Field>
                <Field label={t("auto.i18nWindowEnd", "Dictionary Window Bitiş")}>
                  <input value={settings["I18nJob:DictionaryBuilderWindowEnd"]} onChange={e => set("I18nJob:DictionaryBuilderWindowEnd", e.target.value)} className={inp} placeholder="07:00:00" />
                </Field>
              </div>
            </div>
          </Section>

          <Section
            title={t("auto.customerJobKonfigurasyonlari", "Customer I18n Konfigürasyonları")}
            icon={<Globe size={16} />}
            subtitle={t("auto.customerJobKonfigurasyonlariAciklama", "Customer ekranları için ayrı i18n tarama ve sözlük oluşturma akışını burada yönetebilirsiniz. Bu blok admin ayarlarından bağımsızdır.")}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ToggleRow
                  label={t("auto.customerI18nAutoRun", "Customer I18n jobları otomatik çalışsın")}
                  checked={settings["CustomerI18nJob:EnableAutoRun"] === "true"}
                  onToggle={() => set("CustomerI18nJob:EnableAutoRun", settings["CustomerI18nJob:EnableAutoRun"] === "true" ? "false" : "true")}
                  hint={t("auto.customerI18nAutoRunHint", "Scheduler yalnızca bu bayrak açıksa customer i18n joblarını zaman penceresine göre otomatik çalıştırır.")}
                />
                <ToggleRow
                  label={t("auto.customerI18nSourceMutation", "Customer kaynak dosyalarına yazılsın")}
                  checked={settings["CustomerI18nJob:AllowSourceMutation"] === "true"}
                  onToggle={() => set("CustomerI18nJob:AllowSourceMutation", settings["CustomerI18nJob:AllowSourceMutation"] === "true" ? "false" : "true")}
                  hint={t("auto.customerI18nSourceMutationHint", "Açılırsa dictionary builder customer i18n.ts dosyasını günceller; kapalıysa yalnızca öneri modunda kalır.")}
                />
                <ToggleRow
                  label={t("auto.customerI18nDocsWrite", "Customer dokümanlarına yazılsın")}
                  checked={settings["CustomerI18nJob:AllowDocsWrite"] === "true"}
                  onToggle={() => set("CustomerI18nJob:AllowDocsWrite", settings["CustomerI18nJob:AllowDocsWrite"] === "true" ? "false" : "true")}
                  hint={t("auto.customerI18nDocsWriteHint", "Açılırsa customer i18n tarama ve durum raporları dotnet-ecom-docs içine yazılır.")}
                />
                <ToggleRow
                  label={t("auto.customerI18nTriggerBuilder", "Customer scanner builder'ı tetiklesin")}
                  checked={settings["CustomerI18nJob:TriggerBuilderFromScanner"] === "true"}
                  onToggle={() => set("CustomerI18nJob:TriggerBuilderFromScanner", settings["CustomerI18nJob:TriggerBuilderFromScanner"] === "true" ? "false" : "true")}
                  hint={t("auto.customerI18nTriggerBuilderHint", "Scanner hardcoded satır bulursa customer dictionary builder job'ını kuyruklar.")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t("auto.customerI18nProjectRoot", "Proje Kökü")} hint={t("auto.customerI18nProjectRootHint", "Boş bırakılırsa backend otomatik kök dizini arar.")}>
                  <input value={settings["CustomerI18nJob:ProjectRoot"]} onChange={e => set("CustomerI18nJob:ProjectRoot", e.target.value)} className={inp} placeholder="C:\\PROJECTS\\DOTNET\\Ecom" />
                </Field>
                <Field label={t("auto.customerI18nDocsPath", "Doküman Klasörü")} hint={t("auto.customerI18nDocsPathHint", "Boş bırakılırsa sibling dotnet-ecom-docs klasörü aranır.")}>
                  <input value={settings["CustomerI18nJob:DocsPath"]} onChange={e => set("CustomerI18nJob:DocsPath", e.target.value)} className={inp} placeholder="C:\\PROJECTS\\DOTNET\\dotnet-ecom-docs" />
                </Field>
                <Field label={t("auto.customerI18nTimeZone", "Zaman Dilimi")}>
                  <input value={settings["CustomerI18nJob:ScheduleTimeZone"]} onChange={e => set("CustomerI18nJob:ScheduleTimeZone", e.target.value)} className={inp} placeholder="Turkey Standard Time" />
                </Field>
                <Field label={t("auto.customerI18nWindowStart", "Dictionary Window Başlangıç")}>
                  <input value={settings["CustomerI18nJob:DictionaryBuilderWindowStart"]} onChange={e => set("CustomerI18nJob:DictionaryBuilderWindowStart", e.target.value)} className={inp} placeholder="01:00:00" />
                </Field>
                <Field label={t("auto.customerI18nWindowEnd", "Dictionary Window Bitiş")}>
                  <input value={settings["CustomerI18nJob:DictionaryBuilderWindowEnd"]} onChange={e => set("CustomerI18nJob:DictionaryBuilderWindowEnd", e.target.value)} className={inp} placeholder="07:00:00" />
                </Field>
              </div>
            </div>
          </Section>

          <Section
            title={t("auto.verificationKonfigurasyonu", "Doğrulama ve İzleme")}
            icon={<Database size={16} />}
            subtitle={t("auto.verificationKonfigurasyonuAciklama", "Doğrulama, lint backlog ve log dosyası yollarını burada yönetebilirsiniz. Bu değerler job'ların hangi hedefe yazacağını belirler.")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t("auto.verificationApiBase", "Verification API Base URL")} hint={t("auto.verificationApiBaseHint", "Todo verification job API kontrolleri için bu adresi kullanır.")}>
                <input value={settings["VerificationJob:ApiBaseUrl"]} onChange={e => set("VerificationJob:ApiBaseUrl", e.target.value)} className={inp} placeholder="http://localhost:5124" />
              </Field>
              <Field label={t("auto.verificationProjectRoot", "Verification Project Root")} hint={t("auto.verificationProjectRootHint", "Boş bırakılırsa backend kendi root'unu bulmaya çalışır.")}>
                <input value={settings["VerificationJob:ProjectRoot"]} onChange={e => set("VerificationJob:ProjectRoot", e.target.value)} className={inp} placeholder="C:\\PROJECTS\\DOTNET\\Ecom" />
              </Field>
              <Field label={t("auto.verificationLogPath", "Verification Log Path")} hint={t("auto.verificationLogPathHint", "Boş bırakılırsa dotnet-ecom-docs/VERIFICATION_LOG.md hedeflenir.")}>
                <input value={settings["VerificationJob:LogFilePath"]} onChange={e => set("VerificationJob:LogFilePath", e.target.value)} className={inp} placeholder="C:\\PROJECTS\\DOTNET\\dotnet-ecom-docs\\VERIFICATION_LOG.md" />
              </Field>
              <Field label={t("auto.lintTodoPath", "Lint TODO Path")} hint={t("auto.lintTodoPathHint", "Admin lint backlog dosyasının konumu.")}>
                <input value={settings["AdminLintAudit:TodoPath"]} onChange={e => set("AdminLintAudit:TodoPath", e.target.value)} className={inp} placeholder="TODO_PENDING.md" />
              </Field>
            </div>
          </Section>
        </div>
      )}

      {/* ── Bildirimler ── */}
      {tab === "bildirimler" && (
        <div className="space-y-5">
          <Section title="Uyarı & Bildirim Ayarları" icon={<BellRing size={16} />}
            subtitle="Modül sağlık kontrolleri ve sistem uyarıları için yetkili e-posta adreslerini yönetin.">

            {/* Etkin/Pasif toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                {alertEnabled ? <Bell size={18} className="text-teal-600" /> : <BellOff size={18} className="text-slate-400" />}
                <div>
                  <p className="text-sm font-semibold text-slate-700">Uyarı E-postaları</p>
                  <p className="text-xs text-slate-400">Modül sağlık job&apos;ı sorun tespit ettiğinde aşağıdaki adreslere otomatik uyarı gönderir</p>
                </div>
              </div>
              <button
                onClick={() => setAlertEnabled(v => !v)}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${alertEnabled ? "bg-teal-500" : "bg-slate-300"}`}>
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${alertEnabled ? "translate-x-5.5" : "translate-x-0.5"}`} />
              </button>
            </div>

            {/* E-posta listesi */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Yetkili E-posta Adresleri</p>
              {alertEmails.length === 0 && (
                <p className="text-xs text-slate-400 italic">Henüz adres eklenmedi. Eklenen adresler uyarı alır.</p>
              )}
              {alertEmails.map((email, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="flex-1 text-sm text-slate-700 font-mono">{email}</span>
                  <button onClick={() => setAlertEmails(prev => prev.filter((_, i) => i !== idx))}
                    className="text-slate-300 hover:text-red-500 transition"><X size={14} /></button>
                </div>
              ))}
              {/* Yeni ekle */}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={alertNewEmail}
                  onChange={e => setAlertNewEmail(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && alertNewEmail.includes("@")) {
                      setAlertEmails(prev => [...prev, alertNewEmail.trim()]);
                      setAlertNewEmail("");
                    }
                  }}
                  placeholder="yeni@adres.com"
                  className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <button
                  onClick={() => {
                    if (alertNewEmail.includes("@")) {
                      setAlertEmails(prev => [...prev, alertNewEmail.trim()]);
                      setAlertNewEmail("");
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded-xl transition">
                  <Plus size={13} /> Ekle
                </button>
              </div>
            </div>

            {/* Aksiyon butonları */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={saveAlertSettings}
                disabled={alertSaving}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2.5 rounded-xl disabled:opacity-50 transition">
                {alertSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {alertSaved ? "Kaydedildi!" : "Kaydet"}
              </button>
              <button
                onClick={sendTestAlert}
                disabled={alertTesting || alertEmails.length === 0}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 hover:border-slate-300 bg-white px-4 py-2.5 rounded-xl disabled:opacity-50 transition">
                {alertTesting ? <Loader2 size={14} className="animate-spin" /> : <TestTube size={14} />}
                Test Maili Gönder
              </button>
              {alertTestMsg && (
                <span className={`text-xs font-medium px-2.5 py-1.5 rounded-lg ${alertTestMsg.includes("gönderildi") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {alertTestMsg}
                </span>
              )}
            </div>
          </Section>

          <Section title="Uyarı Koşulları" icon={<AlertTriangle size={16} />}
            subtitle="ModuleHealthCheckJob saatlik çalışır ve aşağıdaki koşullardan herhangi biri gerçekleştiğinde uyarı gönderir.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: "💬", label: "Onay bekleyen yorumlar", detail: "7 günden uzun süre bekleyen yorumlar" },
                { icon: "↩️", label: "Açık iade talepleri", detail: "5 günden uzun süre bekleyen RefundRequested siparişler" },
                { icon: "🧾", label: "Hata durumundaki faturalar", detail: "InvoiceStatus = Error" },
                { icon: "💳", label: "Başarısız ödemeler", detail: "Son 24 saatte Failed ödeme" },
                { icon: "📦", label: "Kritik stok altı ürünler", detail: "Miktar ≤ CriticalStockLevel" },
                { icon: "🚚", label: "Teslimat başarısız", detail: "FailedDelivery durumundaki kargolar" },
              ].map(({ icon, label, detail }) => (
                <div key={label} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="text-xs text-slate-400">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">Job ayarlarını değiştirmek için Admin &gt; Job Yönetimi &gt; ModuleHealthCheckJob sayfasına gidin.</p>
          </Section>
        </div>
      )}

      {/* ── Dil ── */}
      {tab === "dil" && (
        <div className="space-y-5">
          <Section
            title="Dil Seçici"
            icon={<Languages size={16} />}
            subtitle="Müşteri sitesinin header'ında dil değiştirme alanının görünüp görünmeyeceğini buradan yönetin. Değişiklik kaydedildikten sonra müşteri sitesi otomatik yansıtır."
          >
            <ToggleRow
              label="Dil Seçiciyi Göster"
              checked={settings.CustomerLanguageSwitcherEnabled === "true"}
              onToggle={() => set("CustomerLanguageSwitcherEnabled", settings.CustomerLanguageSwitcherEnabled === "true" ? "false" : "true")}
              hint="Aktif olduğunda müşteri sitesi header'ında dil seçici görünür. Pasif yapıldığında dil seçici tamamen gizlenir."
            />
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

          {false && <Section title="__removed__" icon={<span/>}
            subtitle="">

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
                    <code className="bg-amber-100 px-1 rounded">&quot;License&quot;</code> anahtarı eksik veya boş.
                    Aşağıdaki rehberi takip ederek yapılandır.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Aktivasyon Anahtarı</p>
                    <p className="font-mono text-sm font-semibold text-slate-700 tracking-widest">{devKeyStatus!.maskedKey ?? "****-****-****-****"}</p>
                    {!devKeyStatus!.revealPasswordSet && (
                      <p className="text-[10px] text-amber-600 mt-1">Görüntüleme şifresi henüz ayarlanmamış (DevRevealPassword eksik).</p>
                    )}
                  </div>
                  <button onClick={openRevealModal} disabled={!devKeyStatus!.revealPasswordSet}
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
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Adım 1 — Token&apos;ı Görüntüle</p>
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
                    <Shield size={10} /> appsettings.Development.json gitignore&apos;dadır — token git&apos;e commit edilmez.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Adım 3 — Uygulamayı Yeniden Başlat</p>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-[10px] font-mono">
                    <p className="text-slate-400">{'# backend/ dizininden'}</p>
                    <p className="text-teal-300">{'dotnet run --project src/Ecom.API'}</p>
                  </div>
                  <p className="text-xs text-slate-500">Başarılıysa bu sayfaya geri dön — durum &quot;Yapılandırılmış&quot; olarak güncellenir.</p>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Sorun Giderme</p>
                  {[
                    { s: "Uygulama başlamıyor", c: "Token eksik veya imzası hatalı. Terminal&apos;deki hatayı oku ve token&apos;ı tekrar kopyala/yapıştır." },
                    { s: "Giriş 401 veriyor", c: "JWT anahtarı lisanstan türetilir. Token değişmişse oturumu kapatıp tekrar giriş yap." },
                    { s: "Tüm API&apos;ler 503 veriyor", c: "LicenseMiddleware engelledi. Dosyaya yapıştırılan token tam ve tek satır olmalı." },
                  ].map(r => (
                    <div key={r.s} className="flex gap-2 text-xs">
                      <span className="text-red-500 font-semibold shrink-0 w-40">{r.s}</span>
                      <span className="text-red-700">{r.c}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </Section>}

          {/* ── Lisans Üretici Sistem tabından Lisans tabına taşındı ── */}
          {false && isSuperAdmin && (
            <Section title="Lisans Üretici" icon={<KeyRound size={16} />}
              subtitle="RSA-2048 private key ile yeni lisans token'ı üretir. Private key tarayıcıdan çıkmaz — imzalama tamamen client-side yapılır.">

              <div className="space-y-4">
                {/* Private key */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Private Key (PKCS8 DER, Base64)</label>
                  <textarea
                    rows={4}
                    value={licGenPrivKey}
                    onChange={e => { setLicGenPrivKey(e.target.value); setLicGenError(""); setLicGenToken(null); }}
                    placeholder="MIIEvgIBADANBgkqhkiG9w0BAQEFAASC..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">Issuer</label>
                    <p className="text-[10px] text-slate-400 mb-1.5">Kim verdi? Token&apos;da <code className="bg-slate-100 px-0.5 rounded">iss</code> olarak saklanır — izlenebilirlik içindir, doğrulamayı etkilemez.</p>
                    <input value={licGenIssuer} onChange={e => setLicGenIssuer(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Geçerlilik Başlangıcı</label>
                    <input type="date" value={licGenNbf} onChange={e => setLicGenNbf(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Son Geçerlilik</label>
                    <input type="date" value={licGenExp} onChange={e => setLicGenExp(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>

                {/* Generate button */}
                <button onClick={handleGenerateLicense} disabled={licGenLoading || !licGenPrivKey.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {licGenLoading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  Token Üret
                </button>

                {/* Error */}
                {licGenError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    {licGenError}
                  </div>
                )}

                {/* Result */}
                {licGenToken && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-700">Token üretildi</span>
                    </div>
                    <div className="relative bg-slate-900 rounded-xl p-4">
                      <p className="font-mono text-[10px] text-emerald-300 break-all leading-relaxed pr-16">{licGenToken}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(licGenToken!); setLicGenCopied(true); setTimeout(() => setLicGenCopied(false), 2000); }}
                        className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-semibold rounded-lg transition">
                        {licGenCopied ? <CheckCircle size={11} /> : <Save size={11} />}
                        {licGenCopied ? "Kopyalandı" : "Kopyala"}
                      </button>
                    </div>
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-start gap-2">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                      Bu token, sunucudaki <code className="bg-amber-100 px-1 rounded">ECOM_LICENSE</code> ortam değişkenine veya <code className="bg-amber-100 px-1 rounded">appsettings</code> dosyasına yapıştırın. API yeniden başlatılmalıdır.
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-start gap-2">
                  <Lock size={11} className="shrink-0 mt-0.5 text-slate-400" />
                  Private key yalnızca bu tarayıcı sekmesinde kullanılır. Sunucuya gönderilmez.
                </div>
              </div>
            </Section>
          )}

          {/* ── IP Whitelist (SuperAdmin only) ── */}
          {isSuperAdmin && (
            <Section title="IP Erişim Kısıtlaması" icon={<Shield size={16} />}
              subtitle="Yalnızca izin listesindeki IP adreslerinden /api/admin/* isteklerine izin verir. Loopback (127.0.0.1, ::1) her zaman izin verilir. Değişiklikler 60 saniye içinde etkin olur.">
              <div className="space-y-4">
                {/* Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">IP Whitelist Aktif</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ipEnabled
                        ? "Aktif — Sadece listedeki IP'ler admin API'ye erişebilir."
                        : "Pasif — Tüm IP'ler admin API'ye erişebilir."}
                    </p>
                  </div>
                  <button onClick={() => setIpEnabled(v => !v)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${ipEnabled ? "bg-red-500" : "bg-slate-300"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${ipEnabled ? "left-7" : "left-1"}`} />
                  </button>
                </div>

                {ipEnabled && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-start gap-2">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <span>
                      <strong>Dikkat:</strong> Kaydet&apos;e basmadan önce kendi IP&apos;nizi listeye ekleyin.
                      Aksi hâlde admin paneline erişiminiz kesilebilir.
                    </span>
                  </div>
                )}

                {/* IP listesi */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">İzin Verilen IP Adresleri</p>
                  {ipList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Henüz IP eklenmedi.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {ipList.map(ip => (
                        <div key={ip} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                          <span className="flex-1 font-mono text-xs text-slate-700">{ip}</span>
                          <button onClick={() => setIpList(prev => prev.filter(x => x !== ip))}
                            className="text-slate-400 hover:text-red-500 transition">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Yeni IP ekle */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ipNewEntry}
                      onChange={e => setIpNewEntry(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && ipNewEntry.trim() && !ipList.includes(ipNewEntry.trim())) {
                          setIpList(prev => [...prev, ipNewEntry.trim()]);
                          setIpNewEntry("");
                        }
                      }}
                      placeholder="1.2.3.4"
                      className={inp + " flex-1 font-mono text-sm"}
                    />
                    <button
                      type="button"
                      disabled={!ipNewEntry.trim() || ipList.includes(ipNewEntry.trim())}
                      onClick={() => {
                        if (ipNewEntry.trim() && !ipList.includes(ipNewEntry.trim())) {
                          setIpList(prev => [...prev, ipNewEntry.trim()]);
                          setIpNewEntry("");
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition disabled:opacity-40">
                      <Plus size={13} /> Ekle
                    </button>
                  </div>
                </div>

                {/* Kaydet */}
                <button onClick={saveIpWhitelist} disabled={ipSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                  {ipSaving ? <Loader2 size={14} className="animate-spin" /> : ipSaved ? <CheckCircle size={14} /> : <Save size={14} />}
                  {ipSaved ? "Kaydedildi!" : "Kaydet"}
                </button>
              </div>
            </Section>
          )}

        </div>
      )}

      {/* ── Revoke Assignment Modal ── */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Lisans Atamasını İptal Et</h3>
                <p className="text-xs text-slate-500 mt-1">Bu işlem geri alınamaz. Kullanıcının platform erişimi hemen sona erer.</p>
              </div>
              <button onClick={() => setRevokeTarget(null)} className="ml-auto text-slate-400 hover:text-slate-700 transition p-1 rounded-lg shrink-0">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">İptal edilecek kullanıcı</p>
              <p className="text-sm font-bold text-slate-800">{revokeTarget.adminName || revokeTarget.adminEmail}</p>
              <p className="text-xs text-slate-500">{revokeTarget.adminEmail}</p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>Bu kullanıcı lisans gerektiren tüm sayfalara erişemez olacak. İptal işlemi sonrası yeni bir lisans ataması yapılabilir.</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setRevokeTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition font-medium">
                Vazgeç
              </button>
              <button onClick={executeRevoke} disabled={revokeLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-50">
                {revokeLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                {revokeLoading ? "İptal ediliyor..." : "Evet, İptal Et"}
              </button>
            </div>
          </div>
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

          {/* ── 1. Aktivasyon Anahtarı ── */}
          <Section title="Aktivasyon Anahtarı" icon={<KeyRound size={16} />}
            subtitle={isSuperAdmin ? "Platform lisans anahtarı — SuperAdmin olarak şifresiz görüntülüyorsunuz." : "Size atanmış lisans anahtarını görüntülemek için sistem yöneticinizden aldığınız şifreyi girin."}>

            {/* Bilgi paneli */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Aktivasyon Anahtarı Nedir?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-blue-700">
                {[
                  { icon: "🔑", label: "Ne?",            value: "RSA-2048 imzalı platform lisans token'ı. JSON payload (uygulama/yayıncı/tarih) + dijital imza içerir." },
                  { icon: "⚙️", label: "Ne için?",       value: "API başlaması için zorunlu (ECOM_LICENSE). JWT signing key de bu token'dan türetilir; token değişirse tüm oturumlar geçersiz olur." },
                  { icon: "👁", label: "Kim görebilir?", value: "SuperAdmin şifresiz görür. Regular Admin, SuperAdmin'in atadığı lisansı görüntüleme şifresiyle erişebilir." },
                  { icon: "📋", label: "Format?",        value: "base64url(JSON payload) + \".\" + base64url(RSA imza). Tek satır, baştaki/sondaki boşluklar geçersiz kılar." },
                ].map(r => (
                  <div key={r.label} className="flex gap-1.5">
                    <span className="shrink-0">{r.icon}</span>
                    <span><span className="font-semibold">{r.label} </span>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {devKeyLoading ? (
              <div className="flex items-center justify-center h-16 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin mr-2" /> Yükleniyor...
              </div>
            ) : !devKeyStatus?.isConfigured ? (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <Shield size={15} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-semibold">Platform lisansı yapılandırılmamış</p>
                  <p className="text-xs mt-1 text-amber-700">Sunucuda <code className="bg-amber-100 px-1 rounded">ECOM_LICENSE</code> ortam değişkeni eksik. Lisans Üretici bölümünden token üretin ve sunucuya ekleyin.</p>
                </div>
              </div>
            ) : isSuperAdmin ? (
              /* SuperAdmin: tam anahtarı şifresiz göster */
              <div className="space-y-3">
                {/* Durum bandı */}
                <div className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border ${devKeyStatus.isValid ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                  <Shield size={12} className="shrink-0" />
                  {devKeyStatus.isValid
                    ? `Lisans geçerli · Yayıncı: ${devKeyStatus.issuer ?? "—"} · Geçerlilik: ${devKeyStatus.notBefore} – ${devKeyStatus.expiresAt}`
                    : `Lisans geçersiz: ${devKeyStatus.validationError}`}
                </div>

                {/* Tam anahtar */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Platform Lisans Token</p>
                    {superAdminKeyVisible && superAdminKeyCountdown > 0 && (
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        {superAdminKeyCountdown}s
                      </span>
                    )}
                  </div>
                  {superAdminKeyVisible ? (
                    <div className="relative bg-slate-900 rounded-xl p-4">
                      <p className="font-mono text-[10px] text-emerald-300 break-all leading-relaxed pr-28">{devKeyStatus.fullKey}</p>
                      <div className="absolute top-3 right-3 flex gap-1">
                        <button
                          onClick={() => { navigator.clipboard.writeText(devKeyStatus.fullKey ?? ""); setFullKeyCopied(true); setTimeout(() => setFullKeyCopied(false), 2000); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-semibold rounded-lg transition">
                          {fullKeyCopied ? <CheckCircle size={11} /> : <Save size={11} />}
                          {fullKeyCopied ? "Kopyalandı" : "Kopyala"}
                        </button>
                        <button onClick={() => { setSuperAdminKeyVisible(false); setSuperAdminKeyCountdown(0); if (superAdminKeyTimer.current) clearTimeout(superAdminKeyTimer.current); if (superAdminKeyTick.current) clearInterval(superAdminKeyTick.current); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-[10px] font-semibold rounded-lg transition">
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={showSuperAdminKey}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition">
                      <Eye size={13} /> Görüntüle (15s)
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  Bu token sunucudaki <code className="bg-amber-100 px-1 rounded">ECOM_LICENSE</code> ortam değişkeninde saklanmalıdır. Token değiştirilirse API yeniden başlatılmalıdır.
                </div>
              </div>
            ) : (
              /* Regular Admin: atanan lisansı görüntüle */
              <div className="space-y-4">
                {!myLicense ? (
                  <>
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                      <Shield size={12} className="shrink-0 mt-0.5" />
                      Sistem yöneticiniz size bir lisans atadıysa, e-posta ile iletilen görüntüleme şifrenizi girerek erişebilirsiniz.
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Görüntüleme Şifresi</label>
                      <input
                        type="password"
                        value={myViewPassword}
                        onChange={e => { setMyViewPassword(e.target.value); setMyViewError(""); }}
                        onKeyDown={e => e.key === "Enter" && handleRevealMyLicense()}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tracking-widest"
                      />
                      {myViewError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <XCircle size={11} /> {myViewError}
                        </p>
                      )}
                    </div>
                    <button onClick={handleRevealMyLicense} disabled={myViewLoading || !myViewPassword.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                      {myViewLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                      Lisansımı Görüntüle
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border bg-emerald-50 border-emerald-200 text-emerald-700`}>
                      <Shield size={12} className="shrink-0" />
                      Lisans görüntülendi · Uygulama: {myLicense.app} · Yayıncı: {myLicense.issuer} · Geçerlilik: {myLicense.notBefore} – {myLicense.expiresAt}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Lisans Token</p>
                        {myLicCountdown > 0 && (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            {myLicCountdown}s
                          </span>
                        )}
                      </div>
                      <div className="relative bg-slate-900 rounded-xl p-4">
                        <p className="font-mono text-[10px] text-emerald-300 break-all leading-relaxed pr-16">{myLicense.licenseToken}</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(myLicense.licenseToken); setMyLicCopied(true); setTimeout(() => setMyLicCopied(false), 2000); }}
                          className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-semibold rounded-lg transition">
                          {myLicCopied ? <CheckCircle size={11} /> : <Save size={11} />}
                          {myLicCopied ? "Kopyalandı" : "Kopyala"}
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-600 flex items-center gap-1">
                      <AlertTriangle size={10} /> {myLicCountdown > 0 ? `${myLicCountdown} saniye sonra otomatik gizlenecek.` : "Token gizlendi. Tekrar görmek için şifreyi yeniden girin."}
                    </p>
                    <button onClick={() => { setMyLicense(null); setMyViewPassword(""); setMyLicCountdown(0); if (myLicTimer.current) clearTimeout(myLicTimer.current); if (myLicTick.current) clearInterval(myLicTick.current); }}
                      className="text-xs text-slate-400 hover:text-slate-600 underline transition">
                      Şimdi Gizle
                    </button>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* ── 2. Lisans Üretici (yalnızca SuperAdmin) ── */}
          {isSuperAdmin && (
            <Section title="Lisans Üretici" icon={<KeyRound size={16} />}
              subtitle="RSA-2048 private key ile yeni lisans token'ı üretir. Private key tarayıcıdan çıkmaz — imzalama tamamen client-side yapılır.">

              <div className="space-y-4">

                {/* Anahtar Çifti Üretici */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-0.5">Yeni RSA-2048 Anahtar Çifti Üret</p>
                    <p className="text-[11px] text-slate-500">Hiç private key&apos;iniz yoksa buradan üretin. Private key aşağıya, public key LicenseValidator.cs&apos;e yapıştırılır.</p>
                  </div>
                  <button onClick={handleGenerateKeyPair} disabled={licGenKeyPairLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#12304A] hover:bg-[#1a4670] text-white text-xs font-semibold rounded-xl transition disabled:opacity-50">
                    {licGenKeyPairLoading ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
                    {licGenKeyPairLoading ? "Üretiliyor..." : "Anahtar Çifti Üret"}
                  </button>
                  {licGenPubKey && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                        <AlertTriangle size={11} /> Public key — LicenseValidator.cs&apos;e yapıştırın
                      </div>
                      <div className="relative bg-slate-900 rounded-xl p-3">
                        <p className="font-mono text-[10px] text-amber-300 break-all leading-relaxed pr-16">{licGenPubKey}</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(licGenPubKey); setLicGenPubKeyCopied(true); setTimeout(() => setLicGenPubKeyCopied(false), 2000); }}
                          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-semibold rounded-lg transition">
                          {licGenPubKeyCopied ? <CheckCircle size={11} /> : <Save size={11} />}
                          {licGenPubKeyCopied ? "Kopyalandı" : "Kopyala"}
                        </button>
                      </div>
                    <p className="text-[10px] text-slate-400">Private key aşağıda otomatik dolduruldu. Sayfayı kapatmadan not alın — bir daha göremezsiniz.</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Private Key (PKCS8 DER, Base64)</label>
                  <textarea
                    rows={4}
                    value={licGenPrivKey}
                    onChange={e => { setLicGenPrivKey(e.target.value); setLicGenError(""); setLicGenToken(null); }}
                    placeholder="MIIEvgIBADANBgkqhkiG9w0BAQEFAASC... (yukarıdaki buton ile üretin veya mevcut key'i yapıştırın)"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">Issuer</label>
                    <p className="text-[10px] text-slate-400 mb-1.5">Token&apos;da <code className="bg-slate-100 px-0.5 rounded">iss</code> olarak saklanır — izlenebilirlik içindir.</p>
                    <input value={licGenIssuer} onChange={e => setLicGenIssuer(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">Host <span className="text-slate-400 font-normal">(opsiyonel)</span></label>
                    <p className="text-[10px] text-slate-400 mb-1.5">Sunucu hostname veya IP. Doldurulursa lisans <strong>yalnızca bu sunucuda</strong> çalışır.</p>
                    <input value={licGenHost} onChange={e => setLicGenHost(e.target.value)}
                      placeholder="178.105.230.111 veya api.domain.com"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Geçerlilik Başlangıcı</label>
                    <input type="date" value={licGenNbf} onChange={e => setLicGenNbf(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Son Geçerlilik</label>
                    <input type="date" value={licGenExp} onChange={e => setLicGenExp(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>

                <button onClick={handleGenerateLicense} disabled={licGenLoading || !licGenPrivKey.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {licGenLoading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  Token Üret
                </button>

                {licGenError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    {licGenError}
                  </div>
                )}

                {licGenToken && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-700">Token üretildi — Lisans Atama bölümüne yapıştırabilirsiniz.</span>
                    </div>
                    <div className="relative bg-slate-900 rounded-xl p-4">
                      <p className="font-mono text-[10px] text-emerald-300 break-all leading-relaxed pr-16">{licGenToken}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(licGenToken!); setLicGenCopied(true); setTimeout(() => setLicGenCopied(false), 2000); }}
                        className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-semibold rounded-lg transition">
                        {licGenCopied ? <CheckCircle size={11} /> : <Save size={11} />}
                        {licGenCopied ? "Kopyalandı" : "Kopyala"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-start gap-2">
                  <Lock size={11} className="shrink-0 mt-0.5 text-slate-400" />
                  Private key yalnızca bu tarayıcı sekmesinde kullanılır. Sunucuya gönderilmez.
                </div>
              </div>
            </Section>
          )}

          {/* ── 3. Kullanıcıya Lisans Ata (yalnızca SuperAdmin) ── */}
          {isSuperAdmin && (
            <Section title="Kullanıcıya Lisans Ata" icon={<Users size={16} />}
              subtitle="Ürettiğiniz lisans tokenini bir admin kullanıcıya atayın. Sistem otomatik şifre üretir ve kullanıcıya e-posta gönderir.">

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">Admin Kullanıcı</label>
                    <p className="text-[10px] text-slate-400 mb-1.5">E-posta adresi veya kullanıcının tam adı (Ad Soyad) girilebilir.</p>
                    <input
                      type="text"
                      value={licAssignEmail}
                      onChange={e => { setLicAssignEmail(e.target.value); setLicAssignError(""); setLicAssignResult(null); }}
                      placeholder="admin@example.com veya Ad Soyad"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notlar (isteğe bağlı)</label>
                    <input
                      value={licAssignNotes}
                      onChange={e => setLicAssignNotes(e.target.value)}
                      placeholder="Bu lisansın amacı..."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lisans Token</label>
                  <textarea
                    rows={3}
                    value={licAssignToken}
                    onChange={e => { setLicAssignToken(e.target.value); setLicAssignError(""); setLicAssignResult(null); }}
                    placeholder="eyJhcHAi... (Lisans Üretici'den kopyalanan token)"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                <button onClick={handleAssignLicense} disabled={licAssignLoading || !licAssignEmail.trim() || !licAssignToken.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {licAssignLoading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  Lisansı Ata ve Mail Gönder
                </button>

                {licAssignError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    {licAssignError}
                  </div>
                )}

                {licAssignResult && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      {licAssignResult.message}
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Yedek Görüntüleme Şifresi (tek sefer görünür)</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-base font-bold text-amber-900 tracking-widest flex-1">{licAssignResult.viewPassword}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(licAssignResult.viewPassword);
                            setCopiedViewPwd(true);
                            setTimeout(() => setCopiedViewPwd(false), 2000);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors bg-amber-100 hover:bg-amber-200 text-amber-700"
                        >
                          <Copy size={11} />
                          {copiedViewPwd ? "Kopyalandı!" : "Kopyala"}
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-700">Bu şifre bir kez gösterilir. Güvenli bir yere not alın.</p>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ── 4. Kullanıcı Atamaları (yalnızca SuperAdmin) ── */}
          {isSuperAdmin && (
            <Section title="Kullanıcı Atamaları" icon={<Users size={16} />}
              subtitle="Sisteme atanmış tüm lisanslar. İptal edilen atamalar o kullanıcının erişimini sona erdirir.">

              {licAssignmentsLoading ? (
                <div className="flex items-center justify-center h-16 text-slate-400 text-sm">
                  <Loader2 size={15} className="animate-spin mr-2" /> Yükleniyor...
                </div>
              ) : licAssignments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                  Henüz lisans ataması yapılmadı.
                </div>
              ) : (
                <div className="space-y-2">
                  {licAssignments.map((a: { id: string; adminEmail: string; adminName: string; maskedToken: string; isRevoked: boolean; revokedReason?: string; createdDate: string; updatedDate?: string; licenseInfo?: { Issuer: string; ExpiresAt: string } }) => (
                    <div key={a.id} className={`rounded-xl border ${a.isRevoked ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200"}`}>
                      <div className="flex items-start justify-between gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-800">{a.adminName || a.adminEmail}</p>
                            <span className="text-[10px] text-slate-400">{a.adminEmail}</span>
                            {a.isRevoked ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[9px] font-bold uppercase" title={a.revokedReason ?? ""}>
                                İptal Edildi{a.revokedReason ? ` — ${a.revokedReason}` : ""}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-bold uppercase">Aktif</span>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{a.maskedToken}</p>
                          {a.licenseInfo && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Yayıncı: {a.licenseInfo.Issuer} · Son: {a.licenseInfo.ExpiresAt}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-300 mt-0.5">
                            Atandı: {new Date(a.createdDate).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                            {a.isRevoked && a.updatedDate && ` · İptal: ${new Date(a.updatedDate).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}`}
                          </p>
                        </div>
                        {!a.isRevoked && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => handleResetViewPassword(a.id, a.adminEmail)}
                              className="text-[10px] text-amber-600 hover:text-amber-800 border border-amber-200 hover:bg-amber-50 rounded-lg px-2 py-1 transition font-semibold">
                              Şifreyi Yenile
                            </button>
                            <button onClick={() => setRevokeTarget({ id: a.id, adminEmail: a.adminEmail, adminName: a.adminName })}
                              className="text-[10px] text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-lg px-2 py-1 transition font-semibold">
                              İptal Et
                            </button>
                          </div>
                        )}
                      </div>
                      {resetResults[a.id] && (
                        <div className="mx-3 mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <span className="text-[10px] text-amber-700 font-semibold shrink-0">Yeni Şifre:</span>
                          <code className="flex-1 font-mono text-xs text-amber-900 tracking-widest">{resetResults[a.id]}</code>
                          <button onClick={() => copyResetPassword(a.id, resetResults[a.id])}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 transition shrink-0">
                            {copiedResetId === a.id ? "✓ Kopyalandı" : "Kopyala"}
                          </button>
                          <button onClick={() => setResetResults(prev => { const n = { ...prev }; delete n[a.id]; return n; })}
                            className="text-amber-400 hover:text-amber-700 transition shrink-0 text-sm leading-none">×</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => { loadLicenseAssignments(); loadLicenseHistory(); }} disabled={licAssignmentsLoading}
                className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition">
                <RefreshCw size={11} className={licAssignmentsLoading ? "animate-spin" : ""} /> Yenile
              </button>
            </Section>
          )}

          {/* ── 4b. Lisans Geçmişi (yalnızca SuperAdmin) ── */}
          {isSuperAdmin && (
            <Section title="Lisans Geçmişi" icon={<Activity size={16} />}
              subtitle="Tüm lisans atama, iptal ve şifre yenileme hareketleri. Otomatik iptal işlemleri de burada görünür.">

              {licHistoryLoading ? (
                <div className="flex items-center justify-center h-12 text-slate-400 text-sm">
                  <Loader2 size={14} className="animate-spin mr-2" /> Yükleniyor...
                </div>
              ) : licHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                  Henüz lisans hareketi kaydı yok.
                </div>
              ) : (
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {licHistory.map((h: { id: string; action: string; entityId?: string; oldValue?: string; newValue?: string; performedBy?: string; createdDate: string }) => {
                    const actionMeta: Record<string, { label: string; color: string }> = {
                      LicenseAssigned:      { label: "Atandı",          color: "bg-green-100 text-green-700" },
                      LicenseRevoked:       { label: "İptal Edildi",    color: "bg-red-100 text-red-700" },
                      LicenseRevokedAuto:   { label: "Otomatik İptal",  color: "bg-orange-100 text-orange-700" },
                      LicensePasswordReset: { label: "Şifre Yenilendi", color: "bg-amber-100 text-amber-700" },
                    };
                    const meta = actionMeta[h.action] ?? { label: h.action, color: "bg-slate-100 text-slate-600" };
                    return (
                      <div key={h.id} className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[9px] uppercase shrink-0 mt-0.5 ${meta.color}`}>{meta.label}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-700 font-medium truncate">{h.newValue ?? h.oldValue ?? "—"}</p>
                          {h.performedBy && <p className="text-slate-400 text-[10px]">İşlemi yapan: {h.performedBy}</p>}
                        </div>
                        <span className="text-slate-300 text-[10px] shrink-0 whitespace-nowrap">
                          {new Date(h.createdDate).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          )}

          {/* ── 5. Süreç Dokümantasyonu ── */}
          <Section title="Lisans Sistemi Kılavuzu" icon={<BookOpen size={16} />}
            subtitle="Güvenlik mimarisi, kurulum adımları ve sorun giderme rehberi.">

            <div className="space-y-8 text-xs text-slate-600">

              {/* ── Güvenlik Katmanları ── */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Güvenlik Mimarisi — 3 Katman</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { icon: <KeyRound size={14} />, color: "teal",   title: "RSA İmza",          badge: "1 dk cache",    desc: "Her API isteğinde token RSA-2048 PKCS1v15 ile doğrulanır." },
                    { icon: <Lock    size={14} />, color: "violet", title: "Host Binding",       badge: "Opsiyonel",     desc: "Token payload'ına host girilirse yalnızca o sunucuda çalışır." },
                    { icon: <Shield  size={14} />, color: "blue",   title: "Online Aktivasyon",  badge: "5 dk cache",    desc: "Token hash'i Cloudflare Worker'a gönderilir; VALID_HASHES'te yoksa istek reddedilir." },
                  ].map(item => (
                    <div key={item.title} className={`p-4 rounded-xl border flex gap-3 items-start ${
                      item.color === "teal"   ? "bg-teal-50 border-teal-100" :
                      item.color === "violet" ? "bg-violet-50 border-violet-100" :
                                               "bg-blue-50 border-blue-100"}`}>
                      <span className={`mt-0.5 shrink-0 ${
                        item.color === "teal" ? "text-teal-600" : item.color === "violet" ? "text-violet-600" : "text-blue-600"}`}>
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-slate-700 text-[11px]">{item.title}</span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                            item.color === "teal" ? "bg-teal-100 text-teal-700" : item.color === "violet" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Ortam Değişkenleri ── */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Gerekli Ortam Değişkenleri</p>
                <div className="bg-slate-900 rounded-xl p-4 space-y-2.5 font-mono text-[11px]">
                  {[
                    { key: "ECOM_LICENSE",          val: "RSA-2048 lisans token (tek satır, boşluksuz)",       required: true  },
                    { key: "ECOM_PUBLIC_KEY",        val: "SPKI DER base64 public key (PEM başlıkları olmadan)", required: true  },
                    { key: "LICENSE_ACTIVATION_URL", val: "Cloudflare Worker URL — boş bırakılırsa devre dışı", required: false },
                  ].map(v => (
                    <div key={v.key} className="flex items-start gap-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                        v.required ? "bg-red-900 text-red-300" : "bg-slate-700 text-slate-400"}`}>
                        {v.required ? "ZORUNLU" : "OPS."}
                      </span>
                      <div className="min-w-0">
                        <span className="text-teal-400">{v.key}</span>
                        <span className="text-slate-500 font-sans ml-2">{v.val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── VALID_HASHES Nasıl Üretilir ── */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">VALID_HASHES — Cloudflare Worker İçin Hash Üretimi</p>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                    Online aktivasyon şu şekilde çalışır: API her istekte token&apos;ın <strong>SHA-256 hex hash&apos;ini</strong> Cloudflare Worker&apos;a gönderir. Worker bu hash&apos;i <code className="bg-slate-200 px-1 rounded">VALID_HASHES</code> secret listesinde arar — varsa 200, yoksa 403 döner.
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Hash Hesaplama Yöntemleri</p>
                    {[
                      { label: "PowerShell", code: `$t = "eyJhcH..."\n[BitConverter]::ToString([SHA256]::Create().ComputeHash([UTF8]::GetBytes($t.Trim()))).Replace('-','').ToLower()` },
                      { label: "Node.js",    code: `require('crypto').createHash('sha256').update(token.trim()).digest('hex')` },
                      { label: "Bash",       code: `printf '%s' "$TOKEN" | sha256sum | cut -d' ' -f1` },
                    ].map(m => (
                      <div key={m.label} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</div>
                        <pre className="bg-slate-900 text-teal-300 text-[10px] p-3 overflow-x-auto leading-relaxed font-mono">{m.code}</pre>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 space-y-1.5">
                    <p className="font-semibold">Hash sonrası Cloudflare&apos;e ekleme adımları:</p>
                    {[
                      "Cloudflare Dashboard → Workers & Pages → ecom-license-activation",
                      "Settings → Variables and Secrets → VALID_HASHES",
                      "Virgülle ayrılmış hex string listesi: hash1,hash2,...",
                      "Birden fazla lisans varsa hepsini virgülle ekleyin",
                    ].map((s, i) => (
                      <p key={i} className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">›</span>{s}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── SuperAdmin İş Akışı ── */}
              {isSuperAdmin && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SuperAdmin İş Akışı</p>
                    <span className="text-[9px] bg-teal-100 text-teal-700 font-semibold px-2 py-0.5 rounded-full">Yalnızca siz görebilirsiniz</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { step: "1", icon: <KeyRound size={11} />, title: "Anahtar Çifti Üret", tag: "İlk kurulum", items: [
                        "Lisans Üretici > Yeni RSA-2048 Anahtar Çifti Üret butonuna basın",
                        "Private key otomatik textarea'ya dolar — güvenli yerde saklayın, bir daha göremezsiniz",
                        "Public key'i kopyalayın → sunucu .env dosyasında ECOM_PUBLIC_KEY değişkenine yapıştırın",
                      ]},
                      { step: "2", icon: <FileText size={11} />, title: "Token Üret", tag: "Her lisans için", items: [
                        "Private key alanı dolu iken Issuer, NotBefore, ExpiresAt değerlerini girin",
                        "İsteğe bağlı: Host alanına sunucu IP'sini girin — token o sunucuya kilitlenir",
                        "Token Üret'e basın — imzalama WebCrypto ile tarayıcıda yapılır, private key sunucuya gönderilmez",
                      ]},
                      { step: "3", icon: <Shield size={11} />, title: "Platform Aktivasyonu", tag: ".env ayarları", items: [
                        "ECOM_LICENSE → token'ı tek satır, boşluksuz yapıştırın",
                        "ECOM_PUBLIC_KEY → public key'i (SPKI base64) yapıştırın",
                        "Online aktivasyon için: token'ın SHA-256 hash'ini hesaplayın (aşağıdaki VALID_HASHES bölümüne bakın) ve Cloudflare Worker'a ekleyin",
                        "docker compose up -d api komutuyla API'yi yeniden başlatın",
                      ]},
                      { step: "4", icon: <Users size={11} />, title: "Kullanıcıya Ata", tag: "Opsiyonel", items: [
                        "Kullanıcıya Lisans Ata bölümünden e-posta veya Ad Soyad girin",
                        "Sistem otomatik görüntüleme şifresi üretir ve kullanıcıya e-posta gönderir",
                        "Kullanıcı Atamaları listesinden atamaları yönetebilir ve iptal edebilirsiniz",
                      ]},
                    ].map(item => (
                      <div key={item.step} className="flex gap-3 p-4 bg-teal-50 border border-teal-100 rounded-xl">
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          <span className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[11px]">{item.step}</span>
                          <span className="text-teal-400">{item.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-slate-700 text-[11px]">{item.title}</span>
                            <span className="text-[9px] bg-teal-200 text-teal-700 font-semibold px-2 py-0.5 rounded-full">{item.tag}</span>
                          </div>
                          <ul className="space-y-1">
                            {item.items.map((li, i) => (
                              <li key={i} className="flex gap-2 text-slate-500">
                                <span className="text-teal-500 shrink-0 font-bold">›</span>
                                <span className="leading-relaxed">{li}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Admin Kullanıcı Akışı ── */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Admin Kullanıcı Akışı</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { step: "1", icon: <Mail     size={11} />, title: "Mail Bekleyin",      desc: "SuperAdmin lisans atadığında e-posta alırsınız. Mailinde token ve görüntüleme şifreniz (XXXX-XXXX-XXXX-XXXX) yer alır." },
                    { step: "2", icon: <Eye      size={11} />, title: "Şifreyle Görüntüle", desc: "Aktivasyon Anahtarı bölümüne görüntüleme şifrenizi girin. Lisans token'ınız ekranda belirir, kopyalayın." },
                    { step: "3", icon: <KeyRound size={11} />, title: "Token&apos;ı Kullanın",   desc: "Token&apos;ı ECOM_LICENSE değişkenine yapıştırın ve API&apos;yi yeniden başlatın. JWT key bu token&apos;dan türetilir." },
                  ].map(item => (
                    <div key={item.step} className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">{item.step}</span>
                        <span className="text-blue-400">{item.icon}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-[11px] mb-1.5">{item.title}</p>
                        <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Sorun Giderme ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={12} className="text-amber-500" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sorun Giderme</p>
                </div>
                <div className="space-y-2">
                  {[
                    { tag: "API",   color: "red",    s: "API başlamıyor",                   c: "ECOM_LICENSE veya ECOM_PUBLIC_KEY eksik ya da hatalı. Terminal LicenseException mesajını okuyun. Token tek satır, boşluksuz olmalı." },
                    { tag: "API",   color: "red",    s: "Tüm endpoint'ler 503",             c: "LicenseMiddleware engelledi. .env'de token tırnak içinde olmamalı; baştaki/sondaki boşluklar silinmeli." },
                    { tag: "AUTH",  color: "amber",  s: "Giriş 401 veriyor",                c: "JWT key lisanstan türetilir. Token değiştiyse tüm kullanıcıların çıkış yapıp tekrar giriş yapması gerekir." },
                    { tag: "ENV",   color: "amber",  s: "ECOM_PUBLIC_KEY nasıl ayarlanır?", c: ".env dosyasına ECOM_PUBLIC_KEY=<değer> satırı ekleyin. PEM başlık/bitiş satırları olmadan yalnızca base64. docker compose up -d api ile yeniden başlatın." },
                    { tag: "NET",   color: "amber",  s: "Aktivasyon sunucusu hatası",       c: "LICENSE_ACTIVATION_URL erişilemiyor veya token hash VALID_HASHES'te yok. Cloudflare Worker Settings > Variables'ı kontrol edin." },
                    { tag: "HOST",  color: "violet", s: "Lisans bu sunucuya ait değil",     c: "Host binding aktif; token'daki host alanı sunucu hostname/IP ile eşleşmiyor. Host boş bırakarak yeni token üretin." },
                    { tag: "TOKEN", color: "slate",  s: "Token üretilemiyor",               c: "Private key PKCS8 DER base64 olmalı. PEM başlıkları (-----BEGIN PRIVATE KEY-----) girilmemeli, yalnızca base64 içeriği." },
                    { tag: "ATAMA", color: "slate",  s: "Görüntüleme şifresi çalışmıyor",  c: "Büyük/küçük harf duyarlıdır. Birden fazla atama varsa en son atanan şifre geçerlidir." },
                    { tag: "ATAMA", color: "slate",  s: "Kullanıcı bulunamadı",            c: "E-posta tam eşleşmeli veya Ad Soyad tam girilmeli (ör: &apos;Ahmet Yılmaz&apos;). Boşluklara dikkat edin." },
                  ].map(r => (
                    <div key={r.s} className="flex gap-3 items-start p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 font-mono ${
                        r.color === "red"    ? "bg-red-100 text-red-600" :
                        r.color === "amber"  ? "bg-amber-100 text-amber-700" :
                        r.color === "violet" ? "bg-violet-100 text-violet-700" :
                                              "bg-slate-100 text-slate-600"}`}>
                        {r.tag}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-700 mb-0.5">{r.s}</p>
                        <p className="text-slate-500 leading-relaxed">{r.c}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </Section>

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

function ToggleRow({ label, hint, checked, onToggle }: {
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{hint}</p>}
      </div>
      <button
        type="button"
        aria-pressed={checked}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-teal-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
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
