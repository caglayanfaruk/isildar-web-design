/*
  # Create Homepage Video Section Table

  1. New Tables
    - `homepage_video_section`
      - `id` (uuid, primary key)
      - `video_url` (text) - YouTube/Vimeo URL or media storage path
      - `thumbnail_image_id` (uuid, nullable) - Reference to media table for thumbnail
      - `duration` (text) - Video duration display (e.g., "3:45")
      - `quality` (text) - Quality label (e.g., "4K Kalite")
      - `subtitle_info` (text) - Subtitle information (e.g., "Türkçe Altyazılı")
      - `is_active` (boolean) - Whether this video section is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `homepage_video_features`
      - `id` (uuid, primary key)
      - `icon` (text) - Lucide icon name (e.g., "Factory", "Lightbulb", "Globe")
      - `sort_order` (integer) - Display order
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Index on is_active for both tables
    - Index on sort_order for features

  3. Security
    - Enable RLS on both tables
    - Public can read active content
    - Authenticated users (admin) can manage

  4. Translation Keys Format
    - Video section: `homepage.video.badge`, `homepage.video.title`, `homepage.video.description`, `homepage.video.video_title`
    - Video features: `homepage.video.feature.{feature_id}.title`, `homepage.video.feature.{feature_id}.description`
*/

-- Create homepage_video_section table
CREATE TABLE IF NOT EXISTS homepage_video_section (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url text,
  thumbnail_image_id uuid REFERENCES media(id) ON DELETE SET NULL,
  duration text DEFAULT '0:00',
  quality text DEFAULT '4K',
  subtitle_info text DEFAULT 'Türkçe Altyazılı',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create homepage_video_features table
CREATE TABLE IF NOT EXISTS homepage_video_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL DEFAULT 'Star',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_homepage_video_section_is_active ON homepage_video_section(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_video_features_is_active ON homepage_video_features(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_video_features_sort_order ON homepage_video_features(sort_order);

-- Enable RLS
ALTER TABLE homepage_video_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_video_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homepage_video_section
CREATE POLICY "Public can view active video section"
  ON homepage_video_section
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all video sections"
  ON homepage_video_section
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert video section"
  ON homepage_video_section
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update video section"
  ON homepage_video_section
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete video section"
  ON homepage_video_section
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for homepage_video_features
CREATE POLICY "Public can view active video features"
  ON homepage_video_features
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all video features"
  ON homepage_video_features
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert video features"
  ON homepage_video_features
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update video features"
  ON homepage_video_features
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete video features"
  ON homepage_video_features
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default video section
INSERT INTO homepage_video_section (video_url, duration, quality, subtitle_info) 
VALUES ('https://www.youtube.com/embed/dQw4w9WgXcQ', '3:45', '4K Kalite', 'Türkçe Altyazılı')
ON CONFLICT DO NOTHING;

-- Insert default video features
INSERT INTO homepage_video_features (icon, sort_order) VALUES
  ('Factory', 1),
  ('Lightbulb', 2),
  ('Globe', 3)
ON CONFLICT DO NOTHING;