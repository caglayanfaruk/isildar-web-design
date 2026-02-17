/*
  # Add Category Support to Filter System

  1. Changes
    - Add `category_id` to `product_filter_groups` (nullable, for category-specific filters)
    - Add `filter_type` to `product_filter_groups` (enum: 'attribute', 'specification')
    - Add `input_type` to `product_filter_groups` (enum: 'select', 'multiselect', 'range', 'text')
    - Add indexes for better performance
    
  2. Purpose
    - Allows filters to be category-specific or global
    - Distinguishes between visual attributes (color, size) and technical specs (weight, power)
    - Supports different input types for better UX
*/

-- Add category_id to filter groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_filter_groups' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE product_filter_groups 
    ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add filter_type to filter groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_filter_groups' AND column_name = 'filter_type'
  ) THEN
    ALTER TABLE product_filter_groups 
    ADD COLUMN filter_type text DEFAULT 'attribute' CHECK (filter_type IN ('attribute', 'specification'));
  END IF;
END $$;

-- Add input_type to filter groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_filter_groups' AND column_name = 'input_type'
  ) THEN
    ALTER TABLE product_filter_groups 
    ADD COLUMN input_type text DEFAULT 'select' CHECK (input_type IN ('select', 'multiselect', 'range', 'text'));
  END IF;
END $$;

-- Add show_in_filters flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_filter_groups' AND column_name = 'show_in_filters'
  ) THEN
    ALTER TABLE product_filter_groups 
    ADD COLUMN show_in_filters boolean DEFAULT true;
  END IF;
END $$;

-- Create index for category filters
CREATE INDEX IF NOT EXISTS idx_filter_groups_category ON product_filter_groups(category_id);

-- Update existing filters to be global (no category)
UPDATE product_filter_groups SET category_id = NULL WHERE category_id IS NULL;

COMMENT ON COLUMN product_filter_groups.category_id IS 'NULL = global filter, applies to all categories. Set to category_id for category-specific filters';
COMMENT ON COLUMN product_filter_groups.filter_type IS 'attribute = visual/selectable (color, size), specification = technical (weight, power, dimensions)';
COMMENT ON COLUMN product_filter_groups.input_type IS 'select = single choice, multiselect = multiple choices, range = min-max slider, text = free text input';
COMMENT ON COLUMN product_filter_groups.show_in_filters IS 'Show this filter group in category filter sidebar';
