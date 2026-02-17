/*
  # Enhance Product Attributes Schema
  
  This migration enhances the product attributes system to support better organization and usability.
  
  ## Changes Made
  
  1. **Schema Enhancements**
     - Add `scope` column to define attribute purpose (product/variant/both)
     - Add `applies_to_all_categories` flag for global attributes
     - Add `minimum_values_required` to prevent empty dropdowns
     - Deprecate unused `options` JSONB field
  
  2. **Performance Improvements**
     - Add indexes for better query performance
     - Index on scope for filtering
     - Index on category_attributes for category lookups
  
  3. **Data Integrity**
     - Add constraints to ensure valid scope values
     - Set sensible defaults for new columns
  
  ## Notes
  - This is part 1 of the attribute system redesign
  - Existing data remains intact
  - Part 2 will merge duplicate attributes
  - Part 3 will categorize attributes by scope
  - Part 4 will populate category_attributes table
*/

-- Add scope column to product_attributes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_attributes' AND column_name = 'scope'
  ) THEN
    ALTER TABLE product_attributes 
    ADD COLUMN scope VARCHAR(20) DEFAULT 'product' CHECK (scope IN ('product', 'variant', 'both'));
    
    COMMENT ON COLUMN product_attributes.scope IS 'Defines where the attribute is used: product (non-variant), variant (creates variants), or both';
  END IF;
END $$;

-- Add applies_to_all_categories flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_attributes' AND column_name = 'applies_to_all_categories'
  ) THEN
    ALTER TABLE product_attributes
    ADD COLUMN applies_to_all_categories BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN product_attributes.applies_to_all_categories IS 'If true, this attribute appears for all categories without explicit assignment';
  END IF;
END $$;

-- Add minimum_values_required
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_attributes' AND column_name = 'minimum_values_required'
  ) THEN
    ALTER TABLE product_attributes
    ADD COLUMN minimum_values_required INTEGER DEFAULT 1;
    
    COMMENT ON COLUMN product_attributes.minimum_values_required IS 'Minimum number of values needed before showing this attribute in forms';
  END IF;
END $$;

-- Deprecate options field (move to options_deprecated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_attributes' AND column_name = 'options_deprecated'
  ) THEN
    ALTER TABLE product_attributes
    ADD COLUMN options_deprecated JSONB DEFAULT NULL;
    
    -- Copy existing options to deprecated field
    UPDATE product_attributes 
    SET options_deprecated = options 
    WHERE options IS NOT NULL AND options::text != '[]' AND options::text != '{}';
    
    COMMENT ON COLUMN product_attributes.options_deprecated IS 'Deprecated: Options moved to product_attribute_values table';
  END IF;
END $$;

-- Add is_required to category_attributes if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'category_attributes' AND column_name = 'is_required'
  ) THEN
    ALTER TABLE category_attributes
    ADD COLUMN is_required BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN category_attributes.is_required IS 'Whether this attribute is required for products in this category';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_attributes_scope 
ON product_attributes(scope) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_attributes_applies_all 
ON product_attributes(applies_to_all_categories) 
WHERE is_active = true AND applies_to_all_categories = true;

CREATE INDEX IF NOT EXISTS idx_category_attributes_category 
ON category_attributes(category_id);

CREATE INDEX IF NOT EXISTS idx_category_attributes_attribute 
ON category_attributes(attribute_id);

CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attribute 
ON product_attribute_values(attribute_id) 
WHERE is_active = true;

-- Add value_count helper view
CREATE OR REPLACE VIEW product_attributes_with_counts AS
SELECT 
  pa.*,
  COUNT(DISTINCT pav.id) FILTER (WHERE pav.is_active = true) as value_count
FROM product_attributes pa
LEFT JOIN product_attribute_values pav ON pav.attribute_id = pa.id
GROUP BY pa.id;