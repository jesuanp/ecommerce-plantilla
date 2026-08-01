import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4242/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export interface ProductTranslation {
  name?: string;
  description?: string;
  longDescription?: string;
  brand?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface ProductTranslations {
  es?: ProductTranslation;
  en?: ProductTranslation;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  brand: string;
  description: string;
  longDescription: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: { id: string; name: string; slug: string };
  categorySlug?: string;
  tags: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  translations?: ProductTranslations;
}

export interface CategoryTranslation {
  name?: string;
  description?: string;
}

export interface CategoryTranslations {
  es?: CategoryTranslation;
  en?: CategoryTranslation;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  isVisible?: boolean;
  sortOrder?: number;
  translations?: CategoryTranslations;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId?: string;
  user?: { id: string; name: string; email: string };
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
paymentMethod: string;
    stripeSessionId?: string;
  customerEmail: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };
  items: OrderItem[];
  createdAt: string;
  trackingNumber?: string;
  notes?: string;
  statusHistory?: Array<{ status: string; at: string; by?: string }>;
}

export interface Promotion {
  id: string;
  code: string;
  type: 'percent' | 'fixed' | 'free_shipping';
  value: number;
  appliesTo: 'all' | 'category' | 'product';
  appliesId?: string;
  maxUses?: number;
  maxUsesPerUser?: number;
  usedCount: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
  status: 'pending' | 'approved' | 'rejected';
  reply?: string;
  createdAt: string;
  product?: { id: string; name: string; images: string[] };
  user?: { id: string; name: string; email: string };
}

export interface AuditLogEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  contactEmail: string;
  logoUrl?: string;
  shippingZones?: Array<{ name: string; countries: string[]; rate: number }>;
  taxRates?: Record<string, number>;
}

export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories'),
  getById: (id: string) => api.get<Category>(`/categories/${id}`),
  getBySlug: (slug: string) => api.get<Category>(`/categories/slug/${slug}`),
};

export const productsApi = {
  getAll: (params?: { category?: string; q?: string; sort?: string; minPrice?: number; maxPrice?: number }) =>
    api.get<Product[]>('/products', { params }),
  getFeatured: () => api.get<Product[]>('/products/featured'),
  getById: (id: string) => api.get<{ product: Product; related: Product[] }>(`/products/${id}`),
};

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<{ user: User }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User }>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ user: User }>('/auth/me'),
  updateProfile: (data: { name?: string; address?: string; city?: string; zipCode?: string; country?: string }) =>
    api.put<{ user: User }>('/auth/profile', data),
};

export const ordersApi = {
  getAll: () => api.get<Order[]>('/orders'),
  getById: (id: string) => api.get<Order>(`/orders/${id}`),
  create: (data: {
    items: { productId?: string; name: string; price: number; quantity: number; image: string }[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    customer: {
      name: string;
      email: string;
      address: string;
      city: string;
      zipCode: string;
      country: string;
    };
paymentMethod: string;
    stripeSessionId?: string;
  }) => api.post<Order>('/orders', data),
};

export const checkoutApi = {
  createSession: (items: { name: string; price: number; quantity: number; image: string; productId?: string }[]) =>
    api.post<{ mode: 'stripe' | 'demo'; url: string; sessionId?: string }>('/create-checkout-session', { items }),
  getSessionStatus: (sessionId: string) =>
    api.get<{ status: string; payment_status: string; customer_email: string }>('/session-status', {
      params: { session_id: sessionId },
    }),
};

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalCategories: number;
  totalRevenue: number;
  lowStock: number;
  ordersByStatus: { status: string; count: number }[];
  recentOrders: Order[];
}

export interface AnalyticsOverview {
  totalOrders?: number;
  totalRevenue?: number;
  aov?: number;
  averageOrderValue?: number;
  monthRevenue?: number;
  currentMonthRevenue?: number;
  prevMonthRevenue?: number;
  previousMonthRevenue?: number;
  monthGrowth?: number;
  monthOverMonthGrowth?: number;
}

export function pickNumber(...candidates: Array<number | string | undefined | null>): number {
  for (const c of candidates) {
    if (typeof c === 'number' && !Number.isNaN(c)) return c;
    if (typeof c === 'string') {
      const n = parseFloat(c);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

export function pickArray<T>(value: unknown, keys: string[] = ['data', 'sales', 'categories', 'items', 'results']): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    for (const k of keys) {
      const v = (value as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

export const adminApi = {
  getStats: () => api.get<DashboardStats>('/admin/stats'),
  getTopProducts: () => api.get<Array<{ productId: string; name: string; sold: number }>>('/admin/top-products'),

  getUsers: () => api.get<User[]>('/admin/users'),
  getUser: (id: string) => api.get<{ user: User; lifetimeValue: number }>(`/admin/users/${id}`),
  updateUser: (id: string, data: { role?: 'user' | 'admin'; isActive?: boolean }) =>
    api.put<User>(`/admin/users/${id}`, data),

  getOrders: (params?: { status?: string; q?: string; from?: string; to?: string; limit?: number }) =>
    api.get<Order[]>('/admin/orders', { params }),
  getOrder: (id: string) => api.get<Order>(`/admin/orders/${id}`),
  updateOrder: (id: string, data: { status?: string; trackingNumber?: string; notes?: string }) =>
    api.put<Order>(`/admin/orders/${id}`, data),
  exportOrdersCsv: () => api.get<string>('/admin/orders/export.csv', { responseType: 'text' }),

  createProduct: (data: Partial<Product>) => api.post('/admin/products', data),
  updateProduct: (id: string, data: Partial<Product>) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  bulkProducts: (data: { ids: string[]; action: 'delete' | 'feature' | 'activate' | 'category'; value?: any }) =>
    api.post<{ affected: number }>('/admin/products/bulk', data),

  createCategory: (data: Partial<Category>) => api.post('/admin/categories', data),
  updateCategory: (id: string, data: Partial<Category>) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),

  getAnalyticsOverview: () => api.get<AnalyticsOverview>('/admin/analytics/overview'),
  getAnalyticsSales: (days = 30) => api.get<Array<{ date: string; revenue: number; count: number }>>(`/admin/analytics/sales?days=${days}`),
  getAnalyticsByCategory: () => api.get<Array<{ name: string; revenue: number }>>('/admin/analytics/by-category'),

  getPromotions: () => api.get<Promotion[]>('/admin/promotions'),
  createPromotion: (data: Partial<Promotion>) => api.post('/admin/promotions', data),
  updatePromotion: (id: string, data: Partial<Promotion>) => api.put(`/admin/promotions/${id}`, data),
  deletePromotion: (id: string) => api.delete(`/admin/promotions/${id}`),

  getReviews: (status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending') =>
    api.get<Review[]>(`/admin/reviews?status=${status}`),
  updateReview: (id: string, data: { status?: string; reply?: string }) =>
    api.put<Review>(`/admin/reviews/${id}`, data),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),

  getSettings: () => api.get<StoreSettings>('/admin/settings'),
  updateSettings: (data: Partial<StoreSettings>) => api.put<StoreSettings>('/admin/settings', data),

  getAudit: (params?: { action?: string; limit?: number }) =>
    api.get<AuditLogEntry[]>('/admin/audit', { params }),
};

export default api;