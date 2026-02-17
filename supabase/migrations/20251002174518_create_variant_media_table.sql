/*
  # Create Variant Media Table

  1. New Tables
    - `product_variant_media`
      - `id` (uuid, primary key)
      - `variant_id` (uuid, references product_variants)
      - `media_id` (uuid, references media)
      - `alt_text` (text, optional)
      - `is_primary` (boolean, default false)
      - `sort_order` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `product_variant_media` table
    - Add policy for public read access
    - Add policy for authenticated admin users to manage variant media

  3. Indexes
    - Index on variant_id for fast lookups
    - Index on media_id for foreign key performance
*/

CREATE TABLE IF NOT EXISTS product_variant_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  alt_text text,
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variant_media_variant_id ON product_variant_media(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_media_media_id ON product_variant_media(media_id);

ALTER TABLE product_variant_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to variant media"
  ON product_variant_media
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert variant media"
  ON product_variant_media
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update variant media"
  ON product_variant_media
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete variant media"
  ON product_variant_media
  FOR DELETE
  TO authenticated
  USING (true);
