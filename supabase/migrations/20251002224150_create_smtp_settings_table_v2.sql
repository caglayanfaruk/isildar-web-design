/*
  # Create SMTP Settings Table

  1. New Tables
    - `smtp_settings`
      - `id` (uuid, primary key)
      - `host` (text) - SMTP server host
      - `port` (integer) - SMTP server port
      - `username` (text) - SMTP username
      - `password` (text) - SMTP password
      - `from_email` (text) - Default sender email
      - `from_name` (text) - Default sender name
      - `use_tls` (boolean) - Use TLS encryption
      - `use_ssl` (boolean) - Use SSL encryption
      - `is_active` (boolean) - Whether this SMTP config is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Allow authenticated/anon users to manage SMTP settings (for development)
*/

-- Create update function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create smtp_settings table
CREATE TABLE IF NOT EXISTS smtp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host text NOT NULL,
  port integer NOT NULL DEFAULT 587,
  username text NOT NULL,
  password text NOT NULL,
  from_email text NOT NULL,
  from_name text NOT NULL DEFAULT 'IŞILDAR',
  use_tls boolean DEFAULT true,
  use_ssl boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE smtp_settings ENABLE ROW LEVEL SECURITY;

-- SMTP Settings Policies
CREATE POLICY "Allow all to read SMTP settings"
  ON smtp_settings
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow all to insert SMTP settings"
  ON smtp_settings
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow all to update SMTP settings"
  ON smtp_settings
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all to delete SMTP settings"
  ON smtp_settings
  FOR DELETE
  TO authenticated, anon
  USING (true);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_smtp_settings_updated_at ON smtp_settings;
CREATE TRIGGER update_smtp_settings_updated_at 
  BEFORE UPDATE ON smtp_settings
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for contact_messages updated_at
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON contact_messages;
CREATE TRIGGER update_contact_messages_updated_at 
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
