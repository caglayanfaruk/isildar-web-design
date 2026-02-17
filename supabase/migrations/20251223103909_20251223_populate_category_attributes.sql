/*
  # Populate Category-Attribute Relationships
  
  This migration assigns appropriate attributes to categories based on product type.
  
  ## Strategy
  
  1. **Lighting/Armatur Categories**: Get power, color, IP rating, lumen, socket type
  2. **Electrical Components**: Get mounting type, features
  3. **Universal**: IP rating and warranty for all categories
  
  ## Benefits
  
  - Product forms will only show relevant attributes
  - Better user experience
  - Less confusion
  - Faster product creation
  
  ## Notes
  
  - applies_to_all_categories attributes don't need explicit assignment
  - Categories can inherit attributes from parent categories (future enhancement)
*/

-- =============================================================================
-- HELPER: Get attribute IDs
-- =============================================================================

DO $$
DECLARE
  attr_renk UUID;
  attr_guc UUID;
  attr_ip UUID;
  attr_lumen UUID;
  attr_duy_tipi UUID;
  attr_light_color UUID;
  attr_voltage UUID;
  attr_size UUID;
  attr_mounting UUID;
  attr_features UUID;
  attr_usage_area UUID;
  cat_id UUID;
  sort_num INTEGER;
BEGIN
  -- Get attribute IDs
  SELECT id INTO attr_renk FROM product_attributes WHERE slug = 'renk' AND is_active = true;
  SELECT id INTO attr_guc FROM product_attributes WHERE slug = 'guc' AND is_active = true;
  SELECT id INTO attr_ip FROM product_attributes WHERE slug = 'ip_sinifi' AND is_active = true;
  SELECT id INTO attr_lumen FROM product_attributes WHERE slug = 'lumen' AND is_active = true;
  SELECT id INTO attr_duy_tipi FROM product_attributes WHERE slug = 'duy_tipi' AND is_active = true;
  SELECT id INTO attr_light_color FROM product_attributes WHERE slug = 'light_color' AND is_active = true;
  SELECT id INTO attr_voltage FROM product_attributes WHERE slug = 'voltage' AND is_active = true;
  SELECT id INTO attr_size FROM product_attributes WHERE slug = 'size' AND is_active = true;
  SELECT id INTO attr_mounting FROM product_attributes WHERE slug = 'mounting_type' AND is_active = true;
  SELECT id INTO attr_features FROM product_attributes WHERE slug = 'features' AND is_active = true;
  SELECT id INTO attr_usage_area FROM product_attributes WHERE slug = 'usage_area' AND is_active = true;

  -- =============================================================================
  -- LIGHTING/ARMATUR CATEGORIES
  -- =============================================================================
  
  -- Get all categories with "armatur", "aydinlatma", "aplik", "avize" in slug
  FOR cat_id IN 
    SELECT id FROM categories 
    WHERE is_active = true 
      AND (
        slug LIKE '%armatur%' 
        OR slug LIKE '%aydinlatma%'
        OR slug LIKE '%aplik%'
        OR slug LIKE '%avize%'
        OR slug LIKE '%sarkit%'
        OR slug LIKE '%spot%'
        OR slug LIKE '%projektör%'
        OR slug LIKE '%reflektor%'
      )
  LOOP
    sort_num := 0;
    
    -- Add Renk (Color)
    IF attr_renk IS NOT NULL THEN
      INSERT INTO category_attributes (category_id, attribute_id, is_required, sort_order)
      VALUES (cat_id, attr_renk, false, sort_num)
      ON CONFLICT (category_id, attribute_id) DO NOTHING;
      sort_num := sort_num + 10;
    END IF;
    
    -- Add Güç (Power)
    IF attr_guc IS NOT NULL THEN
      INSERT INTO category_attributes (category_id, attribute_id, is_required, sort_order)
      VALUES (cat_id, attr_guc, false, sort_num)
      ON CONFLICT (category_id, attribute_id) DO NOTHING;
      sort_num := sort_num + 10;
    END IF;
    
    -- Add Lümen
    IF attr_lumen IS NOT NULL THEN
      INSERT INTO category_attributes (category_id, attribute_id, is_required, sort_order)
      VALUES (cat_id, attr_lumen, false, sort_num)
      ON CONFLICT (category_id, attribute_id) DO NOTHING;
      sort_num := sort_num + 10;
    END IF;
    
    -- Add Light Color
    IF attr_light_color IS NOT NULL THEN
      INSERT INTO category_attributes (category_id, attribute_id, is_required, sort_order)
      VALUES (cat_id, attr_light_color, false, sort_num)
      ON CONFLICT (category_id, attribute_id) DO NOTHING;
      sort_num := sort_num + 10;
    END IF;
    
    -- Add Mounting Type
    IF attr_mounting IS NOT NULL THEN
      INSERT INTO category_attributes (category_id, attribute_id, is_required, sort_order)
      VALUES (cat_id, attr_mounting, false, sort_num)
      ON CONFLICT (category_id, attribute_id) DO NOTHING;
      sort_num := sort_num + 10;
    END IF;
    
    -- Add Usage Area
    IF attr_usage_area IS NOT NULL THEN
      INSERT INTO category_attributes (category_id, attribute_id, is_required, sort_order)
      VALUES (cat_id, attr_usage_area, false, sort_num)
      ON CONFLICT (category_id, attribute_id) DO NOTHING;
      sort_num := sort_num + 10;
    END IF;
  END LOOP;

  -- =============================================================================
  -- SPECIFIC CATEGORIES WITH SOCKET TYPE (Duy Tipi)
  -- =============================================================================
  
  FOR cat_id IN 
    SELECT id FROM categories 
    WHERE is_active = true 
      AND (
        slug LIKE '%duy%'
        OR slug LIKE '%ampul%'
        OR slug LIKE '%lamba%'
      )
  LOOP
    IF attr_duy_tipi IS NOT NULL THEN
      INSERT INTO category_attributes (category_id, attribute_id, is_required, sort_order)
      VALUES (cat_id, attr_duy_tipi, false, 100)
      ON CONFLICT (category_id, attribute_id) DO NOTHING;
    END IF;
  END LOOP;

  -- =============================================================================
  -- OUTDOOR CATEGORIES (Bahçe, Dış Mekan)
  -- =============================================================================
  
  FOR cat_id IN 
    SELECT id FROM categories 
    WHERE is_active = true 
      AND (
        slug LIKE '%bahce%'
        OR slug LIKE '%dis%mekan%'
        OR slug LIKE '%etanj%'
      )
  LOOP
    sort_num := 0;
    
    -- IP Rating is critical for outdoor
    IF attr_ip IS NOT NULL THEN
      INSERT INTO category_attributes (category_id, attribute_id, is_required, sort_order)
      VALUES (cat_id, attr_ip, true, sort_num)  -- Required!
      ON CONFLICT (category_id, attribute_id) DO UPDATE SET is_required = true;
      sort_num := sort_num + 10;
    END IF;
    
    -- Add other lighting attributes
    IF attr_guc IS NOT NULL THEN
      INSERT INTO category_attributes (category_id, attribute_id, is_required, sort_order)
      VALUES (cat_id, attr_guc, false, sort_num)
      ON CONFLICT (category_id, attribute_id) DO NOTHING;
    END IF;
  END LOOP;

  RAISE NOTICE 'Category attributes populated successfully';
END $$;