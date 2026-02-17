/*
  # Unify Attributes and Filters System - Complete
  
  ## Overview
  Combines the separate product_filter_* and product_attributes systems
  into a single unified product_attributes system.

  ## What This Does
  
  ### 1. Enhances product_attributes Table
     - Adds icon, visible, show_in_sidebar, filter_category, input_type fields
     
  ### 2. Migrates Filter Data
     - Moves filter groups to attributes
     - Moves filter options to attribute values
     - Merges duplicates (Renk, Kullanım Alanı, Montaj Tipi)
     - Adds new attributes (Çerçeve Sayısı, Sertifikalar)
     
  ### 3. Migrates Assignments
     - Copies product_filter_values to product_attribute_assignments
     
  ### 4. Safety
     - Keeps old tables (marked as deprecated)
     - All data preserved for rollback
*/

-- ============================================================================
-- STEP 1: Enhance product_attributes schema
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_attributes' AND column_name = 'icon') THEN
    ALTER TABLE product_attributes ADD COLUMN icon text DEFAULT 'Tag';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_attributes' AND column_name = 'visible') THEN
    ALTER TABLE product_attributes ADD COLUMN visible boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_attributes' AND column_name = 'show_in_sidebar') THEN
    ALTER TABLE product_attributes ADD COLUMN show_in_sidebar boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_attributes' AND column_name = 'filter_category') THEN
    ALTER TABLE product_attributes ADD COLUMN filter_category varchar(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_attributes' AND column_name = 'input_type') THEN
    ALTER TABLE product_attributes ADD COLUMN input_type varchar(50) DEFAULT 'text';
  END IF;
END $$;

UPDATE product_attributes 
SET input_type = type 
WHERE input_type = 'text' OR input_type IS NULL;

-- ============================================================================
-- STEP 2: Update Renk (Color) attribute
-- ============================================================================

DO $$
DECLARE
  v_color_attr_id uuid;
  v_filter_grp_id uuid;
BEGIN
  SELECT id INTO v_color_attr_id FROM product_attributes WHERE slug = 'renk';
  SELECT id INTO v_filter_grp_id FROM product_filter_groups WHERE slug = 'renk';

  IF v_color_attr_id IS NOT NULL THEN
    UPDATE product_attributes
    SET 
      icon = 'Palette',
      visible = true,
      show_in_sidebar = true,
      filter_category = 'specification',
      input_type = 'multiselect',
      type = 'select',
      updated_at = now()
    WHERE id = v_color_attr_id;

    IF v_filter_grp_id IS NOT NULL THEN
      INSERT INTO product_attribute_values (attribute_id, value, display_value, sort_order, is_active, created_at)
      SELECT 
        v_color_attr_id,
        pfo.name,
        pfo.name,
        pfo."order",
        pfo.visible,
        pfo.created_at
      FROM product_filter_options pfo
      WHERE pfo.filter_group_id = v_filter_grp_id
      ON CONFLICT (attribute_id, value) DO UPDATE
      SET display_value = EXCLUDED.display_value,
          sort_order = EXCLUDED.sort_order,
          is_active = EXCLUDED.is_active;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Update Kullanım Alanı (Usage Area) attribute
-- ============================================================================

DO $$
DECLARE
  v_usage_attr_id uuid;
  v_filter_grp_id uuid;
BEGIN
  SELECT id INTO v_usage_attr_id FROM product_attributes WHERE slug = 'usage_area';
  SELECT id INTO v_filter_grp_id FROM product_filter_groups WHERE slug = 'usage-areas';

  IF v_usage_attr_id IS NOT NULL THEN
    UPDATE product_attributes
    SET 
      icon = 'MapPin',
      visible = true,
      show_in_sidebar = true,
      filter_category = 'feature',
      input_type = 'multiselect',
      type = 'multiselect',
      updated_at = now()
    WHERE id = v_usage_attr_id;

    IF v_filter_grp_id IS NOT NULL THEN
      INSERT INTO product_attribute_values (attribute_id, value, display_value, sort_order, is_active, created_at)
      SELECT 
        v_usage_attr_id,
        pfo.name,
        pfo.name,
        pfo."order",
        pfo.visible,
        pfo.created_at
      FROM product_filter_options pfo
      WHERE pfo.filter_group_id = v_filter_grp_id
      ON CONFLICT (attribute_id, value) DO UPDATE
      SET display_value = EXCLUDED.display_value,
          sort_order = EXCLUDED.sort_order,
          is_active = EXCLUDED.is_active;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Update Montaj Türü (Mounting Type) attribute
-- ============================================================================

DO $$
DECLARE
  v_mounting_attr_id uuid;
  v_filter_grp_id uuid;
BEGIN
  SELECT id INTO v_mounting_attr_id FROM product_attributes WHERE slug = 'mounting_type';
  SELECT id INTO v_filter_grp_id FROM product_filter_groups WHERE slug = 'installation-type';

  IF v_mounting_attr_id IS NOT NULL THEN
    UPDATE product_attributes
    SET 
      icon = 'Wrench',
      visible = true,
      show_in_sidebar = true,
      filter_category = 'specification',
      input_type = 'select',
      type = 'select',
      updated_at = now()
    WHERE id = v_mounting_attr_id;

    IF v_filter_grp_id IS NOT NULL THEN
      INSERT INTO product_attribute_values (attribute_id, value, display_value, sort_order, is_active, created_at)
      SELECT 
        v_mounting_attr_id,
        pfo.name,
        pfo.name,
        pfo."order",
        pfo.visible,
        pfo.created_at
      FROM product_filter_options pfo
      WHERE pfo.filter_group_id = v_filter_grp_id
      ON CONFLICT (attribute_id, value) DO UPDATE
      SET display_value = EXCLUDED.display_value,
          sort_order = EXCLUDED.sort_order,
          is_active = EXCLUDED.is_active;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Add Çerçeve Sayısı (Frame Count) attribute
-- ============================================================================

DO $$
DECLARE
  v_new_attr_id uuid;
  v_filter_grp_id uuid;
BEGIN
  SELECT id INTO v_filter_grp_id FROM product_filter_groups WHERE slug = 'lümen';

  INSERT INTO product_attributes (
    name, slug, type, is_filterable, is_required, scope, 
    icon, visible, show_in_sidebar, filter_category, input_type, 
    sort_order, is_active
  )
  VALUES (
    'Çerçeve Sayısı', 'frame_count', 'select', true, false, 'variant',
    'Square', true, true, 'specification', 'multiselect', 100, true
  )
  ON CONFLICT (slug) DO UPDATE
  SET icon = 'Square', visible = true, show_in_sidebar = true,
      filter_category = 'specification', input_type = 'multiselect'
  RETURNING id INTO v_new_attr_id;

  IF v_new_attr_id IS NULL THEN
    SELECT id INTO v_new_attr_id FROM product_attributes WHERE slug = 'frame_count';
  END IF;

  IF v_filter_grp_id IS NOT NULL AND v_new_attr_id IS NOT NULL THEN
    INSERT INTO product_attribute_values (attribute_id, value, display_value, sort_order, is_active, created_at)
    SELECT v_new_attr_id, pfo.name, pfo.name, pfo."order", pfo.visible, pfo.created_at
    FROM product_filter_options pfo
    WHERE pfo.filter_group_id = v_filter_grp_id
    ON CONFLICT (attribute_id, value) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Add Sertifikalar (Certifications) attribute
-- ============================================================================

DO $$
DECLARE
  v_new_attr_id uuid;
  v_filter_grp_id uuid;
BEGIN
  SELECT id INTO v_filter_grp_id FROM product_filter_groups WHERE slug = 'certifications';

  INSERT INTO product_attributes (
    name, slug, type, is_filterable, is_required, scope,
    icon, visible, show_in_sidebar, filter_category, input_type,
    sort_order, is_active
  )
  VALUES (
    'Sertifikalar', 'certifications', 'multiselect', true, false, 'product',
    'Award', true, true, 'feature', 'multiselect', 110, true
  )
  ON CONFLICT (slug) DO UPDATE
  SET icon = 'Award', visible = true, show_in_sidebar = true,
      filter_category = 'feature', input_type = 'multiselect'
  RETURNING id INTO v_new_attr_id;

  IF v_new_attr_id IS NULL THEN
    SELECT id INTO v_new_attr_id FROM product_attributes WHERE slug = 'certifications';
  END IF;

  IF v_filter_grp_id IS NOT NULL AND v_new_attr_id IS NOT NULL THEN
    INSERT INTO product_attribute_values (attribute_id, value, display_value, sort_order, is_active, created_at)
    SELECT v_new_attr_id, pfo.name, pfo.name, pfo."order", pfo.visible, pfo.created_at
    FROM product_filter_options pfo
    WHERE pfo.filter_group_id = v_filter_grp_id
    ON CONFLICT (attribute_id, value) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Set defaults for all existing attributes
-- ============================================================================

UPDATE product_attributes
SET 
  icon = COALESCE(icon, 'Tag'),
  visible = COALESCE(visible, true),
  show_in_sidebar = COALESCE(show_in_sidebar, is_filterable),
  filter_category = COALESCE(filter_category, 
    CASE 
      WHEN slug IN ('usage_area', 'features', 'certifications') THEN 'feature'
      ELSE 'specification'
    END
  ),
  input_type = COALESCE(input_type, type),
  updated_at = now()
WHERE icon IS NULL OR visible IS NULL OR show_in_sidebar IS NULL OR filter_category IS NULL;

-- ============================================================================
-- STEP 8: Migrate product_filter_values to product_attribute_assignments
-- ============================================================================

CREATE TEMP TABLE temp_filter_mapping AS
SELECT 
  pfo.id as filter_option_id,
  pav.id as attribute_value_id,
  pav.attribute_id
FROM product_filter_options pfo
JOIN product_filter_groups pfg ON pfg.id = pfo.filter_group_id
JOIN product_attributes pa ON (
  (pfg.slug = 'renk' AND pa.slug = 'renk') OR
  (pfg.slug = 'usage-areas' AND pa.slug = 'usage_area') OR
  (pfg.slug = 'installation-type' AND pa.slug = 'mounting_type') OR
  (pfg.slug = 'lümen' AND pa.slug = 'frame_count') OR
  (pfg.slug = 'certifications' AND pa.slug = 'certifications')
)
JOIN product_attribute_values pav ON pav.attribute_id = pa.id AND pav.value = pfo.name;

INSERT INTO product_attribute_assignments (product_id, attribute_id, attribute_value_id, created_at)
SELECT DISTINCT
  pfv.product_id,
  tfm.attribute_id,
  tfm.attribute_value_id,
  pfv.created_at
FROM product_filter_values pfv
JOIN temp_filter_mapping tfm ON tfm.filter_option_id = pfv.filter_option_id
ON CONFLICT (product_id, attribute_id, attribute_value_id) DO NOTHING;

DROP TABLE temp_filter_mapping;

-- ============================================================================
-- STEP 9: Mark old tables as deprecated
-- ============================================================================

COMMENT ON TABLE product_filter_groups IS 'DEPRECATED: Replaced by product_attributes (2024-12-24)';
COMMENT ON TABLE product_filter_options IS 'DEPRECATED: Replaced by product_attributes (2024-12-24)';
COMMENT ON TABLE product_filter_values IS 'DEPRECATED: Replaced by product_attribute_assignments (2024-12-24)';
COMMENT ON TABLE product_filter_translations IS 'DEPRECATED: Use unified_translations (2024-12-24)';

-- ============================================================================
-- STEP 10: Create unified filter view
-- ============================================================================

CREATE OR REPLACE VIEW v_filter_attributes AS
SELECT 
  pa.id, pa.name, pa.slug, pa.type as data_type, pa.input_type,
  pa.icon, pa.visible, pa.show_in_sidebar, pa.filter_category,
  pa.is_filterable, pa.scope, pa.sort_order, pa.options, pa.is_active,
  COUNT(pav.id) as value_count
FROM product_attributes pa
LEFT JOIN product_attribute_values pav ON pav.attribute_id = pa.id AND pav.is_active = true
WHERE pa.is_filterable = true AND pa.is_active = true AND pa.visible = true
GROUP BY pa.id
ORDER BY 
  CASE pa.filter_category WHEN 'specification' THEN 1 WHEN 'feature' THEN 2 ELSE 3 END,
  pa.sort_order, pa.name;

COMMENT ON VIEW v_filter_attributes IS 'Unified view of all filterable attributes';
