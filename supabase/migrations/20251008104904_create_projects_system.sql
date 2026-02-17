/*
  # Create Projects Management System

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `featured_image_id` (uuid, foreign key to media) - Project main image
      - `sort_order` (integer) - Display order
      - `is_active` (boolean) - Visibility control
      - `project_date` (date) - Project completion/start date
      - `client_name` (text) - Client/company name
      - `location` (text) - Project location
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Translation Keys
    - `project.{slug}.title` - Project title
    - `project.{slug}.description` - Short description for card
    - `project.{slug}.content` - Full project details (optional)

  3. Security
    - Enable RLS on projects table
    - Public can view active projects
    - Only authenticated users can manage projects

  4. Notes
    - Projects will be displayed as cards with image and description
    - Supports multi-language through translations table
    - Admin can manage projects through admin panel
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  featured_image_id uuid REFERENCES media(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  project_date date,
  client_name text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Public can view active projects"
  ON projects
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON projects(sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
