/*
  # Fix Variant Field Templates RLS Policies

  1. Changes
    - Drop existing restrictive policies
    - Add new policies allowing anonymous users to manage templates
    - This is needed because the admin panel doesn't use authentication

  2. Security Note
    - In production, you should implement proper authentication
    - For now, allowing anonymous access for admin functionality
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert templates" ON variant_field_templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON variant_field_templates;
DROP POLICY IF EXISTS "Authenticated users can delete templates" ON variant_field_templates;
DROP POLICY IF EXISTS "Authenticated users can view all templates" ON variant_field_templates;

-- Allow anonymous users to insert templates
CREATE POLICY "Anyone can insert templates"
  ON variant_field_templates
  FOR INSERT
  WITH CHECK (true);

-- Allow anonymous users to update templates
CREATE POLICY "Anyone can update templates"
  ON variant_field_templates
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to delete templates
CREATE POLICY "Anyone can delete templates"
  ON variant_field_templates
  FOR DELETE
  USING (true);

-- Anyone can view all templates (already exists but recreating for consistency)
DROP POLICY IF EXISTS "Anyone can view active templates" ON variant_field_templates;

CREATE POLICY "Anyone can view all templates"
  ON variant_field_templates
  FOR SELECT
  USING (true);
