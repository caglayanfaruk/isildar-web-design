/*
  # Unified Translation System

  1. Changes
    - Add source_text column to translations table for storing original Turkish text
    - Add translation_type column to categorize translation sources
    - Add auto_translated flag to track which translations were auto-generated
    - Add last_updated timestamp for cache management
    - Add indexes for better performance
    - Keep existing translation tables for backward compatibility but will phase out

  2. New Columns
    - source_text: Original Turkish text (for re-translation if needed)
    - translation_type: 'static', 'category', 'product', 'filter', etc.
    - auto_translated: boolean flag
    - last_updated: timestamp for cache invalidation
    
  3. Purpose
    - Single source of truth for all translations
    - Efficient Google Translate API usage (only for missing translations)
    - Better caching and performance
*/

-- Add new columns to translations table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'translations' AND column_name = 'source_text'
  ) THEN
    ALTER TABLE translations ADD COLUMN source_text text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'translations' AND column_name = 'translation_type'
  ) THEN
    ALTER TABLE translations ADD COLUMN translation_type text DEFAULT 'static';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'translations' AND column_name = 'auto_translated'
  ) THEN
    ALTER TABLE translations ADD COLUMN auto_translated boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'translations' AND column_name = 'last_updated'
  ) THEN
    ALTER TABLE translations ADD COLUMN last_updated timestamptz DEFAULT now();
  END IF;
END $$;

-- Update existing translations to set source_text for Turkish entries
UPDATE translations 
SET source_text = translation_value 
WHERE language_code = 'tr' AND source_text IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_translations_type_lang 
ON translations(translation_type, language_code);

CREATE INDEX IF NOT EXISTS idx_translations_key_lang 
ON translations(translation_key, language_code);

-- Create a function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_translation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS set_translation_timestamp ON translations;
CREATE TRIGGER set_translation_timestamp
  BEFORE UPDATE ON translations
  FOR EACH ROW
  EXECUTE FUNCTION update_translation_timestamp();
