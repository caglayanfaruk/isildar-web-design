/*
  # Migrate Variant Custom Fields to Product Variant Attributes
  
  This migration moves Güç (Power) and Renk (Color) data from custom_fields JSONB
  to the proper product_variant_attributes table for all variant-type products.
  
  ## What it does:
  1. Finds all product variants with Güç and Renk in custom_fields
  2. Looks up the corresponding attribute IDs and values
  3. Creates or updates product_variant_attributes records
  
  ## Why:
  - Frontend expects variant attributes in product_variant_attributes table
  - custom_fields should only be used for category-specific non-variant data
  - This fixes the issue where variant attributes don't display on product pages
*/

DO $$
DECLARE
  v_variant RECORD;
  v_guc_attr_id uuid;
  v_renk_attr_id uuid;
  v_guc_value_id uuid;
  v_renk_value_id uuid;
  v_guc_value text;
  v_renk_value text;
  v_count integer := 0;
BEGIN
  -- Get attribute IDs
  SELECT id INTO v_guc_attr_id FROM product_attributes WHERE slug = 'guc';
  SELECT id INTO v_renk_attr_id FROM product_attributes WHERE slug = 'renk';
  
  -- Loop through all variants that have Güç or Renk in custom_fields
  FOR v_variant IN 
    SELECT id, custom_fields
    FROM product_variants
    WHERE custom_fields ? 'Güç' OR custom_fields ? 'Renk'
  LOOP
    -- Extract values from custom_fields
    v_guc_value := v_variant.custom_fields->>'Güç';
    v_renk_value := v_variant.custom_fields->>'Renk';
    
    -- Process Güç (Power)
    IF v_guc_value IS NOT NULL AND v_guc_attr_id IS NOT NULL THEN
      -- Find or create attribute value
      SELECT id INTO v_guc_value_id 
      FROM product_attribute_values 
      WHERE attribute_id = v_guc_attr_id AND value = v_guc_value;
      
      IF v_guc_value_id IS NULL THEN
        INSERT INTO product_attribute_values (attribute_id, value, display_value, is_active, sort_order)
        VALUES (v_guc_attr_id, v_guc_value, v_guc_value, true, 0)
        RETURNING id INTO v_guc_value_id;
      END IF;
      
      -- Insert or update variant attribute
      INSERT INTO product_variant_attributes (variant_id, attribute_id, attribute_value_id)
      VALUES (v_variant.id, v_guc_attr_id, v_guc_value_id)
      ON CONFLICT (variant_id, attribute_id) 
      DO UPDATE SET attribute_value_id = EXCLUDED.attribute_value_id;
      
      v_count := v_count + 1;
    END IF;
    
    -- Process Renk (Color)
    IF v_renk_value IS NOT NULL AND v_renk_attr_id IS NOT NULL THEN
      -- Find or create attribute value
      SELECT id INTO v_renk_value_id 
      FROM product_attribute_values 
      WHERE attribute_id = v_renk_attr_id AND value = v_renk_value;
      
      IF v_renk_value_id IS NULL THEN
        INSERT INTO product_attribute_values (attribute_id, value, display_value, is_active, sort_order)
        VALUES (v_renk_attr_id, v_renk_value, v_renk_value, true, 0)
        RETURNING id INTO v_renk_value_id;
      END IF;
      
      -- Insert or update variant attribute
      INSERT INTO product_variant_attributes (variant_id, attribute_id, attribute_value_id)
      VALUES (v_variant.id, v_renk_attr_id, v_renk_value_id)
      ON CONFLICT (variant_id, attribute_id) 
      DO UPDATE SET attribute_value_id = EXCLUDED.attribute_value_id;
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration completed: % variant attributes migrated', v_count;
END $$;
