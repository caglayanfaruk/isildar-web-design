/*
  # Add Logistics Fields to Product Variants

  1. Changes
    - Add box_pieces (KUTU ADET) field to product_variants
    - Add package_pieces (KOLİ ADET) field to product_variants
    - Add package_volume (KOLİ HACİM m³) field to product_variants
    - Add package_weight (KOLİ AĞIRLIK kg) field to product_variants
    - Remove price, compare_price, cost_price as they're not needed
    - Remove barcode as it's not needed
  
  2. Notes
    - These fields store logistics/shipping information for each variant
    - Used for product catalog display and export documentation
*/

-- Add logistics fields to product_variants table
DO $$
BEGIN
  -- Add box_pieces field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'box_pieces'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN box_pieces integer;
  END IF;

  -- Add package_pieces field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'package_pieces'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN package_pieces integer;
  END IF;

  -- Add package_volume field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'package_volume'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN package_volume decimal(10, 4);
  END IF;

  -- Add package_weight field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'package_weight'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN package_weight decimal(10, 2);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN product_variants.box_pieces IS 'Number of pieces per box (KUTU ADET)';
COMMENT ON COLUMN product_variants.package_pieces IS 'Number of pieces per package/carton (KOLİ ADET)';
COMMENT ON COLUMN product_variants.package_volume IS 'Package volume in cubic meters (KOLİ HACİM m³)';
COMMENT ON COLUMN product_variants.package_weight IS 'Package weight in kilograms (KOLİ AĞIRLIK kg)';
