/*
  # Create Homepage Statistics Table

  1. New Tables
    - `homepage_stats`
      - `id` (uuid, primary key)
      - `icon` (text) - Lucide icon name (e.g., "Award", "Users", "Clock", "Globe")
      - `number_value` (text) - Display value (e.g., "53+", "5K+", "16K", "47")
      - `sort_order` (integer) - Display order
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Index on is_active
    - Index on sort_order

  3. Security
    - Enable RLS
    - Public can read active stats
    - Authenticated users (admin) can manage

  4. Translation Keys Format
    - `homepage.stats.{stat_id}.label` - Main label (e.g., "Yıllık Deneyim")
    - `homepage.stats.{stat_id}.description` - Description (e.g., "Aydınlatma sektöründe")

  5. Default Data
    - Insert 4 default statistics matching current design
*/

-- Create homepage_stats table
CREATE TABLE IF NOT EXISTS homepage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL DEFAULT 'Star',
  number_value text NOT NULL DEFAULT '0',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_homepage_stats_is_active ON homepage_stats(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_stats_sort_order ON homepage_stats(sort_order);

-- Enable RLS
ALTER TABLE homepage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active stats"
  ON homepage_stats
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all stats"
  ON homepage_stats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stats"
  ON homepage_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stats"
  ON homepage_stats
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete stats"
  ON homepage_stats
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default stats
INSERT INTO homepage_stats (icon, number_value, sort_order) VALUES
  ('Award', '53+', 1),
  ('Users', '5K+', 2),
  ('Clock', '16K', 3),
  ('Globe', '47', 4)
ON CONFLICT DO NOTHING;