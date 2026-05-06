export interface AuthUser {
  userId: string;
  name: string;
  surname: string;
  email: string;
  token: string;
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

// Dashboard
export interface MonthlySummary {
  month: string;
  revenue: number;
  orderCount: number;
}

export interface WeeklyOrder {
  day: string;
  label: string;
  orderCount: number;
  revenue: number;
}

export interface OrderStatusCount {
  status: number;
  label: string;
  count: number;
}

export interface DashboardRecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  status: number;
  grandTotal: number;
  createdDate: string;
}

export interface DashboardStats {
  todaySales: number;
  todayOrderCount: number;
  pendingOrderCount: number;
  criticalStockCount: number;
  monthSales: number;
  monthOrderCount: number;
  totalCustomerCount: number;
  newCustomerCount: number;
  monthlySummary: MonthlySummary[];
  weeklyOrders: WeeklyOrder[];
  orderStatusBreakdown: OrderStatusCount[];
  recentOrders: DashboardRecentOrder[];
}

// Orders
export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: number;
  paymentStatus: number;
  shipmentStatus: number;
  grandTotal: number;
  itemCount: number;
  createdDate: string;
}

export interface AdminOrderItem {
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

export interface AdminOrderDetail extends AdminOrderSummary {
  shippingAddressSnapshot: string;
  billingAddressSnapshot: string;
  note?: string;
  totalProductAmount: number;
  shippingAmount: number;
  taxAmount: number;
  items: AdminOrderItem[];
  statusHistory: {
    fromStatus: number;
    toStatus: number;
    note?: string;
    changedAt: string;
  }[];
  shipments: {
    id: string;
    trackingNumber: string;
    carrier: string;
    shippedAt: string;
  }[];
}

// Products
export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  discountPrice?: number;
  taxRate: number;
  isActive: boolean;
  imageUrl?: string;
  availableStock: number;
  brandName?: string;
  categoryName?: string;
  createdDate: string;
}

// Stock
export interface StockItem {
  productId: string;
  variantId?: string;
  productName: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  criticalStockLevel: number;
  isCritical: boolean;
  lastMovementDate?: string;
}

// Users
export interface AdminUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  createdDate: string;
  roles: string[];
}

// Coupons
export type CouponType = 1 | 2 | 3; // 1=FixedAmount, 2=Percentage, 3=FreeShipping

export const COUPON_TYPE_LABEL: Record<number, string> = {
  1: "Sabit Tutar",
  2: "Yüzde",
  3: "Ücretsiz Kargo",
};

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxUsageCount?: number;
  maxUsagePerUser?: number;
  usageCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

// Status maps
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

export const ORDER_STATUS_COLORS: Record<number, string> = {
  1: "bg-zinc-100 text-zinc-700",
  2: "bg-yellow-100 text-yellow-800",
  3: "bg-blue-100 text-blue-800",
  4: "bg-indigo-100 text-indigo-800",
  5: "bg-purple-100 text-purple-800",
  6: "bg-teal-100 text-teal-800",
  7: "bg-green-100 text-green-800",
  8: "bg-red-100 text-red-700",
  9: "bg-orange-100 text-orange-800",
  10: "bg-rose-100 text-rose-800",
  11: "bg-gray-100 text-gray-600",
};

export const PAYMENT_STATUS: Record<number, string> = {
  1: "Bekliyor",
  2: "Ödendi",
  3: "Başarısız",
  4: "İptal",
  5: "İade",
};
