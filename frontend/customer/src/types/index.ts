export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  subCategories: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  discountPrice?: number;
  taxRate: number;
  imageUrl?: string;
  availableStock: number;
  brandName?: string;
  categoryName?: string;
  isFeatured: boolean;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText?: string;
  isMain: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  attributesJson?: string;
  price: number;
  discountPrice?: number;
  availableStock: number;
}

export interface ProductDetail extends ProductListItem {
  description?: string;
  shortDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  oemPartNumber?: string;
  chassis?: string;
}

export interface Campaign {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string;
  colorScheme: string;
  imageUrl: string | null;
  stylesJson: string | null;
  linkUrl: string | null;
  linkText: string | null;
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
}

export interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
  availableStock: number;
  isSelected: boolean;
}

export interface Cart {
  cartId: string;
  items: CartItem[];
  subTotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  couponCode?: string;
  grandTotal: number;
}

export interface Address {
  id: string;
  addressTitle: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  city: string;
  district: string;
  neighborhood?: string;
  fullAddress: string;
  postalCode?: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  invoiceType: number;
  taxNumber?: string;
  taxOffice?: string;
  companyName?: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: number;
  paymentStatus: number;
  shipmentStatus: number;
  grandTotal: number;
  itemCount: number;
  createdDate: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  imageUrl?: string;
}

export interface OrderDetail extends OrderSummary {
  shippingAddressSnapshot: string;
  billingAddressSnapshot: string;
  note?: string;
  totalProductAmount: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  items: OrderItem[];
  statusHistory: {
    fromStatus: number;
    toStatus: number;
    note?: string;
    changedAt: string;
  }[];
  shipments: {
    id: string;
    carrier: string;
    trackingNumber?: string;
    trackingUrl?: string;
    status: number;
    shippedAt?: string;
    deliveredAt?: string;
  }[];
}

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface ReviewDto {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  body: string;
  isVerifiedPurchase: boolean;
  createdDate: string;
  likeCount: number;
  isLikedByUser: boolean;
  dislikeCount: number;
  isDislikedByUser: boolean;
  replyCount: number;
  reportCount: number;
}

export interface ReviewReplyDto {
  id: string;
  userId: string;
  userName: string;
  body: string;
  createdDate: string;
}

export interface ProductReviewsResult {
  averageRating: number;
  totalCount: number;
  ratingDistribution: number[];
  reviews: PaginatedList<ReviewDto>;
}

export interface AuthUser {
  userId: string;
  name: string;
  surname: string;
  email: string;
  token: string;
}

export const ORDER_STATUS: Record<number, string> = {
  1:  "Oluşturuldu",
  2:  "Ödeme Bekleniyor",
  3:  "Ödeme Tamamlandı",
  4:  "Hazırlanıyor",
  5:  "Kargoya Verildi",
  6:  "Teslim Edildi",
  7:  "Tamamlandı",
  8:  "İptal Edildi",
  9:  "İade Talep Edildi",
  10: "İade Edildi",
  11: "Başarısız",
};

export const PAYMENT_STATUS: Record<number, string> = {
  1: "Bekliyor",
  2: "Ödendi",
  3: "Başarısız",
  4: "İptal",
  5: "İade",
  6: "Kısmi İade",
};

export const SHIPMENT_STATUS: Record<number, string> = {
  0: "Kargo Yok",
  1: "Hazırlanıyor",
  2: "Kargoya Verildi",
  3: "Yolda",
  4: "Teslim Edildi",
  5: "Teslim Edilemedi",
  6: "İade",
};

export function orderStatusStyle(status: number): { label: string; cls: string } {
  const map: Record<number, { label: string; cls: string }> = {
    1:  { label: "Oluşturuldu",        cls: "bg-slate-100 text-slate-700" },
    2:  { label: "Ödeme Bekleniyor",   cls: "bg-amber-100 text-amber-800" },
    3:  { label: "Ödeme Tamamlandı",   cls: "bg-blue-100 text-blue-800" },
    4:  { label: "Hazırlanıyor",       cls: "bg-violet-100 text-violet-800" },
    5:  { label: "Kargoya Verildi",    cls: "bg-indigo-100 text-indigo-800" },
    6:  { label: "Teslim Edildi",      cls: "bg-emerald-100 text-emerald-800" },
    7:  { label: "Tamamlandı",         cls: "bg-emerald-100 text-emerald-800" },
    8:  { label: "İptal Edildi",       cls: "bg-red-100 text-red-700" },
    9:  { label: "İade Talep Edildi",  cls: "bg-orange-100 text-orange-800" },
    10: { label: "İade Edildi",        cls: "bg-teal-100 text-teal-800" },
    11: { label: "Başarısız",          cls: "bg-red-100 text-red-700" },
  };
  return map[status] ?? { label: "Bilinmiyor", cls: "bg-slate-100 text-slate-600" };
}

export function paymentStatusStyle(status: number): { label: string; cls: string } {
  const map: Record<number, { label: string; cls: string }> = {
    1: { label: "Ödeme Bekliyor", cls: "bg-amber-100 text-amber-800" },
    2: { label: "Ödendi",         cls: "bg-emerald-100 text-emerald-800" },
    3: { label: "Başarısız",      cls: "bg-red-100 text-red-700" },
    4: { label: "İptal",          cls: "bg-slate-100 text-slate-600" },
    5: { label: "İade Edildi",    cls: "bg-teal-100 text-teal-800" },
    6: { label: "Kısmi İade",     cls: "bg-orange-100 text-orange-800" },
  };
  return map[status] ?? { label: "—", cls: "bg-slate-100 text-slate-600" };
}
