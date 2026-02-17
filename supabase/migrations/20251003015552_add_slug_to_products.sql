/*
  # Add slug column to products table

  1. Changes
    - Add slug column to products table
    - Create index for faster slug lookups
    - Add unique constraint to prevent duplicate slugs

  2. Notes
    - Slug is optional initially (existing products may not have slugs)
    - Admin can set slugs for products
    - If no slug exists, SKU will be used as fallback
*/

-- Add slug column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'slug'
  ) THEN
    ALTER TABLE products ADD COLUMN slug text;
  END IF;
END $$;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Create unique constraint for non-null slugs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_slug_unique'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_slug_unique UNIQUE (slug);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;