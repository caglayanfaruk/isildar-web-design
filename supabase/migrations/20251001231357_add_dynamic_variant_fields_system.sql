/*
  # Add Dynamic Variant Fields System

  1. Changes
    - Add variant_fields JSONB column to categories table
      - Stores configuration of which fields to show for each category
      - Each field has: key, label_tr, label_en, type, unit (optional)
    
    - Add custom_fields JSONB column to product_variants table
      - Stores actual values for category-specific fields
      - Flexible schema that adapts to category configuration

  2. Notes
    - This allows each category to have different variant fields
    - Admin can configure which fields appear for each category
    - LED products can show: Power, Lumen, Dimensions
    - Cable products can show: Box Pieces, Package Pieces, Volume
    - Easy to add new fields without schema changes
*/

-- Add variant_fields configuration to categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'variant_fields'
  ) THEN
    ALTER TABLE categories ADD COLUMN variant_fields JSONB DEFAULT '{"fields": []}'::jsonb;
  END IF;
END $$;

-- Add custom_fields storage to product_variants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN categories.variant_fields IS 'JSONB configuration defining which variant fields to show for this category. Example: {"fields": [{"key": "power", "label_tr": "Güç", "label_en": "Power", "type": "text", "unit": "W"}]}';
COMMENT ON COLUMN product_variants.custom_fields IS 'JSONB storage for category-specific variant field values. Keys match the field keys defined in category.variant_fields';

-- Create index for better performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_categories_variant_fields ON categories USING gin(variant_fields);
CREATE INDEX IF NOT EXISTS idx_product_variants_custom_fields ON product_variants USING gin(custom_fields);
