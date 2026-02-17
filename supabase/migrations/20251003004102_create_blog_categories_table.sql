/*
  # Create Blog Categories Table

  1. New Tables
    - `blog_categories`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `sort_order` (integer) - Display order
      - `is_active` (boolean) - Whether category is visible
      - `icon` (text, nullable) - Icon name for display
      - `color` (text, nullable) - Category color for badges
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Indexes
    - Unique index on slug
    - Index on is_active for filtering
    - Index on sort_order for ordering

  3. Security
    - Enable RLS on `blog_categories` table
    - Add policy for public read access (SELECT)
    - Add policy for authenticated admin write access (INSERT, UPDATE, DELETE)

  4. Migration Safety
    - Uses IF NOT EXISTS to prevent conflicts
    - Does NOT modify existing blog_posts table yet
*/

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  icon text,
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_is_active ON blog_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_blog_categories_sort_order ON blog_categories(sort_order);

-- Enable RLS
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

-- Public can read active blog categories
CREATE POLICY "Public can view active blog categories"
  ON blog_categories
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all blog categories (for admin)
CREATE POLICY "Authenticated users can view all blog categories"
  ON blog_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert blog categories
CREATE POLICY "Authenticated users can insert blog categories"
  ON blog_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update blog categories
CREATE POLICY "Authenticated users can update blog categories"
  ON blog_categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete blog categories
CREATE POLICY "Authenticated users can delete blog categories"
  ON blog_categories
  FOR DELETE
  TO authenticated
  USING (true);