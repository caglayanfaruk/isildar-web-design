/*
  # Product Filters and Attributes System

  1. New Tables
    - `product_filter_groups`
      - `id` (uuid, primary key)
      - `name` (text, filter group name e.g., "Kullanım Alanları")
      - `slug` (text, unique identifier)
      - `icon` (text, lucide icon name)
      - `order` (integer, display order)
      - `visible` (boolean, visibility status)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `product_filter_options`
      - `id` (uuid, primary key)
      - `filter_group_id` (uuid, foreign key to product_filter_groups)
      - `name` (text, option name e.g., "İç Mekan")
      - `slug` (text, unique identifier)
      - `order` (integer, display order)
      - `visible` (boolean, visibility status)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `product_filter_translations`
      - `id` (uuid, primary key)
      - `filter_group_id` (uuid, nullable, foreign key)
      - `filter_option_id` (uuid, nullable, foreign key)
      - `language_code` (text)
      - `name` (text, translated name)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `product_filter_values`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `filter_option_id` (uuid, foreign key to product_filter_options)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated admin users to manage

  3. Initial Data
    - Populate with existing filter structure
    - Set proper ordering
*/

-- Create product_filter_groups table
CREATE TABLE IF NOT EXISTS product_filter_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text DEFAULT 'Filter',
  "order" integer NOT NULL DEFAULT 0,
  visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_filter_options table
CREATE TABLE IF NOT EXISTS product_filter_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_group_id uuid REFERENCES product_filter_groups(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(filter_group_id, slug)
);

-- Create product_filter_translations table
CREATE TABLE IF NOT EXISTS product_filter_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_group_id uuid REFERENCES product_filter_groups(id) ON DELETE CASCADE,
  filter_option_id uuid REFERENCES product_filter_options(id) ON DELETE CASCADE,
  language_code text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (
    (filter_group_id IS NOT NULL AND filter_option_id IS NULL) OR
    (filter_group_id IS NULL AND filter_option_id IS NOT NULL)
  )
);

-- Create product_filter_values table (links products to filter options)
CREATE TABLE IF NOT EXISTS product_filter_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  filter_option_id uuid REFERENCES product_filter_options(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, filter_option_id)
);

-- Enable RLS
ALTER TABLE product_filter_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_filter_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_filter_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_filter_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_filter_groups
CREATE POLICY "Anyone can view visible filter groups"
  ON product_filter_groups FOR SELECT
  USING (visible = true);

CREATE POLICY "Authenticated users can manage filter groups"
  ON product_filter_groups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for product_filter_options
CREATE POLICY "Anyone can view visible filter options"
  ON product_filter_options FOR SELECT
  USING (visible = true);

CREATE POLICY "Authenticated users can manage filter options"
  ON product_filter_options FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for product_filter_translations
CREATE POLICY "Anyone can view filter translations"
  ON product_filter_translations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage filter translations"
  ON product_filter_translations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for product_filter_values
CREATE POLICY "Anyone can view product filter values"
  ON product_filter_values FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage product filter values"
  ON product_filter_values FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_filter_options_group ON product_filter_options(filter_group_id);
CREATE INDEX IF NOT EXISTS idx_filter_translations_group ON product_filter_translations(filter_group_id);
CREATE INDEX IF NOT EXISTS idx_filter_translations_option ON product_filter_translations(filter_option_id);
CREATE INDEX IF NOT EXISTS idx_filter_values_product ON product_filter_values(product_id);
CREATE INDEX IF NOT EXISTS idx_filter_values_option ON product_filter_values(filter_option_id);

-- Insert initial filter groups
INSERT INTO product_filter_groups (name, slug, icon, "order", visible) VALUES
  ('Kullanım Alanları', 'usage-areas', 'MapPin', 1, true),
  ('Özellikler', 'features', 'Sparkles', 2, true),
  ('Montaj Tipi', 'installation-type', 'Wrench', 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert filter options for Kullanım Alanları
INSERT INTO product_filter_options (filter_group_id, name, slug, "order", visible)
SELECT 
  (SELECT id FROM product_filter_groups WHERE slug = 'usage-areas'),
  name,
  slug,
  "order",
  true
FROM (VALUES
  ('İç Mekan', 'ic-mekan', 1),
  ('Dış Mekan', 'dis-mekan', 2),
  ('Endüstriyel', 'endustriyel', 3),
  ('Ev', 'ev', 4),
  ('Ofis', 'ofis', 5),
  ('Mağaza', 'magaza', 6),
  ('Fabrika', 'fabrika', 7),
  ('Bahçe', 'bahce', 8)
) AS t(name, slug, "order")
ON CONFLICT (filter_group_id, slug) DO NOTHING;

-- Insert filter options for Özellikler
INSERT INTO product_filter_options (filter_group_id, name, slug, "order", visible)
SELECT 
  (SELECT id FROM product_filter_groups WHERE slug = 'features'),
  name,
  slug,
  "order",
  true
FROM (VALUES
  ('LED', 'led', 1),
  ('Sensörlü', 'sensorlu', 2),
  ('Dimmerli', 'dimmerli', 3),
  ('Su Geçirmez', 'su-gecirmez', 4),
  ('Enerji Tasarruflu', 'enerji-tasarruflu', 5)
) AS t(name, slug, "order")
ON CONFLICT (filter_group_id, slug) DO NOTHING;

-- Insert filter options for Montaj Tipi
INSERT INTO product_filter_options (filter_group_id, name, slug, "order", visible)
SELECT 
  (SELECT id FROM product_filter_groups WHERE slug = 'installation-type'),
  name,
  slug,
  "order",
  true
FROM (VALUES
  ('Tavan', 'tavan', 1),
  ('Duvar', 'duvar', 2),
  ('Sarkıt', 'sarkit', 3),
  ('Gömme', 'gomme', 4)
) AS t(name, slug, "order")
ON CONFLICT (filter_group_id, slug) DO NOTHING;