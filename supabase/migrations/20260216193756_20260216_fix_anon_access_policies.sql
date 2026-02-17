/*
  # Fix Anonymous Access Policies

  1. Security Changes
    - Add SELECT policy for anonymous users on product_variants table
    - Add SELECT policy for anonymous users on quick_menu_documents table
    - Allow public to read active variants and documents

  2. Important Notes
    - These are read-only policies for public access
    - Only active records are exposed
    - Write operations still require authentication
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view active product variants" ON product_variants;

-- Allow anonymous users to read active product variants
CREATE POLICY "Public can view active product variants"
  ON product_variants FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view active quick menu documents" ON quick_menu_documents;

-- Allow anonymous users to read active quick menu documents
CREATE POLICY "Public can view active quick menu documents"
  ON quick_menu_documents FOR SELECT
  TO anon, authenticated
  USING (is_active = true);