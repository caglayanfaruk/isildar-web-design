/*
  # Fix Media Table Public Access
  
  ## Overview
  Restore public read access to media table that was accidentally removed during policy consolidation.
  
  ## Issue
  Previous migration removed all public SELECT policies from media table, breaking frontend access
  for anonymous users viewing images, slider images, etc.
  
  ## Solution
  Add back a public SELECT policy to allow anyone (including anonymous users) to read media records.
  
  ## Changes
  - Add SELECT policy for anon and authenticated roles
*/

-- Allow public read access to media table
CREATE POLICY "Public can read media"
  ON media
  FOR SELECT
  TO anon, authenticated
  USING (true);
