// Ana Sayfa (page.tsx) için i18n key'leri
// Kullanım: Server Component → import { st } from "@/lib/server-i18n" + await st('home2.*')
// Faz 2'de mevcut src/lib/i18n.ts translations objesine birleştirilecek
// NOT: Mevcut i18n.ts'deki 'home.*' key'leriyle çakışmamak için 'home2.*' prefix kullanıldı

export type Lang = "tr" | "en" | "de" | "es";
type Dict = Record<string, string>;

export const anaSayfaKeys: Record<Lang, Dict> = {
  tr: {
    // Meta
    "home2.meta.title": "Ana Sayfa",
    "home2.meta.desc": "Keyifli alışverişin yeni adresi. Binlerce ürün, güvenli ödeme, hızlı teslimat.",
    "home2.meta.og.title": "Keyifli Alışverişin Yeni Adresi",
    "home2.meta.og.desc": "Sevdiğin ürünleri keşfet, güvenle satın al, hızlı teslimatla kapına gelsin.",

    // Spareparts template
    "home2.sp.b2b.badge": "B2B",
    "home2.sp.b2b.apply": "Başvuru yap",
    "home2.sp.hot.label": "🔥 En Çok Aranan:",
    "home2.sp.more_brands": "+{n} Daha ›",
    "home2.sp.hero.default_slogan": "TÜRKİYE'NİN EN BÜYÜK OTO PARÇA MAĞAZASI",
    "home2.sp.hero.default_unit": "BİN ÜRÜN",
    "home2.sp.hero.default_count": "700+",
    "home2.sp.hero.search_btn": "Ara",
    "home2.sp.hero.vehicle_select": "Araç seç",
    "home2.sp.hero.choose_brand": "Marka seç",
    "home2.sp.hero.choose_model": "Model seç",
    "home2.sp.hero.choose_year": "Yıl seç",
    "home2.sp.hero.find_parts": "Parça Bul",
    "home2.sp.promo.view": "İncele →",
    "home2.sp.trusted_brands": "Güvenilir Markalar",
    "home2.sp.guarantee": "Garantili Alışveriş",

    // Marketplace template
    "home2.mp.flash.title": "⚡ Flaş Fırsat",
    "home2.mp.flash.today": "Bugün Son Gün",
    "home2.mp.flash.timer": "Kalan süre:",
    "home2.mp.flash.shop": "Hemen Al →",
    "home2.mp.cats.title": "Kategoriler",
    "home2.mp.cats.all": "Tümüne Bak →",

    // Techstore template
    "home2.ts.flash.title": "⚡ Flaş Fırsat",
    "home2.ts.flash.shop": "Hemen Al →",
    "home2.ts.brands.title": "Markalar",
    "home2.ts.limited.badge": "Sınırlı Stok",
    "home2.ts.service.title": "Servis & Garanti",

    // Modern/default template
    "home2.hero.shop_btn": "Alışverişe Başla →",
    "home2.hero.campaigns_btn": "Kampanyaları Gör",

    // Campaign fallbacks
    "home2.campaign.discount_title": "%40'a Varan İndirim",
    "home2.campaign.discount_sub": "Fırsatı Kaçırma",
    "home2.campaign.freeship_title": "Ücretsiz Kargo",
    "home2.campaign.freeship_sub": "500 TL Üzeri",
    "home2.campaign.newseason_title": "Yeni Sezon Ürünleri",
    "home2.campaign.newseason_sub": "Yeni Gelenler",
    "home2.campaign.bestseller_title": "Çok Satanlar",
    "home2.campaign.bestseller_sub": "En Çok Tercih Edilen",
    "home2.campaign.view": "İncele →",
    "home2.campaign.shop": "Alışverişe Başla →",
    "home2.campaign.discover": "Keşfet →",
    "home2.campaign.view_all": "Hepsini Gör →",

    // Category fallbacks
    "home2.cat.electronics": "Elektronik",
    "home2.cat.fashion": "Moda",
    "home2.cat.home": "Ev & Yaşam",
    "home2.cat.cosmetics": "Kozmetik",
    "home2.cat.mother_child": "Anne & Çocuk",
    "home2.cat.sports": "Spor & Outdoor",

    // Section common
    "home2.see_campaign": "Kampanyaları Gör",
    "home2.no_products": "Ürün bulunamadı.",
  },

  en: {
    "home2.meta.title": "Home",
    "home2.meta.desc": "Your new address for joyful shopping. Thousands of products, secure payment, fast delivery.",
    "home2.meta.og.title": "The New Home of Joyful Shopping",
    "home2.meta.og.desc": "Discover what you love, buy with confidence, get fast delivery to your door.",

    "home2.sp.b2b.badge": "B2B",
    "home2.sp.b2b.apply": "Apply now",
    "home2.sp.hot.label": "🔥 Most Searched:",
    "home2.sp.more_brands": "+{n} More ›",
    "home2.sp.hero.default_slogan": "TURKEY'S LARGEST AUTO PARTS STORE",
    "home2.sp.hero.default_unit": "THOUSAND PRODUCTS",
    "home2.sp.hero.default_count": "700+",
    "home2.sp.hero.search_btn": "Search",
    "home2.sp.hero.vehicle_select": "Select vehicle",
    "home2.sp.hero.choose_brand": "Choose brand",
    "home2.sp.hero.choose_model": "Choose model",
    "home2.sp.hero.choose_year": "Choose year",
    "home2.sp.hero.find_parts": "Find Parts",
    "home2.sp.promo.view": "View →",
    "home2.sp.trusted_brands": "Trusted Brands",
    "home2.sp.guarantee": "Guaranteed Shopping",

    "home2.mp.flash.title": "⚡ Flash Deal",
    "home2.mp.flash.today": "Today Only",
    "home2.mp.flash.timer": "Time left:",
    "home2.mp.flash.shop": "Shop Now →",
    "home2.mp.cats.title": "Categories",
    "home2.mp.cats.all": "View All →",

    "home2.ts.flash.title": "⚡ Flash Deal",
    "home2.ts.flash.shop": "Shop Now →",
    "home2.ts.brands.title": "Brands",
    "home2.ts.limited.badge": "Limited Stock",
    "home2.ts.service.title": "Service & Warranty",

    "home2.hero.shop_btn": "Start Shopping →",
    "home2.hero.campaigns_btn": "View Campaigns",

    "home2.campaign.discount_title": "Up to 40% Off",
    "home2.campaign.discount_sub": "Don't Miss It",
    "home2.campaign.freeship_title": "Free Shipping",
    "home2.campaign.freeship_sub": "Orders over 500 TL",
    "home2.campaign.newseason_title": "New Season Products",
    "home2.campaign.newseason_sub": "New Arrivals",
    "home2.campaign.bestseller_title": "Best Sellers",
    "home2.campaign.bestseller_sub": "Most Preferred",
    "home2.campaign.view": "View →",
    "home2.campaign.shop": "Start Shopping →",
    "home2.campaign.discover": "Discover →",
    "home2.campaign.view_all": "View All →",

    "home2.cat.electronics": "Electronics",
    "home2.cat.fashion": "Fashion",
    "home2.cat.home": "Home & Living",
    "home2.cat.cosmetics": "Cosmetics",
    "home2.cat.mother_child": "Mother & Child",
    "home2.cat.sports": "Sports & Outdoor",

    "home2.see_campaign": "View Campaigns",
    "home2.no_products": "No products found.",
  },

  de: {
    "home2.meta.title": "Startseite",
    "home2.meta.desc": "Ihre neue Adresse für freudiges Einkaufen. Tausende Produkte, sichere Zahlung, schnelle Lieferung.",
    "home2.meta.og.title": "Die neue Heimat des freudigen Einkaufens",
    "home2.meta.og.desc": "Entdecken Sie, was Sie lieben, kaufen Sie mit Vertrauen, erhalten Sie schnelle Lieferung.",

    "home2.sp.b2b.badge": "B2B",
    "home2.sp.b2b.apply": "Jetzt bewerben",
    "home2.sp.hot.label": "🔥 Meist gesucht:",
    "home2.sp.more_brands": "+{n} Mehr ›",
    "home2.sp.hero.default_slogan": "TÜRKEIS GRÖSSTER AUTO-TEILE-MARKT",
    "home2.sp.hero.default_unit": "TAUSEND PRODUKTE",
    "home2.sp.hero.default_count": "700+",
    "home2.sp.hero.search_btn": "Suchen",
    "home2.sp.hero.vehicle_select": "Fahrzeug wählen",
    "home2.sp.hero.choose_brand": "Marke wählen",
    "home2.sp.hero.choose_model": "Modell wählen",
    "home2.sp.hero.choose_year": "Jahr wählen",
    "home2.sp.hero.find_parts": "Teile finden",
    "home2.sp.promo.view": "Ansehen →",
    "home2.sp.trusted_brands": "Vertrauensmarken",
    "home2.sp.guarantee": "Garantiertes Einkaufen",

    "home2.mp.flash.title": "⚡ Flash-Angebot",
    "home2.mp.flash.today": "Nur heute",
    "home2.mp.flash.timer": "Verbleibende Zeit:",
    "home2.mp.flash.shop": "Jetzt kaufen →",
    "home2.mp.cats.title": "Kategorien",
    "home2.mp.cats.all": "Alle ansehen →",

    "home2.ts.flash.title": "⚡ Flash-Angebot",
    "home2.ts.flash.shop": "Jetzt kaufen →",
    "home2.ts.brands.title": "Marken",
    "home2.ts.limited.badge": "Begrenzte Stückzahl",
    "home2.ts.service.title": "Service & Garantie",

    "home2.hero.shop_btn": "Einkaufen starten →",
    "home2.hero.campaigns_btn": "Aktionen ansehen",

    "home2.campaign.discount_title": "Bis zu 40% Rabatt",
    "home2.campaign.discount_sub": "Nicht verpassen",
    "home2.campaign.freeship_title": "Kostenloser Versand",
    "home2.campaign.freeship_sub": "Ab 500 TL Bestellwert",
    "home2.campaign.newseason_title": "Neue Saison Produkte",
    "home2.campaign.newseason_sub": "Neuankömmlinge",
    "home2.campaign.bestseller_title": "Bestseller",
    "home2.campaign.bestseller_sub": "Am meisten bevorzugt",
    "home2.campaign.view": "Ansehen →",
    "home2.campaign.shop": "Einkaufen starten →",
    "home2.campaign.discover": "Entdecken →",
    "home2.campaign.view_all": "Alle ansehen →",

    "home2.cat.electronics": "Elektronik",
    "home2.cat.fashion": "Mode",
    "home2.cat.home": "Heim & Leben",
    "home2.cat.cosmetics": "Kosmetik",
    "home2.cat.mother_child": "Mutter & Kind",
    "home2.cat.sports": "Sport & Outdoor",

    "home2.see_campaign": "Aktionen ansehen",
    "home2.no_products": "Keine Produkte gefunden.",
  },

  es: {
    "home2.meta.title": "Inicio",
    "home2.meta.desc": "Tu nueva dirección para compras felices. Miles de productos, pago seguro, entrega rápida.",
    "home2.meta.og.title": "El nuevo hogar de las compras felices",
    "home2.meta.og.desc": "Descubre lo que amas, compra con confianza, recibe entrega rápida en tu puerta.",

    "home2.sp.b2b.badge": "B2B",
    "home2.sp.b2b.apply": "Solicitar ahora",
    "home2.sp.hot.label": "🔥 Más buscado:",
    "home2.sp.more_brands": "+{n} Más ›",
    "home2.sp.hero.default_slogan": "EL MAYOR MERCADO DE REPUESTOS DE TURQUÍA",
    "home2.sp.hero.default_unit": "MIL PRODUCTOS",
    "home2.sp.hero.default_count": "700+",
    "home2.sp.hero.search_btn": "Buscar",
    "home2.sp.hero.vehicle_select": "Seleccionar vehículo",
    "home2.sp.hero.choose_brand": "Elegir marca",
    "home2.sp.hero.choose_model": "Elegir modelo",
    "home2.sp.hero.choose_year": "Elegir año",
    "home2.sp.hero.find_parts": "Encontrar repuestos",
    "home2.sp.promo.view": "Ver →",
    "home2.sp.trusted_brands": "Marcas de confianza",
    "home2.sp.guarantee": "Compra garantizada",

    "home2.mp.flash.title": "⚡ Oferta flash",
    "home2.mp.flash.today": "Solo hoy",
    "home2.mp.flash.timer": "Tiempo restante:",
    "home2.mp.flash.shop": "Comprar ahora →",
    "home2.mp.cats.title": "Categorías",
    "home2.mp.cats.all": "Ver todas →",

    "home2.ts.flash.title": "⚡ Oferta flash",
    "home2.ts.flash.shop": "Comprar ahora →",
    "home2.ts.brands.title": "Marcas",
    "home2.ts.limited.badge": "Stock limitado",
    "home2.ts.service.title": "Servicio y Garantía",

    "home2.hero.shop_btn": "Empezar a comprar →",
    "home2.hero.campaigns_btn": "Ver campañas",

    "home2.campaign.discount_title": "Hasta 40% de descuento",
    "home2.campaign.discount_sub": "No te lo pierdas",
    "home2.campaign.freeship_title": "Envío gratis",
    "home2.campaign.freeship_sub": "Pedidos superiores a 500 TL",
    "home2.campaign.newseason_title": "Productos nueva temporada",
    "home2.campaign.newseason_sub": "Recién llegados",
    "home2.campaign.bestseller_title": "Los más vendidos",
    "home2.campaign.bestseller_sub": "Los más preferidos",
    "home2.campaign.view": "Ver →",
    "home2.campaign.shop": "Empezar a comprar →",
    "home2.campaign.discover": "Descubrir →",
    "home2.campaign.view_all": "Ver todos →",

    "home2.cat.electronics": "Electrónica",
    "home2.cat.fashion": "Moda",
    "home2.cat.home": "Hogar y Vida",
    "home2.cat.cosmetics": "Cosmética",
    "home2.cat.mother_child": "Madre e Hijo",
    "home2.cat.sports": "Deportes y Aire Libre",

    "home2.see_campaign": "Ver campañas",
    "home2.no_products": "No se encontraron productos.",
  },
};
