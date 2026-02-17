/*
  # Configure Google Translate Languages

  1. Changes
    - Update languages table to keep only supported languages: Turkish, English, Russian, French, Arabic
    - Set Turkish as the default language
    - Ensure all languages are active
    - Update sort order for logical display

  2. Notes
    - This migration ensures only Google Translate API supported languages are active
    - Turkish is set as source language (default)
    - Other languages: English (en), Russian (ru), French (fr), Arabic (ar)
*/

-- First, deactivate all languages
UPDATE languages SET is_active = false;

-- Update or insert Turkish (default language)
INSERT INTO languages (code, name, native_name, flag, is_default, is_active, sort_order)
VALUES ('tr', 'Turkish', 'Türkçe', '🇹🇷', true, true, 1)
ON CONFLICT (code) 
DO UPDATE SET 
  name = 'Turkish',
  native_name = 'Türkçe',
  flag = '🇹🇷',
  is_default = true,
  is_active = true,
  sort_order = 1;

-- Update or insert English
INSERT INTO languages (code, name, native_name, flag, is_default, is_active, sort_order)
VALUES ('en', 'English', 'English', '🇬🇧', false, true, 2)
ON CONFLICT (code) 
DO UPDATE SET 
  name = 'English',
  native_name = 'English',
  flag = '🇬🇧',
  is_default = false,
  is_active = true,
  sort_order = 2;

-- Update or insert Russian
INSERT INTO languages (code, name, native_name, flag, is_default, is_active, sort_order)
VALUES ('ru', 'Russian', 'Русский', '🇷🇺', false, true, 3)
ON CONFLICT (code) 
DO UPDATE SET 
  name = 'Russian',
  native_name = 'Русский',
  flag = '🇷🇺',
  is_default = false,
  is_active = true,
  sort_order = 3;

-- Update or insert French
INSERT INTO languages (code, name, native_name, flag, is_default, is_active, sort_order)
VALUES ('fr', 'French', 'Français', '🇫🇷', false, true, 4)
ON CONFLICT (code) 
DO UPDATE SET 
  name = 'French',
  native_name = 'Français',
  flag = '🇫🇷',
  is_default = false,
  is_active = true,
  sort_order = 4;

-- Update or insert Arabic
INSERT INTO languages (code, name, native_name, flag, is_default, is_active, sort_order)
VALUES ('ar', 'Arabic', 'العربية', '🇸🇦', false, true, 5)
ON CONFLICT (code) 
DO UPDATE SET 
  name = 'Arabic',
  native_name = 'العربية',
  flag = '🇸🇦',
  is_default = false,
  is_active = true,
  sort_order = 5;
