/*
  # Fix Slider Policies for Anonymous Access

  1. Changes
    - Allow anonymous users to manage sliders (for development/testing)
    - This should be restricted in production with proper authentication

  2. Security Note
    - In production, these policies should check for admin role
    - Currently allowing anon for development purposes
*/

-- Allow anon users to manage sliders
DROP POLICY IF EXISTS "Anyone can manage sliders" ON sliders;
CREATE POLICY "Anyone can manage sliders"
  ON sliders
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon users to manage slider_items
DROP POLICY IF EXISTS "Anyone can manage slider items" ON slider_items;
CREATE POLICY "Anyone can manage slider items"
  ON slider_items
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
