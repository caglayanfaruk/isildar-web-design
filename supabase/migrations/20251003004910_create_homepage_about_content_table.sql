/*
  # Create Homepage About Content Table

  1. New Tables
    - `homepage_about_content`
      - `id` (uuid, primary key)
      - `is_active` (boolean) - Only one should be active at a time
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `homepage_about_features`
      - `id` (uuid, primary key)
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
    - About badge: `homepage.about.badge`
    - About title: `homepage.about.title`
    - About subtitle: `homepage.about.subtitle`
    - About paragraphs: `homepage.about.paragraph_1`, `homepage.about.paragraph_2`, `homepage.about.paragraph_3`, `homepage.about.paragraph_4`
    - About features: `homepage.about.feature.{feature_id}.label`

  5. Default Data
    - Insert one default about content entry
    - Insert 4 default features
*/

-- Create homepage_about_content table
CREATE TABLE IF NOT EXISTS homepage_about_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create homepage_about_features table
CREATE TABLE IF NOT EXISTS homepage_about_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_homepage_about_content_is_active ON homepage_about_content(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_about_features_is_active ON homepage_about_features(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_about_features_sort_order ON homepage_about_features(sort_order);

-- Enable RLS
ALTER TABLE homepage_about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_about_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homepage_about_content
CREATE POLICY "Public can view active about content"
  ON homepage_about_content
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all about content"
  ON homepage_about_content
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert about content"
  ON homepage_about_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update about content"
  ON homepage_about_content
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete about content"
  ON homepage_about_content
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for homepage_about_features
CREATE POLICY "Public can view active about features"
  ON homepage_about_features
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all about features"
  ON homepage_about_features
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert about features"
  ON homepage_about_features
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update about features"
  ON homepage_about_features
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete about features"
  ON homepage_about_features
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default about content
INSERT INTO homepage_about_content (is_active) 
VALUES (true)
ON CONFLICT DO NOTHING;

-- Insert default features
INSERT INTO homepage_about_features (sort_order) VALUES
  (1),
  (2),
  (3),
  (4)
ON CONFLICT DO NOTHING;