/*
  # Add Attribute Translations Support

  1. Changes
    - Migrate existing attribute names to the unified translation system
    - Create translation keys in format: `attribute.{attribute_id}.name`
    - Support automatic translation for all supported languages

  2. Security
    - No RLS changes needed (translations table already has proper policies)
    - Public can read attribute translations
    - Only authenticated users can modify
*/

-- Migrate existing attribute names to translation system
-- This will create translation entries for all existing attributes
DO $$
DECLARE
  attr RECORD;
  supported_langs text[] := ARRAY['tr', 'en', 'de', 'fr', 'es', 'it', 'ru', 'ar'];
  lang text;
BEGIN
  FOR attr IN SELECT id, name, slug FROM product_attributes WHERE name IS NOT NULL AND name != ''
  LOOP
    -- Create Turkish translation (original)
    INSERT INTO translations (translation_key, language_code, translation_value, context, created_at, updated_at)
    VALUES (
      'attribute.' || attr.id::text || '.name',
      'tr',
      attr.name,
      'attribute',
      now(),
      now()
    )
    ON CONFLICT (translation_key, language_code)
    DO UPDATE SET
      translation_value = EXCLUDED.translation_value,
      updated_at = now();

    -- Create placeholder entries for other languages (to be auto-translated)
    FOREACH lang IN ARRAY supported_langs
    LOOP
      IF lang != 'tr' THEN
        INSERT INTO translations (translation_key, language_code, translation_value, context, auto_translated, created_at, updated_at)
        VALUES (
          'attribute.' || attr.id::text || '.name',
          lang,
          attr.name, -- Will be auto-translated later
          'attribute',
          false,
          now(),
          now()
        )
        ON CONFLICT (translation_key, language_code)
        DO NOTHING; -- Keep existing translations if any
      END IF;
    END LOOP;
  END LOOP;
END $$;
