/*
  # Create Product Categories Junction Table

  This migration creates a many-to-many relationship between products and categories,
  allowing a product to belong to multiple categories.

  ## Changes
  
  1. New Table: product_categories
     - product_id (uuid, references products)
     - category_id (uuid, references categories)
     - is_primary (boolean) - marks the primary category
     - sort_order (integer) - for ordering categories
     - created_at (timestamptz)

  2. Indexes:
     - Composite unique index on (product_id, category_id)
     - Index on product_id for faster lookups
     - Index on category_id for faster lookups

  3. RLS Policies:
     - Allow public access for development

  ## Note
  
  The existing products.category_id column will remain for backward compatibility
  but new products should use the product_categories junction table.
*/

-- Create product_categories junction table
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure a product can't have the same category twice
  UNIQUE(product_id, category_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_is_primary ON product_categories(is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view product categories" ON product_categories;
DROP POLICY IF EXISTS "Anyone can insert product categories" ON product_categories;
DROP POLICY IF EXISTS "Anyone can update product categories" ON product_categories;
DROP POLICY IF EXISTS "Anyone can delete product categories" ON product_categories;

-- Create RLS policies
CREATE POLICY "Anyone can view product categories"
  ON product_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert product categories"
  ON product_categories
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update product categories"
  ON product_categories
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete product categories"
  ON product_categories
  FOR DELETE
  TO public
  USING (true);
