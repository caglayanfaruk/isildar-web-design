/*
  # Fix Product Documents Policies for Anonymous Access

  1. Changes
    - Add policies for anonymous (anon) role to manage product documents
    - This allows admin panel to work without authentication
  
  2. Security Note
    - In production, admin panel should require authentication
    - For now, allowing anon access for development/testing
*/

-- Allow anonymous users to insert documents
CREATE POLICY "Anonymous users can insert product documents"
  ON product_documents
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update documents
CREATE POLICY "Anonymous users can update product documents"
  ON product_documents
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to delete documents
CREATE POLICY "Anonymous users can delete product documents"
  ON product_documents
  FOR DELETE
  TO anon
  USING (true);
