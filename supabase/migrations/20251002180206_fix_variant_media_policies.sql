/*
  # Fix Product Variant Media RLS Policies

  1. Changes
    - Drop existing restrictive policies
    - Add public access policies for variant media (matching product_images pattern)
    - Allow anyone to insert, update, delete variant media

  2. Security
    - Public read access maintained
    - Public write access added to match admin panel requirements
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to variant media" ON product_variant_media;
DROP POLICY IF EXISTS "Allow authenticated users to insert variant media" ON product_variant_media;
DROP POLICY IF EXISTS "Allow authenticated users to update variant media" ON product_variant_media;
DROP POLICY IF EXISTS "Allow authenticated users to delete variant media" ON product_variant_media;

-- Create new public policies
CREATE POLICY "Anyone can view variant media"
  ON product_variant_media
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert variant media"
  ON product_variant_media
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update variant media"
  ON product_variant_media
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete variant media"
  ON product_variant_media
  FOR DELETE
  TO public
  USING (true);
