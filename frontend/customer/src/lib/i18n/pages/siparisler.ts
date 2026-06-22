// Siparişler (hesabim/siparisler/page.tsx + [orderNumber]/page.tsx) için i18n key'leri
// Kullanım: Client Component → const { t } = useI18n(); t('orders.*')

export type Lang = "tr" | "en" | "de" | "es";
type Dict = Record<string, string>;

export const siparislerKeys: Record<Lang, Dict> = {
  tr: {
    "orders.loading": "Yükleniyor...",

    // Sipariş listesi
    "orders.title": "Siparişlerim",
    "orders.empty": "Henüz siparişiniz yok",
    "orders.empty.shop_btn": "Alışverişe Başla",
    "orders.item.unit": "ürün",
    "orders.item.detail": "Detay →",

    // Ödeme uyarısı (listede)
    "orders.pending.warning": "⚠ Ödemeniz tamamlanmadı — siparişinizi kaybetmemek için ödemeye devam edin.",
    "orders.pending.pay_btn": "Ödemeye Devam Et →",
    "orders.pending.redirecting": "Yönlendiriliyor...",

    // Sayfalama
    "orders.page.prev": "← Önceki",
    "orders.page.next": "Sonraki →",

    // Sipariş detayı
    "orders.detail.back": "← Siparişlerim",
    "orders.detail.not_found": "Sipariş bulunamadı",
    "orders.detail.back_list": "← Siparişlerime Dön",

    // Adres eksik uyarısı
    "orders.detail.addr_missing_title": "Teslimat adresi eksik",
    "orders.detail.addr_missing_desc": "Ödemeye devam edebilmek için teslimat adresi eklemeniz gerekiyor.",
    "orders.detail.addr_add_btn": "Adres Ekle",

    // Ödeme CTA
    "orders.detail.pay_title": "Ödemeniz tamamlanmadı",
    "orders.detail.pay_desc": "Ödeme bekleniyor. Devam etmek için butona tıklayın.",
    "orders.detail.pay_btn": "Ödemeye Devam Et",
    "orders.detail.paying": "Yönlendiriliyor...",

    // Progress steps
    "orders.step.received": "Sipariş\nAlındı",
    "orders.step.payment": "Ödeme\nOnaylandı",
    "orders.step.preparing": "Hazırlanıyor",
    "orders.step.shipped": "Kargoya\nVerildi",
    "orders.step.delivered": "Teslim\nEdildi",

    // İptal/iade statüsü
    "orders.status.cancelled": "Sipariş iptal edildi",
    "orders.status.failed": "Sipariş başarısız oldu",
    "orders.status.refund_pending": "İade talebi alındı, inceleniyor",
    "orders.status.refund_done": "İade işlemi tamamlandı",

    // Adres bilgileri (detay)
    "orders.detail.addr_title": "Adres Bilgileri",
    "orders.detail.addr_edit": "Düzenle",
    "orders.detail.ship_addr": "Teslimat Adresi",
    "orders.detail.bill_addr": "Fatura Adresi",
    "orders.detail.addr_none": "Teslimat adresi eklenmemiş",
    "orders.detail.addr_none_desc": "Ödemeye geçmek için adres gerekiyor",

    // Ürünler
    "orders.detail.items_title": "Ürünler ({n})",
    "orders.detail.subtotal": "Ara Toplam",
    "orders.detail.discount": "İndirim",
    "orders.detail.tax": "KDV",
    "orders.detail.shipping": "Kargo",
    "orders.detail.shipping_free": "Ücretsiz",
    "orders.detail.grand_total": "Genel Toplam",
    "orders.detail.tax_rate": "KDV %{n}",

    // Sipariş notu
    "orders.detail.note_title": "Sipariş Notu",

    // Kargo takibi
    "orders.detail.shipment_title": "Kargo Takibi",
    "orders.detail.tracking_no": "Takip No:",
    "orders.detail.track_link": "Kargo takip et →",
    "orders.detail.delivered_at": "✓ Teslim Edildi ·",

    // Sipariş geçmişi
    "orders.detail.history_title": "Sipariş Geçmişi",

    // Eylemler
    "orders.detail.refund_btn": "İade Talebi Oluştur",
    "orders.detail.cancel_btn": "Siparişi İptal Et",
    "orders.detail.cancelling": "İptal ediliyor...",

    // İptal modalı
    "orders.cancel.title": "Siparişi İptal Et",
    "orders.cancel.confirm": "Bu siparişi iptal etmek istediğinizden emin misiniz?",
    "orders.cancel.irreversible": "Bu işlem geri alınamaz.",
    "orders.cancel.reason_label": "İptal sebebi",
    "orders.cancel.reason_optional": "(isteğe bağlı)",
    "orders.cancel.reason_placeholder": "Sebebinizi yazın...",
    "orders.cancel.yes": "Evet, İptal Et",
    "orders.cancel.cancel": "Vazgeç",
    "orders.cancel.fail": "İptal işlemi başarısız.",

    // İade talebi modalı
    "orders.refund.title": "İade Talebi Oluştur",
    "orders.refund.desc_prefix": "siparişi için iade talebi oluşturulacak. İade talebiniz incelendikten sonra size dönülecektir.",
    "orders.refund.reason_label": "İade Nedeni (isteğe bağlı)",
    "orders.refund.reason_placeholder": "İade nedeninizi belirtin...",
    "orders.refund.submit_btn": "İade Talebi Gönder",
    "orders.refund.submitting": "Gönderiliyor...",
    "orders.refund.cancel": "Vazgeç",
    "orders.refund.fail": "İade talebi gönderilemedi.",

    // Adres modalı
    "orders.addr_modal.title": "Adres Bilgileri",
    "orders.addr_modal.loading": "Adresler yükleniyor...",
    "orders.addr_modal.saved_tab": "Kayıtlı Adresler",
    "orders.addr_modal.new_tab": "Yeni Adres Gir",
    "orders.addr_modal.diff_billing": "Fatura adresim teslimat adresimden farklı",
    "orders.addr_modal.save_btn": "Kaydet",
    "orders.addr_modal.saving": "Kaydediliyor...",
    "orders.addr_modal.cancel": "İptal",
    "orders.addr_modal.default_badge": "Varsayılan",
    "orders.addr_modal.ship_title": "Teslimat Adresi",
    "orders.addr_modal.bill_title": "Fatura Adresi",
    "orders.addr_modal.err_ship_select": "Teslimat adresi seçin.",
    "orders.addr_modal.err_ship_fill": "Teslimat adresi için zorunlu alanları doldurun.",
    "orders.addr_modal.err_bill_select": "Fatura adresi seçin.",
    "orders.addr_modal.err_bill_fill": "Fatura adresi için zorunlu alanları doldurun.",
    "orders.addr_modal.err_save": "Adres kaydedilemedi. Lütfen tekrar deneyin.",

    // Adres formu alanları
    "orders.addr_form.name": "Ad *",
    "orders.addr_form.surname": "Soyad *",
    "orders.addr_form.phone": "Telefon *",
    "orders.addr_form.city": "Şehir *",
    "orders.addr_form.district": "İlçe *",
    "orders.addr_form.full_address": "Açık Adres *",
    "orders.addr_form.postal_code": "Posta Kodu",
  },

  en: {
    "orders.loading": "Loading...",

    "orders.title": "My Orders",
    "orders.empty": "You have no orders yet",
    "orders.empty.shop_btn": "Start Shopping",
    "orders.item.unit": "item",
    "orders.item.detail": "Detail →",

    "orders.pending.warning": "⚠ Payment not completed — continue to avoid losing your order.",
    "orders.pending.pay_btn": "Continue Payment →",
    "orders.pending.redirecting": "Redirecting...",

    "orders.page.prev": "← Previous",
    "orders.page.next": "Next →",

    "orders.detail.back": "← My Orders",
    "orders.detail.not_found": "Order not found",
    "orders.detail.back_list": "← Back to My Orders",

    "orders.detail.addr_missing_title": "Shipping address missing",
    "orders.detail.addr_missing_desc": "You need to add a shipping address to continue with payment.",
    "orders.detail.addr_add_btn": "Add Address",

    "orders.detail.pay_title": "Payment not completed",
    "orders.detail.pay_desc": "Payment is pending. Click the button to continue.",
    "orders.detail.pay_btn": "Continue Payment",
    "orders.detail.paying": "Redirecting...",

    "orders.step.received": "Order\nReceived",
    "orders.step.payment": "Payment\nConfirmed",
    "orders.step.preparing": "Preparing",
    "orders.step.shipped": "Shipped",
    "orders.step.delivered": "Delivered",

    "orders.status.cancelled": "Order cancelled",
    "orders.status.failed": "Order failed",
    "orders.status.refund_pending": "Refund request received, under review",
    "orders.status.refund_done": "Refund completed",

    "orders.detail.addr_title": "Address Information",
    "orders.detail.addr_edit": "Edit",
    "orders.detail.ship_addr": "Shipping Address",
    "orders.detail.bill_addr": "Billing Address",
    "orders.detail.addr_none": "No shipping address added",
    "orders.detail.addr_none_desc": "An address is required to proceed to payment",

    "orders.detail.items_title": "Items ({n})",
    "orders.detail.subtotal": "Subtotal",
    "orders.detail.discount": "Discount",
    "orders.detail.tax": "VAT",
    "orders.detail.shipping": "Shipping",
    "orders.detail.shipping_free": "Free",
    "orders.detail.grand_total": "Grand Total",
    "orders.detail.tax_rate": "VAT %{n}",

    "orders.detail.note_title": "Order Note",

    "orders.detail.shipment_title": "Shipment Tracking",
    "orders.detail.tracking_no": "Tracking No:",
    "orders.detail.track_link": "Track shipment →",
    "orders.detail.delivered_at": "✓ Delivered ·",

    "orders.detail.history_title": "Order History",

    "orders.detail.refund_btn": "Request Refund",
    "orders.detail.cancel_btn": "Cancel Order",
    "orders.detail.cancelling": "Cancelling...",

    "orders.cancel.title": "Cancel Order",
    "orders.cancel.confirm": "Are you sure you want to cancel this order?",
    "orders.cancel.irreversible": "This action cannot be undone.",
    "orders.cancel.reason_label": "Cancellation reason",
    "orders.cancel.reason_optional": "(optional)",
    "orders.cancel.reason_placeholder": "Write your reason...",
    "orders.cancel.yes": "Yes, Cancel",
    "orders.cancel.cancel": "Go Back",
    "orders.cancel.fail": "Cancellation failed.",

    "orders.refund.title": "Create Refund Request",
    "orders.refund.desc_prefix": "A refund request will be created for order. You will be contacted after the request is reviewed.",
    "orders.refund.reason_label": "Refund Reason (optional)",
    "orders.refund.reason_placeholder": "State your refund reason...",
    "orders.refund.submit_btn": "Send Refund Request",
    "orders.refund.submitting": "Sending...",
    "orders.refund.cancel": "Cancel",
    "orders.refund.fail": "Refund request could not be sent.",

    "orders.addr_modal.title": "Address Information",
    "orders.addr_modal.loading": "Loading addresses...",
    "orders.addr_modal.saved_tab": "Saved Addresses",
    "orders.addr_modal.new_tab": "Enter New Address",
    "orders.addr_modal.diff_billing": "My billing address differs from shipping address",
    "orders.addr_modal.save_btn": "Save",
    "orders.addr_modal.saving": "Saving...",
    "orders.addr_modal.cancel": "Cancel",
    "orders.addr_modal.default_badge": "Default",
    "orders.addr_modal.ship_title": "Shipping Address",
    "orders.addr_modal.bill_title": "Billing Address",
    "orders.addr_modal.err_ship_select": "Please select a shipping address.",
    "orders.addr_modal.err_ship_fill": "Please fill in required fields for shipping address.",
    "orders.addr_modal.err_bill_select": "Please select a billing address.",
    "orders.addr_modal.err_bill_fill": "Please fill in required fields for billing address.",
    "orders.addr_modal.err_save": "Address could not be saved. Please try again.",

    "orders.addr_form.name": "First Name *",
    "orders.addr_form.surname": "Last Name *",
    "orders.addr_form.phone": "Phone *",
    "orders.addr_form.city": "City *",
    "orders.addr_form.district": "District *",
    "orders.addr_form.full_address": "Full Address *",
    "orders.addr_form.postal_code": "Postal Code",
  },

  de: {
    "orders.loading": "Wird geladen...",

    "orders.title": "Meine Bestellungen",
    "orders.empty": "Sie haben noch keine Bestellungen",
    "orders.empty.shop_btn": "Einkaufen starten",
    "orders.item.unit": "Artikel",
    "orders.item.detail": "Details →",

    "orders.pending.warning": "⚠ Zahlung nicht abgeschlossen — fahren Sie fort, um Ihre Bestellung nicht zu verlieren.",
    "orders.pending.pay_btn": "Zur Zahlung →",
    "orders.pending.redirecting": "Wird weitergeleitet...",

    "orders.page.prev": "← Vorherige",
    "orders.page.next": "Nächste →",

    "orders.detail.back": "← Meine Bestellungen",
    "orders.detail.not_found": "Bestellung nicht gefunden",
    "orders.detail.back_list": "← Zurück zu meinen Bestellungen",

    "orders.detail.addr_missing_title": "Lieferadresse fehlt",
    "orders.detail.addr_missing_desc": "Sie müssen eine Lieferadresse hinzufügen, um mit der Zahlung fortzufahren.",
    "orders.detail.addr_add_btn": "Adresse hinzufügen",

    "orders.detail.pay_title": "Zahlung nicht abgeschlossen",
    "orders.detail.pay_desc": "Zahlung ausstehend. Klicken Sie auf die Schaltfläche, um fortzufahren.",
    "orders.detail.pay_btn": "Zur Zahlung",
    "orders.detail.paying": "Wird weitergeleitet...",

    "orders.step.received": "Bestellung\nErhalten",
    "orders.step.payment": "Zahlung\nBestätigt",
    "orders.step.preparing": "Wird vorbereitet",
    "orders.step.shipped": "Versandt",
    "orders.step.delivered": "Geliefert",

    "orders.status.cancelled": "Bestellung storniert",
    "orders.status.failed": "Bestellung fehlgeschlagen",
    "orders.status.refund_pending": "Rückerstattungsanfrage erhalten, wird geprüft",
    "orders.status.refund_done": "Rückerstattung abgeschlossen",

    "orders.detail.addr_title": "Adressinformationen",
    "orders.detail.addr_edit": "Bearbeiten",
    "orders.detail.ship_addr": "Lieferadresse",
    "orders.detail.bill_addr": "Rechnungsadresse",
    "orders.detail.addr_none": "Keine Lieferadresse hinzugefügt",
    "orders.detail.addr_none_desc": "Eine Adresse ist erforderlich, um zur Zahlung zu gelangen",

    "orders.detail.items_title": "Artikel ({n})",
    "orders.detail.subtotal": "Zwischensumme",
    "orders.detail.discount": "Rabatt",
    "orders.detail.tax": "MwSt.",
    "orders.detail.shipping": "Versand",
    "orders.detail.shipping_free": "Kostenlos",
    "orders.detail.grand_total": "Gesamtsumme",
    "orders.detail.tax_rate": "MwSt. %{n}",

    "orders.detail.note_title": "Bestellnotiz",

    "orders.detail.shipment_title": "Sendungsverfolgung",
    "orders.detail.tracking_no": "Sendungsnummer:",
    "orders.detail.track_link": "Sendung verfolgen →",
    "orders.detail.delivered_at": "✓ Geliefert ·",

    "orders.detail.history_title": "Bestellverlauf",

    "orders.detail.refund_btn": "Rückerstattung beantragen",
    "orders.detail.cancel_btn": "Bestellung stornieren",
    "orders.detail.cancelling": "Wird storniert...",

    "orders.cancel.title": "Bestellung stornieren",
    "orders.cancel.confirm": "Sind Sie sicher, dass Sie diese Bestellung stornieren möchten?",
    "orders.cancel.irreversible": "Diese Aktion kann nicht rückgängig gemacht werden.",
    "orders.cancel.reason_label": "Stornierungsgrund",
    "orders.cancel.reason_optional": "(optional)",
    "orders.cancel.reason_placeholder": "Schreiben Sie Ihren Grund...",
    "orders.cancel.yes": "Ja, stornieren",
    "orders.cancel.cancel": "Zurück",
    "orders.cancel.fail": "Stornierung fehlgeschlagen.",

    "orders.refund.title": "Rückerstattungsanfrage erstellen",
    "orders.refund.desc_prefix": "Eine Rückerstattungsanfrage wird für die Bestellung erstellt. Sie werden nach Prüfung kontaktiert.",
    "orders.refund.reason_label": "Rückerstattungsgrund (optional)",
    "orders.refund.reason_placeholder": "Geben Sie Ihren Rückerstattungsgrund an...",
    "orders.refund.submit_btn": "Rückerstattungsanfrage senden",
    "orders.refund.submitting": "Wird gesendet...",
    "orders.refund.cancel": "Abbrechen",
    "orders.refund.fail": "Rückerstattungsanfrage konnte nicht gesendet werden.",

    "orders.addr_modal.title": "Adressinformationen",
    "orders.addr_modal.loading": "Adressen werden geladen...",
    "orders.addr_modal.saved_tab": "Gespeicherte Adressen",
    "orders.addr_modal.new_tab": "Neue Adresse eingeben",
    "orders.addr_modal.diff_billing": "Meine Rechnungsadresse weicht von der Lieferadresse ab",
    "orders.addr_modal.save_btn": "Speichern",
    "orders.addr_modal.saving": "Wird gespeichert...",
    "orders.addr_modal.cancel": "Abbrechen",
    "orders.addr_modal.default_badge": "Standard",
    "orders.addr_modal.ship_title": "Lieferadresse",
    "orders.addr_modal.bill_title": "Rechnungsadresse",
    "orders.addr_modal.err_ship_select": "Bitte wählen Sie eine Lieferadresse aus.",
    "orders.addr_modal.err_ship_fill": "Bitte füllen Sie die Pflichtfelder für die Lieferadresse aus.",
    "orders.addr_modal.err_bill_select": "Bitte wählen Sie eine Rechnungsadresse aus.",
    "orders.addr_modal.err_bill_fill": "Bitte füllen Sie die Pflichtfelder für die Rechnungsadresse aus.",
    "orders.addr_modal.err_save": "Adresse konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",

    "orders.addr_form.name": "Vorname *",
    "orders.addr_form.surname": "Nachname *",
    "orders.addr_form.phone": "Telefon *",
    "orders.addr_form.city": "Stadt *",
    "orders.addr_form.district": "Bezirk *",
    "orders.addr_form.full_address": "Vollständige Adresse *",
    "orders.addr_form.postal_code": "Postleitzahl",
  },

  es: {
    "orders.loading": "Cargando...",

    "orders.title": "Mis pedidos",
    "orders.empty": "Aún no tienes pedidos",
    "orders.empty.shop_btn": "Empezar a comprar",
    "orders.item.unit": "artículo",
    "orders.item.detail": "Detalle →",

    "orders.pending.warning": "⚠ Pago no completado — continúa para no perder tu pedido.",
    "orders.pending.pay_btn": "Continuar pago →",
    "orders.pending.redirecting": "Redirigiendo...",

    "orders.page.prev": "← Anterior",
    "orders.page.next": "Siguiente →",

    "orders.detail.back": "← Mis pedidos",
    "orders.detail.not_found": "Pedido no encontrado",
    "orders.detail.back_list": "← Volver a mis pedidos",

    "orders.detail.addr_missing_title": "Dirección de envío faltante",
    "orders.detail.addr_missing_desc": "Debes agregar una dirección de envío para continuar con el pago.",
    "orders.detail.addr_add_btn": "Agregar dirección",

    "orders.detail.pay_title": "Pago no completado",
    "orders.detail.pay_desc": "Pago pendiente. Haz clic en el botón para continuar.",
    "orders.detail.pay_btn": "Continuar pago",
    "orders.detail.paying": "Redirigiendo...",

    "orders.step.received": "Pedido\nRecibido",
    "orders.step.payment": "Pago\nConfirmado",
    "orders.step.preparing": "Preparando",
    "orders.step.shipped": "Enviado",
    "orders.step.delivered": "Entregado",

    "orders.status.cancelled": "Pedido cancelado",
    "orders.status.failed": "Pedido fallido",
    "orders.status.refund_pending": "Solicitud de reembolso recibida, en revisión",
    "orders.status.refund_done": "Reembolso completado",

    "orders.detail.addr_title": "Información de dirección",
    "orders.detail.addr_edit": "Editar",
    "orders.detail.ship_addr": "Dirección de envío",
    "orders.detail.bill_addr": "Dirección de facturación",
    "orders.detail.addr_none": "No se ha agregado dirección de envío",
    "orders.detail.addr_none_desc": "Se necesita una dirección para proceder al pago",

    "orders.detail.items_title": "Artículos ({n})",
    "orders.detail.subtotal": "Subtotal",
    "orders.detail.discount": "Descuento",
    "orders.detail.tax": "IVA",
    "orders.detail.shipping": "Envío",
    "orders.detail.shipping_free": "Gratis",
    "orders.detail.grand_total": "Total general",
    "orders.detail.tax_rate": "IVA %{n}",

    "orders.detail.note_title": "Nota del pedido",

    "orders.detail.shipment_title": "Seguimiento de envío",
    "orders.detail.tracking_no": "N.° de seguimiento:",
    "orders.detail.track_link": "Rastrear envío →",
    "orders.detail.delivered_at": "✓ Entregado ·",

    "orders.detail.history_title": "Historial del pedido",

    "orders.detail.refund_btn": "Solicitar reembolso",
    "orders.detail.cancel_btn": "Cancelar pedido",
    "orders.detail.cancelling": "Cancelando...",

    "orders.cancel.title": "Cancelar pedido",
    "orders.cancel.confirm": "¿Estás seguro de que deseas cancelar este pedido?",
    "orders.cancel.irreversible": "Esta acción no se puede deshacer.",
    "orders.cancel.reason_label": "Motivo de cancelación",
    "orders.cancel.reason_optional": "(opcional)",
    "orders.cancel.reason_placeholder": "Escribe tu motivo...",
    "orders.cancel.yes": "Sí, cancelar",
    "orders.cancel.cancel": "Volver",
    "orders.cancel.fail": "Cancelación fallida.",

    "orders.refund.title": "Crear solicitud de reembolso",
    "orders.refund.desc_prefix": "Se creará una solicitud de reembolso para el pedido. Te contactaremos después de revisar la solicitud.",
    "orders.refund.reason_label": "Motivo del reembolso (opcional)",
    "orders.refund.reason_placeholder": "Indica el motivo del reembolso...",
    "orders.refund.submit_btn": "Enviar solicitud de reembolso",
    "orders.refund.submitting": "Enviando...",
    "orders.refund.cancel": "Cancelar",
    "orders.refund.fail": "No se pudo enviar la solicitud de reembolso.",

    "orders.addr_modal.title": "Información de dirección",
    "orders.addr_modal.loading": "Cargando direcciones...",
    "orders.addr_modal.saved_tab": "Direcciones guardadas",
    "orders.addr_modal.new_tab": "Ingresar nueva dirección",
    "orders.addr_modal.diff_billing": "Mi dirección de facturación difiere de la dirección de envío",
    "orders.addr_modal.save_btn": "Guardar",
    "orders.addr_modal.saving": "Guardando...",
    "orders.addr_modal.cancel": "Cancelar",
    "orders.addr_modal.default_badge": "Predeterminada",
    "orders.addr_modal.ship_title": "Dirección de envío",
    "orders.addr_modal.bill_title": "Dirección de facturación",
    "orders.addr_modal.err_ship_select": "Por favor selecciona una dirección de envío.",
    "orders.addr_modal.err_ship_fill": "Por favor completa los campos obligatorios para la dirección de envío.",
    "orders.addr_modal.err_bill_select": "Por favor selecciona una dirección de facturación.",
    "orders.addr_modal.err_bill_fill": "Por favor completa los campos obligatorios para la dirección de facturación.",
    "orders.addr_modal.err_save": "No se pudo guardar la dirección. Por favor inténtalo de nuevo.",

    "orders.addr_form.name": "Nombre *",
    "orders.addr_form.surname": "Apellido *",
    "orders.addr_form.phone": "Teléfono *",
    "orders.addr_form.city": "Ciudad *",
    "orders.addr_form.district": "Distrito *",
    "orders.addr_form.full_address": "Dirección completa *",
    "orders.addr_form.postal_code": "Código postal",
  },
};
