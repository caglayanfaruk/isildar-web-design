/*
  # Categorize Product Attributes by Scope
  
  This migration assigns scope (product/variant/both) to existing attributes based on their purpose.
  
  ## Scope Definitions
  
  **variant**: Attributes that create product variants
  - Different values = different product variants
  - Examples: Color, Size, Power, Socket Type, Lumen
  - Used in variant-type products
  
  **product**: Attributes that describe the product itself
  - Same for all variants of a product
  - Examples: IP Rating, Warranty, Usage Area, Mounting Type
  - Used in simple and variant products
  
  **both**: Can be used at either level depending on context
  - Examples: Energy Class, Voltage, Light Color
  
  ## Categorization Rules
  
  Based on analysis of current usage patterns and e-commerce best practices.
  
  ## Changes
  
  1. Set scope for all active attributes
  2. Mark commonly-used attributes as applies_to_all_categories
  3. Sync is_variant_attribute flag with scope
*/

-- =============================================================================
-- VARIANT-LEVEL ATTRIBUTES (Creates variants)
-- =============================================================================

UPDATE product_attributes 
SET 
  scope = 'variant',
  is_variant_attribute = true
WHERE slug IN (
  'renk',           -- Color (19 values)
  'guc',            -- Power (24 values)
  'size',           -- Size (1 value - Boyut)
  'lumen',          -- Lumen (21 values)
  'duy_tipi',       -- Socket Type (411 values)
  'light_color',    -- Light Color (has options)
  'voltage'         -- Voltage (has options)
) AND is_active = true;

-- =============================================================================
-- PRODUCT-LEVEL ATTRIBUTES (Describes product, not variants)
-- =============================================================================

UPDATE product_attributes 
SET 
  scope = 'product',
  is_variant_attribute = false,
  applies_to_all_categories = true  -- These are universal
WHERE slug IN (
  'ip_sinifi',      -- IP Rating (5 values) - Universal
  'warranty',       -- Warranty (has options) - Universal
  'usage_area',     -- Usage Area (has options) - Universal
  'mounting_type',  -- Mounting Type (has options)
  'features',       -- Features (has options)
  'sensor_type'     -- Sensor Type (has options)
) AND is_active = true;

-- =============================================================================
-- BOTH (Can be used at product or variant level)
-- =============================================================================

UPDATE product_attributes 
SET 
  scope = 'both',
  is_variant_attribute = false
WHERE slug IN (
  'energy_class'    -- Energy Class (has options)
) AND is_active = true;

-- =============================================================================
-- UPDATE COMMONLY USED ATTRIBUTES
-- =============================================================================

-- Mark IP Rating and Warranty as universal (shown for all products)
UPDATE product_attributes 
SET applies_to_all_categories = true
WHERE slug IN ('ip_sinifi', 'warranty') 
  AND is_active = true;

-- =============================================================================
-- VERIFICATION QUERY (commented out for migration)
-- =============================================================================

/*
SELECT 
  name,
  slug,
  scope,
  is_variant_attribute,
  applies_to_all_categories,
  (SELECT COUNT(*) FROM product_attribute_values WHERE attribute_id = product_attributes.id AND is_active = true) as value_count
FROM product_attributes
WHERE is_active = true
ORDER BY scope, name;
*/