/*
  # Add Admin RLS Policies for Products

  This migration adds Row Level Security policies to allow full CRUD operations on products
  and related tables for all users (temporary - until auth is implemented).

  ## Changes
  
  1. Products Table Policies:
     - Allow public SELECT on active products (existing)
     - Add INSERT policy for creating products
     - Add UPDATE policy for editing products
     - Add DELETE policy for removing products

  2. Product Images Policies:
     - Add SELECT policy for viewing images
     - Add INSERT policy for uploading images
     - Add UPDATE policy for editing images
     - Add DELETE policy for removing images

  3. Product Variants Policies:
     - Add full CRUD policies

  4. Product Attributes Policies:
     - Add full CRUD policies

  ## Security Note
  
  These policies allow public access for development/testing.
  In production, replace "true" with proper authentication checks.
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;

-- Products table policies
CREATE POLICY "Anyone can insert products"
  ON products
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update products"
  ON products
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete products"
  ON products
  FOR DELETE
  TO public
  USING (true);

-- Drop existing product images policies
DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
DROP POLICY IF EXISTS "Anyone can insert product images" ON product_images;
DROP POLICY IF EXISTS "Anyone can update product images" ON product_images;
DROP POLICY IF EXISTS "Anyone can delete product images" ON product_images;

-- Product Images policies
CREATE POLICY "Anyone can view product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert product images"
  ON product_images
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update product images"
  ON product_images
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete product images"
  ON product_images
  FOR DELETE
  TO public
  USING (true);

-- Drop existing product variants policies
DROP POLICY IF EXISTS "Anyone can view product variants" ON product_variants;
DROP POLICY IF EXISTS "Anyone can insert product variants" ON product_variants;
DROP POLICY IF EXISTS "Anyone can update product variants" ON product_variants;
DROP POLICY IF EXISTS "Anyone can delete product variants" ON product_variants;

-- Product Variants policies
CREATE POLICY "Anyone can view product variants"
  ON product_variants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert product variants"
  ON product_variants
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update product variants"
  ON product_variants
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete product variants"
  ON product_variants
  FOR DELETE
  TO public
  USING (true);

-- Drop existing media policies
DROP POLICY IF EXISTS "Anyone can view media" ON media;
DROP POLICY IF EXISTS "Anyone can insert media" ON media;
DROP POLICY IF EXISTS "Anyone can update media" ON media;
DROP POLICY IF EXISTS "Anyone can delete media" ON media;

-- Media table policies
CREATE POLICY "Anyone can view media"
  ON media
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert media"
  ON media
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update media"
  ON media
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete media"
  ON media
  FOR DELETE
  TO public
  USING (true);
