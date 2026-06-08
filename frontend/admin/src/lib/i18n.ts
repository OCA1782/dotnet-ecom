export const LANGS = [
  { code: "tr", label: "Türkçe",  flag: "🇹🇷", short: "TR" },
  { code: "en", label: "English", flag: "🇬🇧", short: "EN" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", short: "DE" },
  { code: "es", label: "Español", flag: "🇪🇸", short: "ES" },
] as const;

export type Lang = typeof LANGS[number]["code"];
export const LANG_KEY = "ecom:admin:lang";

type Dict = Record<string, string>;

const TR: Dict = {
  "group.genel": "Genel", "group.katalog": "Katalog", "group.satis": "Satış",
  "group.kullanici": "Kullanıcı", "group.sistem": "Sistem",
  "nav./dashboard": "Dashboard", "nav./raporlar": "Analiz", "nav./hedefler": "Hedefler",
  "nav./urunler": "Ürünler", "nav./kategoriler": "Kategoriler", "nav./markalar": "Markalar",
  "nav./stok": "Stok", "nav./yorumlar": "Yorumlar", "nav./duyurular": "Duyurular",
  "nav./kampanyalar": "Kampanyalar", "nav./imajlar": "İmaj Yönetimi", "nav./belgeler": "Dosya Yönetimi",
  "nav./siparisler": "Siparişler", "nav./odemeler": "Ödemeler", "nav./iade": "İadeler",
  "nav./kuponlar": "Kuponlar", "nav./kargo": "Kargo", "nav./faturalar": "Faturalar",
  "nav./kullanicilar": "Kullanıcılar", "nav./ziyaretciler": "Ziyaretçiler",
  "nav./hareketler": "Hareketler", "nav./takip": "Takip", "nav./dis-kaynaklar": "Dış Kaynaklar",
  "nav./servisler": "Servisler", "nav./kuyruklar": "Kuyruklar", "nav./joblar": "Joblar",
  "nav./dogrulama": "Doğrulama", "nav./dokuman": "Dokümanlar", "nav./deploy": "Deploy",
  "nav./yonetim": "Yönetim", "nav./test": "Test",
  // Page-specific headings
  "page./deploy": "Deploy Yönetimi", "page./faturalar": "Fatura Yönetimi",
  "page./iade": "İade Yönetimi", "page./joblar": "Arka Plan İşleri",
  "page./kargo": "Kargo Takip", "page./kuyruklar": "Kuyruk İzleme",
  "page./servisler": "Servis Durumu", "page./stok": "Stok Yönetimi",
  "page./takip": "Sistem Takibi", "page./test": "Test Merkezi",
  "page./ziyaretciler": "Ziyaretçi Logları", "page./duyurular": "Duyurular & Bültenler",
  "page./hareketler": "Hareketler", "page./dogrulama": "TODO Doğrulama",
};

const EN: Dict = {
  "group.genel": "General", "group.katalog": "Catalog", "group.satis": "Sales",
  "group.kullanici": "Users", "group.sistem": "System",
  "nav./dashboard": "Dashboard", "nav./raporlar": "Analytics", "nav./hedefler": "Goals",
  "nav./urunler": "Products", "nav./kategoriler": "Categories", "nav./markalar": "Brands",
  "nav./stok": "Stock", "nav./yorumlar": "Reviews", "nav./duyurular": "Announcements",
  "nav./kampanyalar": "Campaigns", "nav./imajlar": "Image Manager", "nav./belgeler": "File Manager",
  "nav./siparisler": "Orders", "nav./odemeler": "Payments", "nav./iade": "Returns",
  "nav./kuponlar": "Coupons", "nav./kargo": "Shipping", "nav./faturalar": "Invoices",
  "nav./kullanicilar": "Users", "nav./ziyaretciler": "Visitors",
  "nav./hareketler": "Activity", "nav./takip": "Monitoring", "nav./dis-kaynaklar": "External Sources",
  "nav./servisler": "Services", "nav./kuyruklar": "Queues", "nav./joblar": "Jobs",
  "nav./dogrulama": "Validation", "nav./dokuman": "Docs", "nav./deploy": "Deploy",
  "nav./yonetim": "Management", "nav./test": "Test",
  "page./deploy": "Deploy Manager", "page./faturalar": "Invoice Management",
  "page./iade": "Return Management", "page./joblar": "Background Jobs",
  "page./kargo": "Shipment Tracking", "page./kuyruklar": "Queue Monitor",
  "page./servisler": "Service Status", "page./stok": "Stock Management",
  "page./takip": "System Monitoring", "page./test": "Test Center",
  "page./ziyaretciler": "Visitor Logs", "page./duyurular": "Announcements & Newsletters",
  "page./hareketler": "Activity Log", "page./dogrulama": "TODO Validation",
};

const DE: Dict = {
  "group.genel": "Allgemein", "group.katalog": "Katalog", "group.satis": "Verkauf",
  "group.kullanici": "Benutzer", "group.sistem": "System",
  "nav./dashboard": "Dashboard", "nav./raporlar": "Analyse", "nav./hedefler": "Ziele",
  "nav./urunler": "Produkte", "nav./kategoriler": "Kategorien", "nav./markalar": "Marken",
  "nav./stok": "Lager", "nav./yorumlar": "Bewertungen", "nav./duyurular": "Ankündigungen",
  "nav./kampanyalar": "Kampagnen", "nav./imajlar": "Bildverwaltung", "nav./belgeler": "Dateiverwaltung",
  "nav./siparisler": "Bestellungen", "nav./odemeler": "Zahlungen", "nav./iade": "Rückgaben",
  "nav./kuponlar": "Gutscheine", "nav./kargo": "Versand", "nav./faturalar": "Rechnungen",
  "nav./kullanicilar": "Benutzer", "nav./ziyaretciler": "Besucher",
  "nav./hareketler": "Aktivität", "nav./takip": "Überwachung", "nav./dis-kaynaklar": "Externe Quellen",
  "nav./servisler": "Dienste", "nav./kuyruklar": "Warteschlangen", "nav./joblar": "Jobs",
  "nav./dogrulama": "Validierung", "nav./dokuman": "Dokumentation", "nav./deploy": "Deployment",
  "nav./yonetim": "Verwaltung", "nav./test": "Test",
  "page./deploy": "Deployment-Verwaltung", "page./faturalar": "Rechnungsverwaltung",
  "page./iade": "Rückgabeverwaltung", "page./joblar": "Hintergrundaufgaben",
  "page./kargo": "Sendungsverfolgung", "page./kuyruklar": "Warteschlangenüberwachung",
  "page./servisler": "Dienststatus", "page./stok": "Lagerverwaltung",
  "page./takip": "Systemüberwachung", "page./test": "Testzentrum",
  "page./ziyaretciler": "Besucherlogs", "page./duyurular": "Ankündigungen & Newsletter",
  "page./hareketler": "Aktivitätslog", "page./dogrulama": "TODO Validierung",
};

const ES: Dict = {
  "group.genel": "General", "group.katalog": "Catálogo", "group.satis": "Ventas",
  "group.kullanici": "Usuarios", "group.sistem": "Sistema",
  "nav./dashboard": "Panel", "nav./raporlar": "Análisis", "nav./hedefler": "Objetivos",
  "nav./urunler": "Productos", "nav./kategoriler": "Categorías", "nav./markalar": "Marcas",
  "nav./stok": "Stock", "nav./yorumlar": "Reseñas", "nav./duyurular": "Anuncios",
  "nav./kampanyalar": "Campañas", "nav./imajlar": "Gestor de imágenes", "nav./belgeler": "Gestor de archivos",
  "nav./siparisler": "Pedidos", "nav./odemeler": "Pagos", "nav./iade": "Devoluciones",
  "nav./kuponlar": "Cupones", "nav./kargo": "Envío", "nav./faturalar": "Facturas",
  "nav./kullanicilar": "Usuarios", "nav./ziyaretciler": "Visitantes",
  "nav./hareketler": "Actividad", "nav./takip": "Monitoreo", "nav./dis-kaynaklar": "Fuentes externas",
  "nav./servisler": "Servicios", "nav./kuyruklar": "Colas", "nav./joblar": "Trabajos",
  "nav./dogrulama": "Validación", "nav./dokuman": "Documentación", "nav./deploy": "Despliegue",
  "nav./yonetim": "Gestión", "nav./test": "Prueba",
  "page./deploy": "Gestión de Deploy", "page./faturalar": "Gestión de Facturas",
  "page./iade": "Gestión de Devoluciones", "page./joblar": "Trabajos en Segundo Plano",
  "page./kargo": "Seguimiento de Envíos", "page./kuyruklar": "Monitor de Colas",
  "page./servisler": "Estado de Servicios", "page./stok": "Gestión de Stock",
  "page./takip": "Monitoreo del Sistema", "page./test": "Centro de Pruebas",
  "page./ziyaretciler": "Registros de Visitantes", "page./duyurular": "Anuncios & Boletines",
  "page./hareketler": "Registro de Actividad", "page./dogrulama": "Validación TODO",
};

export const translations: Record<Lang, Dict> = { tr: TR, en: EN, de: DE, es: ES };

export function translate(lang: Lang, key: string, fallback?: string): string {
  return translations[lang][key] ?? fallback ?? key;
}
