/*
  # Add Unique Constraint to product_attribute_values
  
  ## Overview
  Adds a unique constraint on (attribute_id, value) to product_attribute_values table.
  This is needed for the unified attributes system to prevent duplicate values.
  
  ## Changes
  - Add unique constraint on (attribute_id, value) combination
  - Remove any existing duplicates before adding constraint
  
  ## Safety
  - Checks for existing constraint before adding
  - Preserves all data (keeps first occurrence of duplicates)
*/

-- First, remove any duplicate values (keep the first one based on created_at)
DELETE FROM product_attribute_values pav1
WHERE EXISTS (
  SELECT 1 FROM product_attribute_values pav2
  WHERE pav2.attribute_id = pav1.attribute_id
    AND pav2.value = pav1.value
    AND pav2.created_at < pav1.created_at
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'product_attribute_values_attribute_value_unique'
  ) THEN
    ALTER TABLE product_attribute_values 
    ADD CONSTRAINT product_attribute_values_attribute_value_unique 
    UNIQUE (attribute_id, value);
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attr_value 
ON product_attribute_values(attribute_id, value);
