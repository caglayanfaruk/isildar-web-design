/*
  # Remove packaging attributes and universal flag

  1. Changes
    - Delete 4 packaging attributes from product_attributes: Kutu Adet, Koli Adedi, Koli Hacim, Koli Agirlik
    - These had 0 assignments in both product_attribute_assignments and product_variant_attributes
    - Remove their category_attributes junction records
    - Remove applies_to_all_categories = true from remaining attributes (making all attributes equal)

  2. Important Notes
    - No data loss: packaging attributes had zero usage (verified before migration)
    - Remaining attributes keep their category_attributes mappings intact
    - The applies_to_all_categories flag is set to false for all remaining attributes
    - Categories that already had these attributes assigned will keep them via category_attributes
*/

-- Step 1: Delete category_attributes for the 4 packaging attributes
DELETE FROM category_attributes
WHERE attribute_id IN (
  SELECT id FROM product_attributes
  WHERE slug IN ('kutu-adet', 'koli-adedi', 'koli-hacim-m', 'koli-agirlik')
);

-- Step 2: Delete attribute values for the 4 packaging attributes (if any)
DELETE FROM product_attribute_values
WHERE attribute_id IN (
  SELECT id FROM product_attributes
  WHERE slug IN ('kutu-adet', 'koli-adedi', 'koli-hacim-m', 'koli-agirlik')
);

-- Step 3: Delete the 4 packaging attributes themselves
DELETE FROM product_attributes
WHERE slug IN ('kutu-adet', 'koli-adedi', 'koli-hacim-m', 'koli-agirlik');

-- Step 4: Ensure remaining "universal" attributes are assigned to ALL existing categories
-- Before removing the flag, we need to make sure every category has these attributes
INSERT INTO category_attributes (category_id, attribute_id, is_required, sort_order)
SELECT c.id, pa.id, false, pa.sort_order
FROM categories c
CROSS JOIN product_attributes pa
WHERE pa.applies_to_all_categories = true
  AND pa.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM category_attributes ca
    WHERE ca.category_id = c.id AND ca.attribute_id = pa.id
  );

-- Step 5: Remove the universal flag - all attributes are now equal
UPDATE product_attributes
SET applies_to_all_categories = false
WHERE applies_to_all_categories = true;
