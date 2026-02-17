/*
  # Create Documents Table for Quick Menu

  1. New Tables
    - `quick_menu_documents`
      - `id` (uuid, primary key)
      - `type` (text) - catalog, price_list, brochure, etc.
      - `language_code` (text) - tr, en, etc.
      - `file_id` (uuid) - reference to media table
      - `version` (text) - version number
      - `is_active` (boolean) - whether document is active
      - `sort_order` (integer) - display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on quick_menu_documents table
    - Public can read active documents
    - Authenticated users can manage all documents

  3. Indexes
    - Index on type for faster filtering
    - Index on language_code for language-based queries
    - Index on is_active for filtering active documents
*/

-- Create quick_menu_documents table
CREATE TABLE IF NOT EXISTS quick_menu_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  language_code text NOT NULL,
  file_id uuid REFERENCES media(id) ON DELETE SET NULL,
  version text DEFAULT '1.0',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quick_menu_documents_type ON quick_menu_documents(type);
CREATE INDEX IF NOT EXISTS idx_quick_menu_documents_language ON quick_menu_documents(language_code);
CREATE INDEX IF NOT EXISTS idx_quick_menu_documents_active ON quick_menu_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_quick_menu_documents_file_id ON quick_menu_documents(file_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_quick_menu_documents_type_lang_active 
  ON quick_menu_documents(type, language_code, is_active);

-- Enable RLS
ALTER TABLE quick_menu_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active documents" ON quick_menu_documents;
DROP POLICY IF EXISTS "Authenticated users can view all documents" ON quick_menu_documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON quick_menu_documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON quick_menu_documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON quick_menu_documents;

-- RLS Policies
CREATE POLICY "Public can view active documents"
  ON quick_menu_documents
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all documents"
  ON quick_menu_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON quick_menu_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON quick_menu_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents"
  ON quick_menu_documents
  FOR DELETE
  TO authenticated
  USING (true);