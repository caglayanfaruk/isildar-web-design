/*
  # Migrate Existing Translations to Unified System

  1. Purpose
    - Migrate all existing category_translations to unified translations table
    - Migrate all existing product_translations to unified translations table
    - Migrate all existing slider translations to unified translations table
    - Set proper source_text, translation_type, and auto_translated flags
    - Preserve all existing data

  2. Migration Steps
    - Categories: Migrate name and description translations
    - Products: Migrate name, short_description, and long_description
    - Sliders: Migrate title, subtitle, and button_text
    - Mark Turkish (tr) as source (auto_translated = false)
    - Mark other languages as auto_translated = true

  3. Important Notes
    - This is a one-time migration
    - Does NOT delete old tables (for safety)
    - Can be re-run safely (uses UPSERT)
*/

-- ============================================================================
-- 1. MIGRATE CATEGORY TRANSLATIONS
-- ============================================================================

-- Migrate category name translations
INSERT INTO translations (
  language_code,
  translation_key,
  translation_value,
  source_text,
  translation_type,
  auto_translated,
  context,
  last_updated
)
SELECT 
  ct.language_code,
  'category.' || c.slug || '.name' as translation_key,
  ct.name as translation_value,
  COALESCE(
    (SELECT name FROM category_translations WHERE category_id = c.id AND language_code = 'tr' LIMIT 1),
    ct.name
  ) as source_text,
  'category' as translation_type,
  CASE WHEN ct.language_code = 'tr' THEN false ELSE true END as auto_translated,
  'category' as context,
  now() as last_updated
FROM category_translations ct
JOIN categories c ON ct.category_id = c.id
WHERE ct.name IS NOT NULL AND ct.name != ''
ON CONFLICT (language_code, translation_key) 
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  source_text = EXCLUDED.source_text,
  last_updated = now();

-- Migrate category description translations
INSERT INTO translations (
  language_code,
  translation_key,
  translation_value,
  source_text,
  translation_type,
  auto_translated,
  context,
  last_updated
)
SELECT 
  ct.language_code,
  'category.' || c.slug || '.description' as translation_key,
  ct.description as translation_value,
  COALESCE(
    (SELECT description FROM category_translations WHERE category_id = c.id AND language_code = 'tr' LIMIT 1),
    ct.description
  ) as source_text,
  'category' as translation_type,
  CASE WHEN ct.language_code = 'tr' THEN false ELSE true END as auto_translated,
  'category' as context,
  now() as last_updated
FROM category_translations ct
JOIN categories c ON ct.category_id = c.id
WHERE ct.description IS NOT NULL AND ct.description != ''
ON CONFLICT (language_code, translation_key) 
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  source_text = EXCLUDED.source_text,
  last_updated = now();

-- ============================================================================
-- 2. MIGRATE PRODUCT TRANSLATIONS
-- ============================================================================

-- Migrate product name translations
INSERT INTO translations (
  language_code,
  translation_key,
  translation_value,
  source_text,
  translation_type,
  auto_translated,
  context,
  last_updated
)
SELECT 
  pt.language_code,
  'product.' || pt.product_id || '.name' as translation_key,
  pt.name as translation_value,
  COALESCE(
    (SELECT name FROM product_translations WHERE product_id = pt.product_id AND language_code = 'tr' LIMIT 1),
    pt.name
  ) as source_text,
  'product' as translation_type,
  CASE WHEN pt.language_code = 'tr' THEN false ELSE true END as auto_translated,
  'product' as context,
  now() as last_updated
FROM product_translations pt
WHERE pt.name IS NOT NULL AND pt.name != ''
ON CONFLICT (language_code, translation_key) 
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  source_text = EXCLUDED.source_text,
  last_updated = now();

-- Migrate product short_description translations
INSERT INTO translations (
  language_code,
  translation_key,
  translation_value,
  source_text,
  translation_type,
  auto_translated,
  context,
  last_updated
)
SELECT 
  pt.language_code,
  'product.' || pt.product_id || '.short_desc' as translation_key,
  pt.short_description as translation_value,
  COALESCE(
    (SELECT short_description FROM product_translations WHERE product_id = pt.product_id AND language_code = 'tr' LIMIT 1),
    pt.short_description
  ) as source_text,
  'product' as translation_type,
  CASE WHEN pt.language_code = 'tr' THEN false ELSE true END as auto_translated,
  'product' as context,
  now() as last_updated
FROM product_translations pt
WHERE pt.short_description IS NOT NULL AND pt.short_description != ''
ON CONFLICT (language_code, translation_key) 
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  source_text = EXCLUDED.source_text,
  last_updated = now();

-- Migrate product long_description translations
INSERT INTO translations (
  language_code,
  translation_key,
  translation_value,
  source_text,
  translation_type,
  auto_translated,
  context,
  last_updated
)
SELECT 
  pt.language_code,
  'product.' || pt.product_id || '.long_desc' as translation_key,
  pt.long_description as translation_value,
  COALESCE(
    (SELECT long_description FROM product_translations WHERE product_id = pt.product_id AND language_code = 'tr' LIMIT 1),
    pt.long_description
  ) as source_text,
  'product' as translation_type,
  CASE WHEN pt.language_code = 'tr' THEN false ELSE true END as auto_translated,
  'product' as context,
  now() as last_updated
FROM product_translations pt
WHERE pt.long_description IS NOT NULL AND pt.long_description != ''
ON CONFLICT (language_code, translation_key) 
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  source_text = EXCLUDED.source_text,
  last_updated = now();

-- ============================================================================
-- 3. MIGRATE SLIDER TRANSLATIONS
-- ============================================================================

-- Check if sliders have title_tr, title_en columns (old structure)
-- If they exist, migrate them
DO $$ 
BEGIN
  -- Migrate slider title translations if title_tr column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sliders' AND column_name = 'title_tr'
  ) THEN
    -- Insert Turkish titles
    INSERT INTO translations (
      language_code,
      translation_key,
      translation_value,
      source_text,
      translation_type,
      auto_translated,
      context,
      last_updated
    )
    SELECT 
      'tr' as language_code,
      'slider.' || s.id || '.title' as translation_key,
      s.title_tr as translation_value,
      s.title_tr as source_text,
      'slider' as translation_type,
      false as auto_translated,
      'slider' as context,
      now() as last_updated
    FROM sliders s
    WHERE s.title_tr IS NOT NULL AND s.title_tr != ''
    ON CONFLICT (language_code, translation_key) 
    DO UPDATE SET
      translation_value = EXCLUDED.translation_value,
      source_text = EXCLUDED.source_text,
      last_updated = now();

    -- Insert English titles
    INSERT INTO translations (
      language_code,
      translation_key,
      translation_value,
      source_text,
      translation_type,
      auto_translated,
      context,
      last_updated
    )
    SELECT 
      'en' as language_code,
      'slider.' || s.id || '.title' as translation_key,
      s.title_en as translation_value,
      s.title_tr as source_text,
      'slider' as translation_type,
      true as auto_translated,
      'slider' as context,
      now() as last_updated
    FROM sliders s
    WHERE s.title_en IS NOT NULL AND s.title_en != ''
    ON CONFLICT (language_code, translation_key) 
    DO UPDATE SET
      translation_value = EXCLUDED.translation_value,
      last_updated = now();
  END IF;

  -- Migrate subtitle translations if subtitle_tr column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sliders' AND column_name = 'subtitle_tr'
  ) THEN
    -- Turkish subtitles
    INSERT INTO translations (
      language_code,
      translation_key,
      translation_value,
      source_text,
      translation_type,
      auto_translated,
      context,
      last_updated
    )
    SELECT 
      'tr' as language_code,
      'slider.' || s.id || '.subtitle' as translation_key,
      s.subtitle_tr as translation_value,
      s.subtitle_tr as source_text,
      'slider' as translation_type,
      false as auto_translated,
      'slider' as context,
      now() as last_updated
    FROM sliders s
    WHERE s.subtitle_tr IS NOT NULL AND s.subtitle_tr != ''
    ON CONFLICT (language_code, translation_key) 
    DO UPDATE SET
      translation_value = EXCLUDED.translation_value,
      source_text = EXCLUDED.source_text,
      last_updated = now();

    -- English subtitles
    INSERT INTO translations (
      language_code,
      translation_key,
      translation_value,
      source_text,
      translation_type,
      auto_translated,
      context,
      last_updated
    )
    SELECT 
      'en' as language_code,
      'slider.' || s.id || '.subtitle' as translation_key,
      s.subtitle_en as translation_value,
      s.subtitle_tr as source_text,
      'slider' as translation_type,
      true as auto_translated,
      'slider' as context,
      now() as last_updated
    FROM sliders s
    WHERE s.subtitle_en IS NOT NULL AND s.subtitle_en != ''
    ON CONFLICT (language_code, translation_key) 
    DO UPDATE SET
      translation_value = EXCLUDED.translation_value,
      last_updated = now();
  END IF;

  -- Migrate button_text translations if button_text_tr column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sliders' AND column_name = 'button_text_tr'
  ) THEN
    -- Turkish button text
    INSERT INTO translations (
      language_code,
      translation_key,
      translation_value,
      source_text,
      translation_type,
      auto_translated,
      context,
      last_updated
    )
    SELECT 
      'tr' as language_code,
      'slider.' || s.id || '.button_text' as translation_key,
      s.button_text_tr as translation_value,
      s.button_text_tr as source_text,
      'slider' as translation_type,
      false as auto_translated,
      'slider' as context,
      now() as last_updated
    FROM sliders s
    WHERE s.button_text_tr IS NOT NULL AND s.button_text_tr != ''
    ON CONFLICT (language_code, translation_key) 
    DO UPDATE SET
      translation_value = EXCLUDED.translation_value,
      source_text = EXCLUDED.source_text,
      last_updated = now();

    -- English button text
    INSERT INTO translations (
      language_code,
      translation_key,
      translation_value,
      source_text,
      translation_type,
      auto_translated,
      context,
      last_updated
    )
    SELECT 
      'en' as language_code,
      'slider.' || s.id || '.button_text' as translation_key,
      s.button_text_en as translation_value,
      s.button_text_tr as source_text,
      'slider' as translation_type,
      true as auto_translated,
      'slider' as context,
      now() as last_updated
    FROM sliders s
    WHERE s.button_text_en IS NOT NULL AND s.button_text_en != ''
    ON CONFLICT (language_code, translation_key) 
    DO UPDATE SET
      translation_value = EXCLUDED.translation_value,
      last_updated = now();
  END IF;
END $$;

-- ============================================================================
-- 4. VERIFICATION AND SUMMARY
-- ============================================================================

-- Create a summary view (optional, for verification)
CREATE OR REPLACE VIEW translation_migration_summary AS
SELECT 
  translation_type,
  language_code,
  COUNT(*) as translation_count,
  SUM(CASE WHEN auto_translated THEN 1 ELSE 0 END) as auto_translated_count,
  SUM(CASE WHEN NOT auto_translated THEN 1 ELSE 0 END) as manual_count
FROM translations
WHERE translation_type IN ('category', 'product', 'slider')
GROUP BY translation_type, language_code
ORDER BY translation_type, language_code;
