/*
  # Create Analytics Tables

  1. New Tables
    - `page_views`
      - `id` (uuid, primary key)
      - `page_path` (text) - URL path of the page
      - `page_title` (text) - Title of the page
      - `referrer` (text) - Where the user came from
      - `user_agent` (text) - Browser/device info
      - `ip_address` (inet) - User IP address
      - `session_id` (text) - Session identifier
      - `viewed_at` (timestamptz) - When the page was viewed
    
    - `product_views`
      - `id` (uuid, primary key)
      - `product_id` (uuid) - Reference to products table
      - `session_id` (text) - Session identifier
      - `viewed_at` (timestamptz)
    
    - `quote_requests_analytics`
      - `id` (uuid, primary key)
      - `quote_request_id` (uuid) - Reference to quote_requests table
      - `product_id` (uuid, nullable) - If from a product page
      - `session_id` (text) - Session identifier
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Allow anonymous users to INSERT for tracking
    - Only authenticated users can SELECT
*/

-- Create page_views table
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  page_title text,
  referrer text,
  user_agent text,
  ip_address inet,
  session_id text NOT NULL,
  viewed_at timestamptz DEFAULT now()
);

-- Create product_views table
CREATE TABLE IF NOT EXISTS product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  viewed_at timestamptz DEFAULT now()
);

-- Create quote_requests_analytics table
CREATE TABLE IF NOT EXISTS quote_requests_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_analytics_created_at ON quote_requests_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests_analytics ENABLE ROW LEVEL SECURITY;

-- Page Views Policies
CREATE POLICY "Allow anonymous to insert page views"
  ON page_views
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to read page views"
  ON page_views
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Product Views Policies
CREATE POLICY "Allow anonymous to insert product views"
  ON product_views
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to read product views"
  ON product_views
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Quote Requests Analytics Policies
CREATE POLICY "Allow anonymous to insert quote analytics"
  ON quote_requests_analytics
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to read quote analytics"
  ON quote_requests_analytics
  FOR SELECT
  TO authenticated, anon
  USING (true);
