// Sepet (sepet/page.tsx) için i18n key'leri
// Kullanım: Client Component → const { t } = useI18n(); t('cart.*')
// NOT: Prefix 'cart.' — mevcut i18n.ts'te 'cart.*' yoktur

export type Lang = "tr" | "en" | "de" | "es";
type Dict = Record<string, string>;

export const sepetKeys: Record<Lang, Dict> = {
  tr: {
    "cart.loading": "Sepet yükleniyor...",
    "cart.empty": "Sepetiniz boş",
    "cart.empty.shop_btn": "Alışverişe Başla",
    "cart.title": "Sepetim",
    "cart.unit": "ürün",
    "cart.selected": "seçili",

    // Ürün satırı
    "cart.item.remove_title": "Kaldır",
    "cart.item.unit_price": "/ ad.",

    // Sil modalı
    "cart.delete.modal.question": "Bu ürünü sepetten kaldırmak istiyor musunuz?",
    "cart.delete.modal.to_wishlist": "Favorilere Ekle & Kaldır",
    "cart.delete.modal.direct": "Direkt Sil",

    // Sonra için
    "cart.later.label": "Daha Sonra",

    // Kupon
    "cart.coupon.title": "İndirim Kuponu",
    "cart.coupon.hint": "(Her siparişte 1 kupon)",
    "cart.coupon.placeholder": "Kupon kodunuzu girin",
    "cart.coupon.apply": "Uygula",
    "cart.coupon.applying": "…",
    "cart.coupon.applied": "Uygulandı ✓",
    "cart.coupon.remove_existing": "Önce mevcut kuponu kaldırın.",

    // Özet
    "cart.summary.title": "Sipariş Özeti",
    "cart.summary.only_selected": "Yalnızca seçili {n} ürün hesaplanıyor",
    "cart.summary.subtotal": "Ara Toplam ({n} ürün)",
    "cart.summary.shipping": "Kargo",
    "cart.summary.shipping_free": "Ücretsiz",
    "cart.summary.discount": "İndirim",
    "cart.summary.total": "Toplam",
    "cart.summary.checkout_btn": "Seçili {n} Ürünle Devam →",
    "cart.summary.select_to_continue": "Devam etmek için ürün seçin",
    "cart.summary.continue_shopping": "Alışverişe Devam Et",
  },

  en: {
    "cart.loading": "Loading cart...",
    "cart.empty": "Your cart is empty",
    "cart.empty.shop_btn": "Start Shopping",
    "cart.title": "My Cart",
    "cart.unit": "item",
    "cart.selected": "selected",

    "cart.item.remove_title": "Remove",
    "cart.item.unit_price": "/ ea.",

    "cart.delete.modal.question": "Do you want to remove this item from your cart?",
    "cart.delete.modal.to_wishlist": "Add to Wishlist & Remove",
    "cart.delete.modal.direct": "Delete Directly",

    "cart.later.label": "Save for Later",

    "cart.coupon.title": "Discount Coupon",
    "cart.coupon.hint": "(1 coupon per order)",
    "cart.coupon.placeholder": "Enter your coupon code",
    "cart.coupon.apply": "Apply",
    "cart.coupon.applying": "…",
    "cart.coupon.applied": "Applied ✓",
    "cart.coupon.remove_existing": "Please remove the existing coupon first.",

    "cart.summary.title": "Order Summary",
    "cart.summary.only_selected": "Only {n} selected item(s) calculated",
    "cart.summary.subtotal": "Subtotal ({n} items)",
    "cart.summary.shipping": "Shipping",
    "cart.summary.shipping_free": "Free",
    "cart.summary.discount": "Discount",
    "cart.summary.total": "Total",
    "cart.summary.checkout_btn": "Continue with {n} selected →",
    "cart.summary.select_to_continue": "Select items to continue",
    "cart.summary.continue_shopping": "Continue Shopping",
  },

  de: {
    "cart.loading": "Warenkorb wird geladen...",
    "cart.empty": "Ihr Warenkorb ist leer",
    "cart.empty.shop_btn": "Einkaufen starten",
    "cart.title": "Mein Warenkorb",
    "cart.unit": "Artikel",
    "cart.selected": "ausgewählt",

    "cart.item.remove_title": "Entfernen",
    "cart.item.unit_price": "/ Stk.",

    "cart.delete.modal.question": "Möchten Sie diesen Artikel aus dem Warenkorb entfernen?",
    "cart.delete.modal.to_wishlist": "Zur Wunschliste hinzufügen & entfernen",
    "cart.delete.modal.direct": "Direkt löschen",

    "cart.later.label": "Für später speichern",

    "cart.coupon.title": "Rabattgutschein",
    "cart.coupon.hint": "(1 Gutschein pro Bestellung)",
    "cart.coupon.placeholder": "Gutscheincode eingeben",
    "cart.coupon.apply": "Anwenden",
    "cart.coupon.applying": "…",
    "cart.coupon.applied": "Angewendet ✓",
    "cart.coupon.remove_existing": "Bitte entfernen Sie zuerst den vorhandenen Gutschein.",

    "cart.summary.title": "Bestellübersicht",
    "cart.summary.only_selected": "Nur {n} ausgewählte Artikel berechnet",
    "cart.summary.subtotal": "Zwischensumme ({n} Artikel)",
    "cart.summary.shipping": "Versand",
    "cart.summary.shipping_free": "Kostenlos",
    "cart.summary.discount": "Rabatt",
    "cart.summary.total": "Gesamt",
    "cart.summary.checkout_btn": "Weiter mit {n} ausgewählt →",
    "cart.summary.select_to_continue": "Artikel auswählen um fortzufahren",
    "cart.summary.continue_shopping": "Weiter einkaufen",
  },

  es: {
    "cart.loading": "Cargando carrito...",
    "cart.empty": "Tu carrito está vacío",
    "cart.empty.shop_btn": "Empezar a comprar",
    "cart.title": "Mi carrito",
    "cart.unit": "artículo",
    "cart.selected": "seleccionado",

    "cart.item.remove_title": "Eliminar",
    "cart.item.unit_price": "/ ud.",

    "cart.delete.modal.question": "¿Deseas eliminar este artículo del carrito?",
    "cart.delete.modal.to_wishlist": "Agregar a favoritos y eliminar",
    "cart.delete.modal.direct": "Eliminar directamente",

    "cart.later.label": "Guardar para después",

    "cart.coupon.title": "Cupón de descuento",
    "cart.coupon.hint": "(1 cupón por pedido)",
    "cart.coupon.placeholder": "Ingresa tu código de cupón",
    "cart.coupon.apply": "Aplicar",
    "cart.coupon.applying": "…",
    "cart.coupon.applied": "Aplicado ✓",
    "cart.coupon.remove_existing": "Por favor elimina el cupón existente primero.",

    "cart.summary.title": "Resumen del pedido",
    "cart.summary.only_selected": "Solo se calculan {n} artículo(s) seleccionado(s)",
    "cart.summary.subtotal": "Subtotal ({n} artículos)",
    "cart.summary.shipping": "Envío",
    "cart.summary.shipping_free": "Gratis",
    "cart.summary.discount": "Descuento",
    "cart.summary.total": "Total",
    "cart.summary.checkout_btn": "Continuar con {n} seleccionado(s) →",
    "cart.summary.select_to_continue": "Selecciona artículos para continuar",
    "cart.summary.continue_shopping": "Continuar comprando",
  },
};
