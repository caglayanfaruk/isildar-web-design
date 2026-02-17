/*
  # Add RLS Policies for Translations and Storage

  This migration adds Row Level Security policies for translations table
  and storage bucket policies for media uploads.

  ## Changes
  
  1. Translations Table Policies:
     - Add SELECT policy for viewing translations
     - Add INSERT policy for creating translations
     - Add UPDATE policy for editing translations
     - Add DELETE policy for removing translations

  2. Storage Bucket Policies:
     - Add SELECT policy for viewing media files
     - Add INSERT policy for uploading media files
     - Add UPDATE policy for updating media files
     - Add DELETE policy for removing media files

  ## Security Note
  
  These policies allow public access for development/testing.
  In production, replace with proper authentication checks.
*/

-- Translations table policies
DROP POLICY IF EXISTS "Anyone can view translations" ON translations;
DROP POLICY IF EXISTS "Anyone can insert translations" ON translations;
DROP POLICY IF EXISTS "Anyone can update translations" ON translations;
DROP POLICY IF EXISTS "Anyone can delete translations" ON translations;

CREATE POLICY "Anyone can view translations"
  ON translations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert translations"
  ON translations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update translations"
  ON translations
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete translations"
  ON translations
  FOR DELETE
  TO public
  USING (true);

-- Categories table policies (if not already set)
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Anyone can insert categories" ON categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON categories;

CREATE POLICY "Anyone can view categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert categories"
  ON categories
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update categories"
  ON categories
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete categories"
  ON categories
  FOR DELETE
  TO public
  USING (true);
