/*
  # Add always_show field to popup_announcements

  1. Changes
    - Add `always_show` boolean field to `popup_announcements` table
    - When true, popup will be shown on every visit regardless of cookie settings
    - Useful for legal notices, important updates, and mandatory announcements
  
  2. Notes
    - Default value is false to maintain current behavior
    - Existing popups will continue to work with cookie-based display
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'popup_announcements' 
    AND column_name = 'always_show'
  ) THEN
    ALTER TABLE popup_announcements 
    ADD COLUMN always_show boolean DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN popup_announcements.always_show IS 'When true, popup will be shown on every visit regardless of cookie settings';