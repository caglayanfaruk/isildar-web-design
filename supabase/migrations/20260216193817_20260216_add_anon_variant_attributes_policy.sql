/*
  # Add Anonymous Access for Variant Attributes

  1. Security Changes
    - Add SELECT policy for anonymous users on product_variant_attributes table
    - Allow public to read variant attributes

  2. Important Notes
    - Read-only policy for public access
    - Write operations still require authentication
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view variant attributes" ON product_variant_attributes;

-- Allow anonymous users to read variant attributes
CREATE POLICY "Public can view variant attributes"
  ON product_variant_attributes FOR SELECT
  TO anon, authenticated
  USING (true);