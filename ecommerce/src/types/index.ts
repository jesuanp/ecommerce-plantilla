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
  category?: { id: string; name: string; slug: string };
  categorySlug?: string;
  tags: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  featured?: boolean;
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

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
}

export interface OrderDetails {
  orderId: string;
  items: CartItem[];
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
  createdAt: string;
}