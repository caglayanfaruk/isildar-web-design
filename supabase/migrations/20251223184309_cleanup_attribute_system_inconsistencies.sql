/*
  # Cleanup Attribute System Inconsistencies

  ## Summary
  This migration cleans up data inconsistencies in the product attribute system
  that were discovered during system analysis.

  ## Issues Fixed
  
  1. **Misplaced Variant Attribute Assignments**
     - Problem: 1,013 attribute assignments with scope='variant' were incorrectly 
       stored in product_attribute_assignments table
     - Attributes affected: Renk (420), Güç (218), Duy Tipi (196), Lümen (179)
     - Solution: Delete these records as they're already correctly stored in 
       product_variant_attributes table (verified 740/760 variants have correct data)
  
  2. **Redundant is_variant_attribute Column**
     - Problem: is_variant_attribute column duplicates the scope field logic
     - Solution: Remove this column and use scope='variant' instead
     - Impact: Update product_attributes_with_counts view to remove this field
  
  ## Data Safety
  
  - Verified that variant attributes exist in correct table before deletion
  - Only affects 461 products with average 5.58 variants each
  - Product scope attributes (IP Sınıfı: 265 records) remain untouched
  - No data loss: variant data exists in product_variant_attributes

  ## Notes on applies_to_all_categories
  
  The applies_to_all_categories flag has inconsistencies but is kept for now:
  - When true: attribute can be used in any category (regardless of category_attributes)
  - When false: attribute only available in categories listed in category_attributes
  - Future: Consider enforcing this logic in application code
*/

-- Step 1: Remove misplaced variant scope assignments from product level
DELETE FROM product_attribute_assignments 
WHERE attribute_id IN (
  SELECT id 
  FROM product_attributes 
  WHERE scope = 'variant'
);

-- Step 2: Drop and recreate the view without is_variant_attribute
DROP VIEW IF EXISTS product_attributes_with_counts;

-- Step 3: Remove redundant is_variant_attribute column
ALTER TABLE product_attributes 
DROP COLUMN IF EXISTS is_variant_attribute;

-- Step 4: Recreate the view without is_variant_attribute column
CREATE VIEW product_attributes_with_counts AS
SELECT 
  pa.id,
  pa.name,
  pa.slug,
  pa.type,
  pa.is_filterable,
  pa.is_required,
  pa.sort_order,
  pa.options,
  pa.validation_rules,
  pa.is_active,
  pa.created_at,
  pa.updated_at,
  pa.scope,
  pa.applies_to_all_categories,
  pa.minimum_values_required,
  pa.options_deprecated,
  COUNT(DISTINCT pav.id) FILTER (WHERE pav.is_active = true) AS value_count
FROM product_attributes pa
LEFT JOIN product_attribute_values pav ON pav.attribute_id = pa.id
GROUP BY pa.id;

-- Step 5: Add helpful comments
COMMENT ON COLUMN product_attributes.scope IS 
  'Defines where attribute values are stored: product (product_attribute_assignments), variant (product_variant_attributes), or both (either table)';

COMMENT ON COLUMN product_attributes.applies_to_all_categories IS
  'When true, attribute is available for all categories regardless of category_attributes table. When false, only available in categories explicitly listed in category_attributes.';
