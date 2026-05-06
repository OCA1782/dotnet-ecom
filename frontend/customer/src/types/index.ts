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
  shippingAmount: number;
  taxAmount: number;
  items: OrderItem[];
  statusHistory: {
    fromStatus: number;
    toStatus: number;
    note?: string;
    changedAt: string;
  }[];
}

export interface ReviewDto {
  id: string;
  userName: string;
  rating: number;
  title?: string;
  body: string;
  isVerifiedPurchase: boolean;
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
  1: "Oluşturuldu",
  2: "Ödeme Bekleniyor",
  3: "Ödeme Tamamlandı",
  4: "Hazırlanıyor",
  5: "Kargoya Verildi",
  6: "Teslim Edildi",
  7: "Tamamlandı",
  8: "İptal Edildi",
  9: "İade Talep Edildi",
  10: "İade Edildi",
  11: "Başarısız",
};

export const PAYMENT_STATUS: Record<number, string> = {
  1: "Bekliyor",
  2: "Ödendi",
  3: "Başarısız",
  4: "İptal",
  5: "İade",
};
