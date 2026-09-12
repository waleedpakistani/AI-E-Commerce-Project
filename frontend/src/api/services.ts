import axiosClient from './axiosClient';

import type {
  Product,
  Order,
  Customer,
  Cart,
  WishlistItem,
  Store,
  Category,
  PaginatedResponse,
  DashboardStats,
} from '../types';


// =========================
// AUTH
// =========================

export const authApi = {
  registerSeller: (data: any) =>
    axiosClient.post('/auth/register', data),

  loginSeller: (data: any) =>
    axiosClient.post('/auth/login', data),

  registerBuyer: (data: any) =>
    axiosClient.post('/auth/buyer/register', data),

  loginBuyer: (data: any) =>
    axiosClient.post('/auth/buyer/login', data),
};


// =========================
// STORES
// =========================

export const storesApi = {
  createStore: (data: any) =>
    axiosClient.post<Store>('/stores', data),

  getSellerStores: () =>
    axiosClient.get<Store[]>('/stores'),

  getStoreById: (id: string) =>
    axiosClient.get<Store>(`/stores/${id}`),

  updateStore: (id: string, data: any) =>
    axiosClient.patch<Store>(`/stores/${id}`, data),
};


// =========================
// CATEGORIES
// =========================

export const categoriesApi = {
  getStoreCategories: (storeId: string) =>
    axiosClient.get<Category[]>(
      `/stores/${storeId}/categories`
    ),

  getCategoryById: (id: string) =>
    axiosClient.get<Category>(
      `/categories/${id}`
    ),

  createCategory: (storeId: string, data: any) =>
    axiosClient.post<Category>(
      `/stores/${storeId}/categories`,
      data
    ),

  updateCategory: (id: string, data: any) =>
    axiosClient.patch<Category>(
      `/categories/${id}`,
      data
    ),

  deleteCategory: (id: string) =>
    axiosClient.delete(
      `/categories/${id}`
    ),
};


// =========================
// SELLER PRODUCTS
// =========================

export const sellerProductsApi = {
  getStoreProducts: (
    storeId: string,
    params?: any
  ) =>
    axiosClient.get<PaginatedResponse<Product>>(
      `/stores/${storeId}/products`,
      { params }
    ),

  createProduct: (
    storeId: string,
    data: any
  ) =>
    axiosClient.post<Product>(
      `/stores/${storeId}/products`,
      data
    ),

  updateProduct: (
    id: string,
    data: any
  ) =>
    axiosClient.patch<Product>(
      `/products/${id}`,
      data
    ),

  updateStock: (
    id: string,
    stockQuantity: number
  ) =>
    axiosClient.patch<Product>(
      `/products/${id}/stock`,
      { stockQuantity }
    ),

  deleteProduct: (id: string) =>
    axiosClient.delete(
      `/products/${id}`
    ),
};


// =========================
// SELLER DASHBOARD
// =========================

export const sellerDashboardApi = {
  getStats: async (storeId: string) => {
    const res = await axiosClient.get(
      `/stores/${storeId}/dashboard`
    );

    const dashboard: DashboardStats = {
      totalRevenue: Number(
        res.data?.sales?.totalRevenue ?? 0
      ),

      totalOrders: Number(
        res.data?.sales?.totalOrders ?? 0
      ),

      activeProducts: Number(
        res.data?.products?.active ?? 0
      ),

      lowStockAlerts: Number(
        res.data?.inventory?.lowStockCount ?? 0
      ),
    };

    return {
      ...res,
      data: dashboard,
    };
  },

  getLowStock: async (storeId: string) => {
    const res = await axiosClient.get(
      `/stores/${storeId}/dashboard`
    );

    return {
      ...res,
      data: res.data?.inventory?.alerts ?? [],
    };
  },
};


// =========================
// SELLER ORDERS
// =========================

export const sellerOrdersApi = {
  getStoreOrders: async (
    storeId: string,
    params?: any
  ) => {
    const res = await axiosClient.get(
      `/stores/${storeId}/orders`,
      {
        params,
      }
    );

    /*
      Backend returns:

      {
        items: [...],
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      }

      Frontend expects:

      {
        data: [...],
        total,
        page,
        limit,
        totalPages
      }
    */

    const normalizedResponse: PaginatedResponse<Order> = {
      data: res.data?.items ?? [],
      total: Number(
        res.data?.pagination?.total ?? 0
      ),
      page: Number(
        res.data?.pagination?.page ?? 1
      ),
      limit: Number(
        res.data?.pagination?.limit ?? 10
      ),
      totalPages: Number(
        res.data?.pagination?.totalPages ?? 1
      ),
    };

    return {
      ...res,
      data: normalizedResponse,
    };
  },

  getOrderDetails: (
    storeId: string,
    orderId: string
  ) =>
    axiosClient.get<Order>(
      `/stores/${storeId}/orders/${orderId}`
    ),

  updateOrderStatus: (
    storeId: string,
    orderId: string,
    status: string
  ) =>
    axiosClient.patch<Order>(
      `/stores/${storeId}/orders/${orderId}/status`,
      {
        status,
      }
    ),
};


// =========================
// SELLER CUSTOMERS
// =========================

export const sellerCustomersApi = {
  getStoreCustomers: async (
    storeId: string,
    params?: any
  ) => {
    const res = await axiosClient.get(
      `/stores/${storeId}/customers`,
      {
        params,
      }
    );

    /*
      Backend returns:

      {
        items: [...],
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      }

      Frontend expects:

      {
        data: [...],
        total,
        page,
        limit,
        totalPages
      }
    */

    const normalizedResponse: PaginatedResponse<Customer> = {
      data: res.data?.items ?? [],
      total: Number(
        res.data?.pagination?.total ?? 0
      ),
      page: Number(
        res.data?.pagination?.page ?? 1
      ),
      limit: Number(
        res.data?.pagination?.limit ?? 10
      ),
      totalPages: Number(
        res.data?.pagination?.totalPages ?? 1
      ),
    };

    return {
      ...res,
      data: normalizedResponse,
    };
  },

  getCustomerDetails: (
    storeId: string,
    buyerId: string
  ) =>
    axiosClient.get<any>(
      `/stores/${storeId}/customers/${buyerId}`
    ),
};


// =========================
// BUYER PRODUCTS
// =========================

export const buyerProductsApi = {
  getProducts: (params?: any) =>
    axiosClient.get<PaginatedResponse<Product>>(
      '/buyer/products',
      { params }
    ),

  getProductDetails: (id: string) =>
    axiosClient.get<Product>(
      `/buyer/products/${id}`
    ),
};


// =========================
// CART
// =========================

export const cartApi = {
  getCart: () =>
    axiosClient.get<Cart>(
      '/buyer/cart'
    ),

  addItem: (
    productId: string,
    quantity: number
  ) =>
    axiosClient.post<Cart>(
      '/buyer/cart/items',
      {
        productId,
        quantity,
      }
    ),

  updateQuantity: (
    itemId: string,
    quantity: number
  ) =>
    axiosClient.patch<Cart>(
      `/buyer/cart/items/${itemId}`,
      {
        quantity,
      }
    ),

  removeItem: (itemId: string) =>
    axiosClient.delete<Cart>(
      `/buyer/cart/items/${itemId}`
    ),

  clearCart: () =>
    axiosClient.delete<Cart>(
      '/buyer/cart'
    ),
};


// =========================
// WISHLIST
// =========================

export const wishlistApi = {
  getWishlist: () =>
    axiosClient.get<WishlistItem[]>(
      '/buyer/wishlist'
    ),

  addItem: (productId: string) =>
    axiosClient.post<WishlistItem>(
      `/buyer/wishlist/${productId}`
    ),

  removeItem: (productId: string) =>
    axiosClient.delete(
      `/buyer/wishlist/${productId}`
    ),
};


// =========================
// BUYER ORDERS
// =========================

export const buyerOrdersApi = {
  checkout: (data: {
    addressId?: string;

    shippingAddress?: {
      recipientName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };

    paymentMethod?: string;

    notes?: string;
  }) =>
    axiosClient.post<any>(
      '/buyer/orders/checkout',
      data
    ),

  getOrders: (params?: any) =>
    axiosClient.get<PaginatedResponse<Order>>(
      '/buyer/orders',
      {
        params,
      }
    ),

  getOrderById: (id: string) =>
    axiosClient.get<Order>(
      `/buyer/orders/${id}`
    ),

  cancelOrder: (id: string) =>
    axiosClient.patch<Order>(
      `/buyer/orders/${id}/cancel`
    ),
};


// =========================
// BUYER PROFILE
// =========================

export const buyerProfileApi = {
  getProfile: () =>
    axiosClient.get(
      '/buyer/profile'
    ),

  updateProfile: (data: any) =>
    axiosClient.patch(
      '/buyer/profile',
      data
    ),

  getAddresses: () =>
    axiosClient.get(
      '/buyer/addresses'
    ),

  addAddress: (data: any) =>
    axiosClient.post(
      '/buyer/addresses',
      data
    ),
};