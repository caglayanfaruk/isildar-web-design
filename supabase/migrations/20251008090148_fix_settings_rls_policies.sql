/*
  # Fix Settings Table RLS Policies
  
  1. Changes
    - Drop existing INSERT, UPDATE, DELETE policies
    - Create new policies that work with UPSERT operations
    - Allow all authenticated and anon users to manage settings (for development)
  
  2. Security
    - RLS enabled on settings table
    - Temporary open access for development
    - Should be restricted to admin role in production
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert settings for development" ON settings;
DROP POLICY IF EXISTS "Allow update settings for development" ON settings;
DROP POLICY IF EXISTS "Allow delete settings for development" ON settings;

-- Create new policies that work with UPSERT
CREATE POLICY "Settings insert access"
  ON settings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Settings update access"
  ON settings
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Settings delete access"
  ON settings
  FOR DELETE
  TO anon, authenticated
  USING (true);
