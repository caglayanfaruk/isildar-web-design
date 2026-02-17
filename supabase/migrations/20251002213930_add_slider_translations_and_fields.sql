/*
  # Add Slider Translations and Enhanced Fields

  1. New Fields for slider_items
    - `title_tr` (text) - Turkish title for the slide
    - `title_en` (text) - English title for the slide
    - `subtitle_tr` (text) - Turkish subtitle/description
    - `subtitle_en` (text) - English subtitle/description
    - `accent_tr` (text) - Turkish accent/badge text
    - `accent_en` (text) - English accent/badge text
    - `button_text_tr` (text) - Turkish button text
    - `button_text_en` (text) - English button text
    - `button_link` (text) - Button link URL

  2. Security
    - Enable RLS on slider_items (if not already enabled)
    - Add policies for public read access
    - Add policies for authenticated admin write access
*/

-- Add translation and content fields to slider_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slider_items' AND column_name = 'title_tr'
  ) THEN
    ALTER TABLE slider_items ADD COLUMN title_tr text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slider_items' AND column_name = 'title_en'
  ) THEN
    ALTER TABLE slider_items ADD COLUMN title_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slider_items' AND column_name = 'subtitle_tr'
  ) THEN
    ALTER TABLE slider_items ADD COLUMN subtitle_tr text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slider_items' AND column_name = 'subtitle_en'
  ) THEN
    ALTER TABLE slider_items ADD COLUMN subtitle_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slider_items' AND column_name = 'accent_tr'
  ) THEN
    ALTER TABLE slider_items ADD COLUMN accent_tr text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slider_items' AND column_name = 'accent_en'
  ) THEN
    ALTER TABLE slider_items ADD COLUMN accent_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slider_items' AND column_name = 'button_text_tr'
  ) THEN
    ALTER TABLE slider_items ADD COLUMN button_text_tr text DEFAULT 'Ürünleri Keşfet';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slider_items' AND column_name = 'button_text_en'
  ) THEN
    ALTER TABLE slider_items ADD COLUMN button_text_en text DEFAULT 'Explore Products';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slider_items' AND column_name = 'button_link'
  ) THEN
    ALTER TABLE slider_items ADD COLUMN button_link text;
  END IF;
END $$;

-- Enable RLS on slider_items
ALTER TABLE slider_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on sliders
ALTER TABLE sliders ENABLE ROW LEVEL SECURITY;

-- Public read access for active sliders
DROP POLICY IF EXISTS "Anyone can view active sliders" ON sliders;
CREATE POLICY "Anyone can view active sliders"
  ON sliders FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Public read access for active slider items
DROP POLICY IF EXISTS "Anyone can view active slider items" ON slider_items;
CREATE POLICY "Anyone can view active slider items"
  ON slider_items FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admin policies for sliders
DROP POLICY IF EXISTS "Authenticated users can view all sliders" ON sliders;
CREATE POLICY "Authenticated users can view all sliders"
  ON sliders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert sliders" ON sliders;
CREATE POLICY "Authenticated users can insert sliders"
  ON sliders FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update sliders" ON sliders;
CREATE POLICY "Authenticated users can update sliders"
  ON sliders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete sliders" ON sliders;
CREATE POLICY "Authenticated users can delete sliders"
  ON sliders FOR DELETE
  TO authenticated
  USING (true);

-- Admin policies for slider_items
DROP POLICY IF EXISTS "Authenticated users can view all slider items" ON slider_items;
CREATE POLICY "Authenticated users can view all slider items"
  ON slider_items FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert slider items" ON slider_items;
CREATE POLICY "Authenticated users can insert slider items"
  ON slider_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update slider items" ON slider_items;
CREATE POLICY "Authenticated users can update slider items"
  ON slider_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete slider items" ON slider_items;
CREATE POLICY "Authenticated users can delete slider items"
  ON slider_items FOR DELETE
  TO authenticated
  USING (true);
