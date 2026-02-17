/*
  # Fix Product Translations RLS for Anonymous Users
  
  1. Security
    - Add policy to allow anonymous users to manage product translations
    - This is needed for admin panel operations before authentication is implemented
    
  Note: In production, this should be restricted to authenticated admin users only
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anonymous users can manage product translations" ON product_translations;

-- Create policy for anonymous users (temporary for development)
CREATE POLICY "Anonymous users can manage product translations"
  ON product_translations
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
