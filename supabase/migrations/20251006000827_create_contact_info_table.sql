/*
  # Create contact_info table
  
  1. New Table
    - `contact_info` - Single row table for contact information
      - `id` (uuid, primary key)
      - `whatsapp_number` (text) - WhatsApp number in international format
      - `phone` (text) - Primary phone number
      - `email` (text) - Primary email
      - `address` (text) - Physical address
      - `fax` (text) - Fax number
      - `website` (text) - Website URL
      - `working_hours` (jsonb) - Working hours object
      - `social_media` (jsonb) - Social media links
      - `map_coordinates` (jsonb) - Latitude and longitude
      - `additional_phones` (jsonb) - Array of additional phone numbers
      - `additional_emails` (jsonb) - Array of additional emails
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Public can read (for frontend display)
    - Only authenticated users can update (admin only)
*/

CREATE TABLE IF NOT EXISTS contact_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number text,
  phone text,
  email text,
  address text,
  fax text,
  website text,
  working_hours jsonb DEFAULT '{"monday_friday": "08:00 - 18:00", "saturday": "09:00 - 16:00", "sunday": "Kapalı"}'::jsonb,
  social_media jsonb DEFAULT '{"facebook": "", "twitter": "", "instagram": "", "linkedin": "", "youtube": ""}'::jsonb,
  map_coordinates jsonb DEFAULT '{"latitude": "", "longitude": ""}'::jsonb,
  additional_phones jsonb DEFAULT '[]'::jsonb,
  additional_emails jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contact info"
  ON contact_info
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contact info"
  ON contact_info
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contact info"
  ON contact_info
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert initial row if table is empty
INSERT INTO contact_info (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM contact_info);