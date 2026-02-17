/*
  # Merge Duplicate Product Attributes
  
  This migration merges duplicate attributes that have different slugs but represent the same concept.
  
  ## Duplicates Being Merged
  
  1. **Renk (Color)**
     - KEEP: slug='renk' (19 values) ✓
     - MERGE: slug='color' (8 values) → migrate to 'renk'
  
  2. **Güç (Power)**
     - KEEP: slug='guc' (24 values) ✓
     - MERGE: slug='power' (0 values) → deactivate
  
  3. **IP Sınıfı (IP Rating)**
     - KEEP: slug='ip_sinifi' (5 values) ✓
     - MERGE: slug='ip-sinifi' (0 values, but has options) → migrate options
  
  4. **Duy Tipi (Socket Type)**
     - KEEP: slug='duy_tipi' (411 values) ✓
     - MERGE: slug='duy-tipi' (0 values) → deactivate
  
  ## Strategy
  
  For each duplicate pair:
  1. Identify the attribute to keep (most values)
  2. Migrate values from duplicate to kept attribute
  3. Update product_attribute_assignments references
  4. Update product_variant_attributes references  
  5. Deactivate duplicate attribute
  6. Add note to duplicate for audit trail
  
  ## Data Safety
  
  - No data is deleted, only migrated
  - Duplicate attributes are deactivated, not deleted
  - All product assignments are preserved
  - Rollback possible by reactivating old attributes
*/

-- =============================================================================
-- 1. MERGE RENK: color → renk
-- =============================================================================

DO $$
DECLARE
  keep_attr_id UUID;
  merge_attr_id UUID;
  value_record RECORD;
  new_value_id UUID;
BEGIN
  -- Get attribute IDs
  SELECT id INTO keep_attr_id FROM product_attributes WHERE slug = 'renk';
  SELECT id INTO merge_attr_id FROM product_attributes WHERE slug = 'color';
  
  IF merge_attr_id IS NOT NULL AND keep_attr_id IS NOT NULL THEN
    RAISE NOTICE 'Merging color → renk...';
    
    -- Migrate values from 'color' to 'renk'
    FOR value_record IN 
      SELECT * FROM product_attribute_values 
      WHERE attribute_id = merge_attr_id AND is_active = true
    LOOP
      -- Check if value already exists in kept attribute
      SELECT id INTO new_value_id 
      FROM product_attribute_values 
      WHERE attribute_id = keep_attr_id 
        AND (value = value_record.value OR display_value = value_record.display_value)
      LIMIT 1;
      
      IF new_value_id IS NULL THEN
        -- Value doesn't exist, migrate it
        INSERT INTO product_attribute_values (
          attribute_id, value, display_value, is_active, sort_order
        ) VALUES (
          keep_attr_id, 
          value_record.value, 
          value_record.display_value,
          true,
          value_record.sort_order
        ) RETURNING id INTO new_value_id;
        
        RAISE NOTICE 'Migrated value: % → renk', value_record.value;
      END IF;
      
      -- Update product assignments
      UPDATE product_attribute_assignments 
      SET attribute_value_id = new_value_id 
      WHERE attribute_value_id = value_record.id;
      
      -- Update variant attributes
      UPDATE product_variant_attributes 
      SET attribute_value_id = new_value_id 
      WHERE attribute_value_id = value_record.id;
    END LOOP;
    
    -- Deactivate old attribute
    UPDATE product_attributes 
    SET is_active = false,
        name = name || ' (MERGED to renk)'
    WHERE id = merge_attr_id;
    
    RAISE NOTICE 'Color attribute merged successfully';
  END IF;
END $$;

-- =============================================================================
-- 2. MERGE GÜÇ: power → guc
-- =============================================================================

DO $$
DECLARE
  keep_attr_id UUID;
  merge_attr_id UUID;
BEGIN
  SELECT id INTO keep_attr_id FROM product_attributes WHERE slug = 'guc';
  SELECT id INTO merge_attr_id FROM product_attributes WHERE slug = 'power';
  
  IF merge_attr_id IS NOT NULL AND keep_attr_id IS NOT NULL THEN
    RAISE NOTICE 'Merging power → guc...';
    
    -- No values to migrate (power has 0 values), just deactivate
    UPDATE product_attributes 
    SET is_active = false,
        name = name || ' (MERGED to guc)'
    WHERE id = merge_attr_id;
    
    RAISE NOTICE 'Power attribute merged successfully';
  END IF;
END $$;

-- =============================================================================
-- 3. MERGE IP SINIFI: ip-sinifi → ip_sinifi
-- =============================================================================

DO $$
DECLARE
  keep_attr_id UUID;
  merge_attr_id UUID;
  option_value TEXT;
  existing_value UUID;
BEGIN
  SELECT id INTO keep_attr_id FROM product_attributes WHERE slug = 'ip_sinifi';
  SELECT id INTO merge_attr_id FROM product_attributes WHERE slug = 'ip-sinifi';
  
  IF merge_attr_id IS NOT NULL AND keep_attr_id IS NOT NULL THEN
    RAISE NOTICE 'Merging ip-sinifi → ip_sinifi...';
    
    -- Migrate options from ip-sinifi to ip_sinifi if they don't exist
    FOR option_value IN 
      SELECT jsonb_array_elements_text(options) as opt 
      FROM product_attributes 
      WHERE slug = 'ip-sinifi' AND options IS NOT NULL
    LOOP
      -- Check if option already exists as value in kept attribute
      SELECT id INTO existing_value 
      FROM product_attribute_values 
      WHERE attribute_id = keep_attr_id AND value = option_value
      LIMIT 1;
      
      IF existing_value IS NULL THEN
        INSERT INTO product_attribute_values (
          attribute_id, value, display_value, is_active, sort_order
        ) VALUES (
          keep_attr_id, option_value, option_value, true, 100
        );
        RAISE NOTICE 'Migrated option: % → ip_sinifi', option_value;
      END IF;
    END LOOP;
    
    -- Deactivate old attribute
    UPDATE product_attributes 
    SET is_active = false,
        name = name || ' (MERGED to ip_sinifi)'
    WHERE id = merge_attr_id;
    
    RAISE NOTICE 'IP-sinifi attribute merged successfully';
  END IF;
END $$;

-- =============================================================================
-- 4. MERGE DUY TIPI: duy-tipi → duy_tipi
-- =============================================================================

DO $$
DECLARE
  keep_attr_id UUID;
  merge_attr_id UUID;
BEGIN
  SELECT id INTO keep_attr_id FROM product_attributes WHERE slug = 'duy_tipi';
  SELECT id INTO merge_attr_id FROM product_attributes WHERE slug = 'duy-tipi';
  
  IF merge_attr_id IS NOT NULL AND keep_attr_id IS NOT NULL THEN
    RAISE NOTICE 'Merging duy-tipi → duy_tipi...';
    
    -- No values to migrate (duy-tipi has 0 values), just deactivate
    UPDATE product_attributes 
    SET is_active = false,
        name = name || ' (MERGED to duy_tipi)'
    WHERE id = merge_attr_id;
    
    RAISE NOTICE 'Duy-tipi attribute merged successfully';
  END IF;
END $$;

-- =============================================================================
-- CLEANUP: Deactivate attributes with 0 values
-- =============================================================================

DO $$
BEGIN
  UPDATE product_attributes 
  SET is_active = false
  WHERE id IN (
    SELECT pa.id 
    FROM product_attributes pa
    LEFT JOIN product_attribute_values pav ON pav.attribute_id = pa.id AND pav.is_active = true
    WHERE pa.is_active = true
    GROUP BY pa.id
    HAVING COUNT(pav.id) = 0
  ) AND slug IN ('ampul', 'cinsi', 'delik-capi', 'dimmable', 'dis-cap', 'dis-olcu', 'ic-olcu', 'kasa-olcusu', 'olcu');

  -- Add note explaining deactivation
  UPDATE product_attributes
  SET name = name || ' (No values)'
  WHERE is_active = false AND name NOT LIKE '%(%)%';

  RAISE NOTICE 'Duplicate attributes merged successfully';
END $$;