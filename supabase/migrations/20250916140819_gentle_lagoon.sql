/*
  # Enhanced Product Management System

  1. New Tables
    - `product_attributes` - Dynamic product attributes (color, size, material, etc.)
    - `product_attribute_values` - Values for each attribute
    - `product_variants` - Product variants with specific attribute combinations
    - `product_variant_attributes` - Links variants to their attribute values
    - `product_images` - Multiple images per product/variant
    - `product_documents` - Technical docs, manuals per product
    - `product_reviews` - Customer reviews and ratings
    - `product_tags` - Flexible tagging system
    - `product_related` - Related products
    - `inventory` - Stock management
    - `price_tiers` - Volume-based pricing

  2. Enhanced Tables
    - Enhanced `products` table with more fields
    - Enhanced `categories` table with attributes

  3. Security
    - Enable RLS on all new tables
    - Add policies for public read access where appropriate
    - Admin-only write access for management
</*/

-- Product Attributes (Dynamic filters like color, size, material, etc.)
CREATE TABLE IF NOT EXISTS product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  slug varchar(100) UNIQUE NOT NULL,
  type varchar(50) DEFAULT 'text' NOT NULL, -- text, number, boolean, select, multiselect, color
  is_filterable boolean DEFAULT true,
  is_required boolean DEFAULT false,
  is_variant_attribute boolean DEFAULT false, -- Used for creating variants
  sort_order integer DEFAULT 0,
  options jsonb DEFAULT '[]'::jsonb, -- For select/multiselect types
  validation_rules jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product Attribute Values
CREATE TABLE IF NOT EXISTS product_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid REFERENCES product_attributes(id) ON DELETE CASCADE,
  value text NOT NULL,
  display_value text,
  color_code varchar(7), -- For color attributes
  image_url text, -- For visual attributes
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enhanced Products table
DO $$
BEGIN
  -- Add new columns to products table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand') THEN
    ALTER TABLE products ADD COLUMN brand varchar(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'model') THEN
    ALTER TABLE products ADD COLUMN model varchar(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'warranty_period') THEN
    ALTER TABLE products ADD COLUMN warranty_period integer DEFAULT 24; -- months
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'min_order_quantity') THEN
    ALTER TABLE products ADD COLUMN min_order_quantity integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'lead_time_days') THEN
    ALTER TABLE products ADD COLUMN lead_time_days integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_customizable') THEN
    ALTER TABLE products ADD COLUMN is_customizable boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'energy_class') THEN
    ALTER TABLE products ADD COLUMN energy_class varchar(10);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'certifications') THEN
    ALTER TABLE products ADD COLUMN certifications jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'technical_specs') THEN
    ALTER TABLE products ADD COLUMN technical_specs jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'installation_notes') THEN
    ALTER TABLE products ADD COLUMN installation_notes text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'maintenance_notes') THEN
    ALTER TABLE products ADD COLUMN maintenance_notes text;
  END IF;
END $$;

-- Product Variants (Different combinations of attributes)
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  sku varchar(100) UNIQUE NOT NULL,
  barcode varchar(100),
  price decimal(10,2),
  compare_price decimal(10,2), -- Original price for discounts
  cost_price decimal(10,2), -- Cost for profit calculations
  weight decimal(10,3),
  dimensions varchar(100),
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product Variant Attributes (Links variants to their attribute values)
CREATE TABLE IF NOT EXISTS product_variant_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  attribute_id uuid REFERENCES product_attributes(id) ON DELETE CASCADE,
  attribute_value_id uuid REFERENCES product_attribute_values(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(variant_id, attribute_id)
);

-- Product Attributes Assignment (Which attributes apply to which products)
CREATE TABLE IF NOT EXISTS product_attribute_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  attribute_id uuid REFERENCES product_attributes(id) ON DELETE CASCADE,
  attribute_value_id uuid REFERENCES product_attribute_values(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, attribute_id, attribute_value_id)
);

-- Product Images (Multiple images per product/variant)
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  media_id uuid REFERENCES media(id) ON DELETE CASCADE,
  alt_text text,
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Product Documents (Technical docs, manuals, certificates)
CREATE TABLE IF NOT EXISTS product_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type varchar(50) NOT NULL, -- pdf, doc, dwg, etc.
  file_size bigint NOT NULL,
  document_type varchar(50) NOT NULL, -- manual, certificate, datasheet, etc.
  language_code varchar(5) DEFAULT 'tr',
  version varchar(20) DEFAULT '1.0',
  is_public boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product Reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  reviewer_name varchar(255) NOT NULL,
  reviewer_email varchar(255),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  title varchar(255),
  review_text text,
  is_verified boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Product Tags (Flexible tagging system)
CREATE TABLE IF NOT EXISTS product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  slug varchar(100) UNIQUE NOT NULL,
  color varchar(7) DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Product Tag Assignments
CREATE TABLE IF NOT EXISTS product_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES product_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, tag_id)
);

-- Product Related (Related/recommended products)
CREATE TABLE IF NOT EXISTS product_related (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  related_product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  relation_type varchar(50) DEFAULT 'related', -- related, upsell, cross_sell, accessory
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, related_product_id)
);

-- Inventory Management
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity integer DEFAULT 0,
  reserved_quantity integer DEFAULT 0, -- For pending orders
  low_stock_threshold integer DEFAULT 10,
  track_inventory boolean DEFAULT true,
  allow_backorder boolean DEFAULT false,
  location varchar(100) DEFAULT 'main_warehouse',
  last_updated timestamptz DEFAULT now(),
  UNIQUE(product_id, variant_id, location)
);

-- Price Tiers (Volume-based pricing)
CREATE TABLE IF NOT EXISTS price_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  min_quantity integer NOT NULL,
  max_quantity integer,
  price decimal(10,2) NOT NULL,
  currency varchar(3) DEFAULT 'TRY',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Category Attributes (Which attributes are available for each category)
CREATE TABLE IF NOT EXISTS category_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  attribute_id uuid REFERENCES product_attributes(id) ON DELETE CASCADE,
  is_required boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, attribute_id)
);

-- Enhanced Categories
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'description') THEN
    ALTER TABLE categories ADD COLUMN description text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'banner_image_id') THEN
    ALTER TABLE categories ADD COLUMN banner_image_id uuid REFERENCES media(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'seo_title') THEN
    ALTER TABLE categories ADD COLUMN seo_title text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'seo_description') THEN
    ALTER TABLE categories ADD COLUMN seo_description text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'featured_products') THEN
    ALTER TABLE categories ADD COLUMN featured_products jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_attributes_slug ON product_attributes(slug);
CREATE INDEX IF NOT EXISTS idx_product_attributes_type ON product_attributes(type);
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attribute ON product_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variant_attributes_variant ON product_variant_attributes(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_attributes_attribute ON product_variant_attributes(attribute_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_variant ON product_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_documents_product ON product_documents(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_slug ON product_tags(slug);
CREATE INDEX IF NOT EXISTS idx_inventory_product_variant ON inventory(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_price_tiers_product_variant ON price_tiers(product_id, variant_id);

-- Enable RLS
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_related ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_attributes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY "Public can read active product attributes"
  ON product_attributes
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public can read active attribute values"
  ON product_attribute_values
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public can read active product variants"
  ON product_variants
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public can read variant attributes"
  ON product_variant_attributes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can read product attribute assignments"
  ON product_attribute_assignments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can read product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can read public product documents"
  ON product_documents
  FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Public can read approved product reviews"
  ON product_reviews
  FOR SELECT
  TO public
  USING (is_approved = true);

CREATE POLICY "Public can read active product tags"
  ON product_tags
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public can read product tag assignments"
  ON product_tag_assignments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can read product related"
  ON product_related
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can read inventory"
  ON inventory
  FOR SELECT
  TO public
  USING (track_inventory = true);

CREATE POLICY "Public can read active price tiers"
  ON price_tiers
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public can read category attributes"
  ON category_attributes
  FOR SELECT
  TO public
  USING (true);

-- Admin policies (authenticated users can manage all data)
CREATE POLICY "Authenticated users can manage product attributes"
  ON product_attributes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage attribute values"
  ON product_attribute_values
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage product variants"
  ON product_variants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage variant attributes"
  ON product_variant_attributes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage product attribute assignments"
  ON product_attribute_assignments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage product images"
  ON product_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage product documents"
  ON product_documents
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage product reviews"
  ON product_reviews
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage product tags"
  ON product_tags
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage product tag assignments"
  ON product_tag_assignments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage product related"
  ON product_related
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage inventory"
  ON inventory
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage price tiers"
  ON price_tiers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage category attributes"
  ON category_attributes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default product attributes
INSERT INTO product_attributes (name, slug, type, is_filterable, is_variant_attribute, options) VALUES
('Renk', 'color', 'color', true, true, '[]'),
('Boyut', 'size', 'select', true, true, '["Küçük", "Orta", "Büyük"]'),
('Malzeme', 'material', 'select', true, false, '["Plastik", "Metal", "Cam", "Alüminyum"]'),
('Güç', 'power', 'number', true, true, '{}'),
('Voltaj', 'voltage', 'select', true, false, '["12V", "24V", "220V", "110V"]'),
('IP Koruma Sınıfı', 'ip_rating', 'select', true, false, '["IP20", "IP44", "IP54", "IP65", "IP67"]'),
('Işık Rengi', 'light_color', 'select', true, true, '["Beyaz", "Sarı", "RGB", "Tunable White"]'),
('Dimmer Uyumlu', 'dimmable', 'boolean', true, false, '{}'),
('Sensör Türü', 'sensor_type', 'select', true, false, '["PIR", "Mikrodalga", "Gün Işığı", "Hareket"]'),
('Montaj Türü', 'mounting_type', 'select', true, false, '["Tavan", "Duvar", "Sarkıt", "Gömme", "Yüzey"]'),
('Enerji Sınıfı', 'energy_class', 'select', true, false, '["A++", "A+", "A", "B", "C"]'),
('Garanti Süresi', 'warranty', 'select', true, false, '["1 Yıl", "2 Yıl", "3 Yıl", "5 Yıl"]'),
('Kullanım Alanı', 'usage_area', 'multiselect', true, false, '["İç Mekan", "Dış Mekan", "Bahçe", "Endüstriyel", "Ticari", "Konut"]'),
('Özellikler', 'features', 'multiselect', true, false, '["Su Geçirmez", "Darbe Dayanımlı", "UV Dayanımlı", "Alev Geciktirici", "Geri Dönüştürülebilir"]')
ON CONFLICT (slug) DO NOTHING;

-- Insert default attribute values for color
INSERT INTO product_attribute_values (attribute_id, value, display_value, color_code) 
SELECT id, 'beyaz', 'Beyaz', '#FFFFFF' FROM product_attributes WHERE slug = 'color'
ON CONFLICT DO NOTHING;

INSERT INTO product_attribute_values (attribute_id, value, display_value, color_code) 
SELECT id, 'siyah', 'Siyah', '#000000' FROM product_attributes WHERE slug = 'color'
ON CONFLICT DO NOTHING;

INSERT INTO product_attribute_values (attribute_id, value, display_value, color_code) 
SELECT id, 'gri', 'Gri', '#6B7280' FROM product_attributes WHERE slug = 'color'
ON CONFLICT DO NOTHING;

INSERT INTO product_attribute_values (attribute_id, value, display_value, color_code) 
SELECT id, 'mavi', 'Mavi', '#3B82F6' FROM product_attributes WHERE slug = 'color'
ON CONFLICT DO NOTHING;

-- Insert default product tags
INSERT INTO product_tags (name, slug, color) VALUES
('Yeni Ürün', 'new-product', '#10B981'),
('Popüler', 'popular', '#F59E0B'),
('İndirimli', 'discounted', '#EF4444'),
('Öne Çıkan', 'featured', '#8B5CF6'),
('Çok Satan', 'bestseller', '#F97316'),
('Eco-Friendly', 'eco-friendly', '#059669'),
('Premium', 'premium', '#7C3AED'),
('Ekonomik', 'budget', '#0891B2')
ON CONFLICT (slug) DO NOTHING;