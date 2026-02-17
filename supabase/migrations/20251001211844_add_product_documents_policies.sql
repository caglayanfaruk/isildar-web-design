/*
  # Add RLS Policies for Product Documents

  1. Security
    - Enable RLS on product_documents table
    - Add policies for public read access
    - Add policies for authenticated users to insert, update, delete
  
  2. Changes
    - Public users can read all documents
    - Authenticated users can manage all documents (admin panel)
*/

-- Enable RLS
ALTER TABLE product_documents ENABLE ROW LEVEL SECURITY;

-- Public can read all documents
CREATE POLICY "Anyone can view product documents"
  ON product_documents
  FOR SELECT
  USING (true);

-- Authenticated users can insert documents
CREATE POLICY "Authenticated users can insert product documents"
  ON product_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update documents
CREATE POLICY "Authenticated users can update product documents"
  ON product_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete documents
CREATE POLICY "Authenticated users can delete product documents"
  ON product_documents
  FOR DELETE
  TO authenticated
  USING (true);
