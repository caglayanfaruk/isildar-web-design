import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Language {
  id: string;
  code: string;
  name: string;
  native_name: string;
  flag: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface Translation {
  id: string;
  language_code: string;
  translation_key: string;
  translation_value: string;
  context?: string;
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  type: string;
  category: string;
  description?: string;
  is_public: boolean;
}

export interface Category {
  id: string;
  slug: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  icon?: string;
  image_id?: string;
  meta_title?: string;
  meta_description?: string;
}

export interface Product {
  id: string;
  sku: string;
  category_id: string;
  parent_id?: string;
  product_type: 'simple' | 'variant' | 'grouped';
  status: string;
  featured: boolean;
  sort_order: number;
  specifications: any;
  features: string[];
  applications: string[];
  dimensions?: string;
  weight?: number;
  shrink_volume?: number;
  shrink_measurement?: string;
  quantity_per_box?: number;
  quantity_per_shrink?: number;
  meta_title?: string;
  meta_description?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  author_id: string;
  category_id?: string;
  status: string;
  featured: boolean;
  views: number;
  likes: number;
  reading_time?: number;
  featured_image_id?: string;
  meta_title?: string;
  meta_description?: string;
  published_at?: string;
}

export interface NewsItem {
  id: string;
  slug: string;
  author_id: string;
  status: string;
  urgent: boolean;
  external: boolean;
  source?: string;
  views: number;
  featured_image_id?: string;
  meta_title?: string;
  meta_description?: string;
  published_at?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  status: string;
  ip_address?: string;
  user_agent?: string;
  replied_at?: string;
  replied_by?: string;
  created_at: string;
}

export interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  project_name?: string;
  project_address?: string;
  deadline?: string;
  budget_range?: string;
  description: string;
  status: string;
  items: any[];
  attachments: any[];
  ip_address?: string;
  user_agent?: string;
  responded_at?: string;
  responded_by?: string;
  created_at: string;
}

// Enhanced Product System Types
export interface ProductAttribute {
  id: string;
  name: string;
  slug: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color';
  scope: 'product' | 'variant' | 'both';
  is_filterable: boolean;
  is_required: boolean;
  applies_to_all_categories: boolean;
  sort_order: number;
  options: string[];
  validation_rules: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  display_value: string;
  color_code?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  barcode?: string;
  price?: number;
  compare_price?: number;
  cost_price?: number;
  weight?: number;
  dimensions?: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  attributes?: ProductVariantAttribute[];
  inventory?: InventoryItem;
  images?: ProductImage[];
}

export interface ProductVariantAttribute {
  id: string;
  variant_id: string;
  attribute_id: string;
  attribute_value_id: string;
  attribute?: ProductAttribute;
  attribute_value?: ProductAttributeValue;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id?: string;
  media_id: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  media?: {
    url: string;
    alt_text?: string;
  };
}

export interface ProductDocument {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  document_type: string;
  language_code: string;
  version: string;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  variant_id?: string;
  reviewer_name: string;
  reviewer_email?: string;
  rating: number;
  title?: string;
  review_text?: string;
  is_verified: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  location: string;
  last_updated: string;
}

export interface PriceTier {
  id: string;
  product_id: string;
  variant_id?: string;
  min_quantity: number;
  max_quantity?: number;
  price: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface CategoryAttribute {
  id: string;
  category_id: string;
  attribute_id: string;
  is_required: boolean;
  sort_order: number;
  attribute?: ProductAttribute;
}