/*
  # Popup Announcements System

  1. New Tables
    - `popup_announcements`
      - `id` (uuid, primary key)
      - `title` (text) - Başlık
      - `content` (text) - İçerik metni
      - `image_url` (text) - Görsel URL (opsiyonel)
      - `link_url` (text) - Tıklayınca gidilecek link
      - `link_text` (text) - Link butonu metni
      - `desktop_width` (integer) - Desktop genişlik (px)
      - `desktop_height` (integer) - Desktop yükseklik (px)
      - `tablet_width` (integer) - Tablet genişlik (px)
      - `tablet_height` (integer) - Tablet yükseklik (px)
      - `mobile_width` (integer) - Mobil genişlik (%)
      - `mobile_height` (integer) - Mobil yükseklik (px)
      - `cookie_duration_days` (integer) - Cookie süresi (gün)
      - `is_active` (boolean) - Aktif/Pasif
      - `start_date` (timestamptz) - Başlangıç tarihi
      - `end_date` (timestamptz) - Bitiş tarihi
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `popup_announcements` table
    - Add policies for public read (only active popups)
    - Add policies for admin full access
*/

-- Create popup_announcements table
CREATE TABLE IF NOT EXISTS popup_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text DEFAULT '',
  image_url text,
  link_url text,
  link_text text DEFAULT 'Detaylı Bilgi',
  desktop_width integer DEFAULT 600,
  desktop_height integer DEFAULT 400,
  tablet_width integer DEFAULT 500,
  tablet_height integer DEFAULT 350,
  mobile_width integer DEFAULT 90,
  mobile_height integer DEFAULT 300,
  cookie_duration_days integer DEFAULT 7,
  is_active boolean DEFAULT false,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE popup_announcements ENABLE ROW LEVEL SECURITY;

-- Public can view only active popups within date range
CREATE POLICY "Public can view active popups"
  ON popup_announcements
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

-- Authenticated users can view all popups
CREATE POLICY "Authenticated users can view all popups"
  ON popup_announcements
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert popups
CREATE POLICY "Authenticated users can insert popups"
  ON popup_announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update popups
CREATE POLICY "Authenticated users can update popups"
  ON popup_announcements
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete popups
CREATE POLICY "Authenticated users can delete popups"
  ON popup_announcements
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for active popups query
CREATE INDEX IF NOT EXISTS idx_popup_announcements_active 
  ON popup_announcements(is_active, start_date, end_date) 
  WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_popup_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_popup_announcements_updated_at
  BEFORE UPDATE ON popup_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_popup_announcements_updated_at();