/*
  # Add Product Filter Assignments

  1. New Tables
    - `product_filter_values`
      - Junction table between products and filter options
      - Stores which filter options are assigned to which products

  2. Indexes
    - Index on product_id for faster filtering
    - Index on filter_option_id for reverse lookups
    - Composite index for common queries

  3. Security
    - Enable RLS
    - Public can read active assignments
    - Authenticated users can manage assignments
*/

-- Create product_filter_values table
CREATE TABLE IF NOT EXISTS product_filter_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  filter_option_id uuid NOT NULL REFERENCES product_filter_options(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, filter_option_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_filter_values_product_id ON product_filter_values(product_id);
CREATE INDEX IF NOT EXISTS idx_product_filter_values_filter_option_id ON product_filter_values(filter_option_id);
CREATE INDEX IF NOT EXISTS idx_product_filter_values_composite ON product_filter_values(product_id, filter_option_id);

-- Enable RLS
ALTER TABLE product_filter_values ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view product filter values" ON product_filter_values;
DROP POLICY IF EXISTS "Authenticated users can view all filter values" ON product_filter_values;
DROP POLICY IF EXISTS "Authenticated users can insert filter values" ON product_filter_values;
DROP POLICY IF EXISTS "Authenticated users can update filter values" ON product_filter_values;
DROP POLICY IF EXISTS "Authenticated users can delete filter values" ON product_filter_values;

-- RLS Policies
CREATE POLICY "Public can view product filter values"
  ON product_filter_values
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can view all filter values"
  ON product_filter_values
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert filter values"
  ON product_filter_values
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update filter values"
  ON product_filter_values
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete filter values"
  ON product_filter_values
  FOR DELETE
  TO authenticated
  USING (true);