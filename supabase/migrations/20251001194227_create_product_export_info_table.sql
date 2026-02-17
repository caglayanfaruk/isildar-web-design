/*
  # İhracat Bilgileri Tablosu

  1. Yeni Tablo
    - `product_export_info` - Ürün ihracat bilgileri
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `export_countries` (jsonb array) - İhracat yapılan ülkeler
      - `standards` (jsonb array) - Uluslararası standartlar
      - `packaging_info` (text) - Paketleme bilgileri
      - `delivery_time` (text) - Teslimat süresi
      - `special_notes` (text) - Özel notlar
      - `incoterms` (text) - Ticaret terimleri (FOB, CIF, vb.)
      - `hs_code` (varchar) - Gümrük tarife kodu
      - `min_export_quantity` (integer) - Minimum ihracat miktarı
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Güvenlik
    - RLS etkin
    - Public okuma izni
    - Authenticated kullanıcılar yönetim izni
*/

-- Product Export Info table
CREATE TABLE IF NOT EXISTS product_export_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  export_countries jsonb DEFAULT '[]'::jsonb,
  standards jsonb DEFAULT '[]'::jsonb,
  packaging_info text,
  delivery_time text,
  special_notes text,
  incoterms text DEFAULT 'FOB',
  hs_code varchar(20),
  min_export_quantity integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_export_info ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public can read active product export info"
  ON product_export_info
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admin management policy
CREATE POLICY "Authenticated users can manage product export info"
  ON product_export_info
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_product_export_info_product ON product_export_info(product_id);

-- Insert sample export info for existing products
INSERT INTO product_export_info (product_id, export_countries, standards, packaging_info, delivery_time, incoterms, min_export_quantity)
SELECT 
  p.id,
  '["Almanya", "Fransa", "İtalya", "İspanya", "Hollanda", "Belçika", "Avusturya", "İsviçre"]'::jsonb,
  '["CE Marking", "ROHS Compliance", "EU Standards", "ISO 9001"]'::jsonb,
  'Export Quality Packaging - Karton Kutu + Shrink Film',
  '15-30 gün',
  'FOB',
  100
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_export_info pei 
  WHERE pei.product_id = p.id
)
LIMIT 10;
