/*
  # Add Admin Policies for Settings Table

  1. Changes
    - Add INSERT policy for settings table
    - Add UPDATE policy for settings table  
    - Add DELETE policy for settings table
    - These policies allow anonymous users for now (should be restricted to authenticated admins in production)

  2. Security
    - Temporary open access for development
    - Should be restricted to admin role in production
*/

-- Allow anyone to insert settings (TEMPORARY - should be admin only)
CREATE POLICY "Allow insert settings for development"
  ON settings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to update settings (TEMPORARY - should be admin only)
CREATE POLICY "Allow update settings for development"
  ON settings
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete settings (TEMPORARY - should be admin only)
CREATE POLICY "Allow delete settings for development"
  ON settings
  FOR DELETE
  TO anon, authenticated
  USING (true);
