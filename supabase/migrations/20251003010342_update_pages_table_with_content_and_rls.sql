/*
  # Update Pages Table - Add Content Fields and RLS

  1. Table Updates
    - Add `title` column for page title (multilingual via translations)
    - Add `content` column for rich text content
    - Add `featured_image_id` column for featured image reference
    - Update existing columns if needed

  2. Security
    - Enable RLS on pages table
    - Public can read published pages
    - Authenticated users can manage all pages

  3. Notes
    - Page titles will use translation system: `page.{page_id}.title`
    - Page content will use translation system: `page.{page_id}.content`
*/

-- Add new columns to pages table
DO $$ 
BEGIN
  -- Add featured_image_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pages' AND column_name = 'featured_image_id'
  ) THEN
    ALTER TABLE pages ADD COLUMN featured_image_id uuid REFERENCES media(id) ON DELETE SET NULL;
  END IF;

  -- Add content if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pages' AND column_name = 'content'
  ) THEN
    ALTER TABLE pages ADD COLUMN content text;
  END IF;

  -- Add title if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pages' AND column_name = 'title'
  ) THEN
    ALTER TABLE pages ADD COLUMN title text;
  END IF;
END $$;

-- Create index on featured_image_id
CREATE INDEX IF NOT EXISTS idx_pages_featured_image_id ON pages(featured_image_id);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view published pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users can view all pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users can insert pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users can update pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users can delete pages" ON pages;

-- RLS Policies for pages table
CREATE POLICY "Public can view published pages"
  ON pages
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can view all pages"
  ON pages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pages"
  ON pages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pages"
  ON pages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete pages"
  ON pages
  FOR DELETE
  TO authenticated
  USING (true);