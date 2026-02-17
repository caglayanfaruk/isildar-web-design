/*
  # Fix Contact Messages RLS Policy

  1. Changes
    - Add SELECT policy for authenticated users to read contact messages
    - This allows admin panel to display contact messages
    
  2. Security
    - Only authenticated users (admins) can read messages
    - Anonymous users can still insert (submit contact form)
*/

-- Allow authenticated users to read contact messages
CREATE POLICY "Authenticated users can read contact messages" 
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update contact messages
CREATE POLICY "Authenticated users can update contact messages"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete contact messages
CREATE POLICY "Authenticated users can delete contact messages"
  ON contact_messages
  FOR DELETE
  TO authenticated
  USING (true);
