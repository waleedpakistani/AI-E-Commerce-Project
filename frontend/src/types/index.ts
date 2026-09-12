export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export interface Store {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  status: string;
  createdAt: string;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  categoryName?: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  storeId: string;
  customerName: string;
  customerEmail: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  totalAmount: number;
  createdAt: string;
  items?: OrderItem[];
}

export interface Customer {
  buyerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate?: string;
  lastOrderDate?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Cart {
  id: string;
  buyerId: string;
  items: CartItem[];
  totalAmount: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product?: Product;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  lowStockAlerts: number;
}
