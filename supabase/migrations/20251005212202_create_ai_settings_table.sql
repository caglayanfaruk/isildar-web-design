/*
  # AI Settings Table

  1. New Tables
    - `ai_settings`
      - `id` (uuid, primary key)
      - `gemini_api_key` (text, encrypted API key for Gemini)
      - `claude_api_key` (text, encrypted API key for Claude)
      - `default_provider` (text, 'gemini' or 'claude')
      - `short_description_prompt` (text, prompt template for short descriptions)
      - `long_description_prompt` (text, prompt template for long descriptions)
      - `short_description_max_words` (integer, max words for short description)
      - `long_description_max_words` (integer, max words for long description)
      - `temperature` (numeric, AI creativity level 0-1)
      - `is_active` (boolean, enable/disable AI features)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ai_settings` table
    - Only authenticated users can read settings
    - Only authenticated users can update settings
*/

CREATE TABLE IF NOT EXISTS ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gemini_api_key text,
  claude_api_key text,
  default_provider text DEFAULT 'gemini' CHECK (default_provider IN ('gemini', 'claude')),
  short_description_prompt text DEFAULT 'Ürün adı: {product_name}. Bu ürün için profesyonel, ilgi çekici ve SEO uyumlu bir kısa açıklama yaz. Açıklama {max_words} kelimeyi geçmemelidir.',
  long_description_prompt text DEFAULT 'Ürün adı: {product_name}. Bu ürün için detaylı, bilgilendirici ve profesyonel bir açıklama yaz. Ürünün özelliklerini, kullanım alanlarını ve avantajlarını vurgula. HTML formatında yaz (p, ul, li, strong etiketleri kullan). Açıklama {max_words} kelimeyi geçmemelidir.',
  short_description_max_words integer DEFAULT 50,
  long_description_max_words integer DEFAULT 300,
  temperature numeric DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can read AI settings"
  ON ai_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert AI settings"
  ON ai_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update AI settings"
  ON ai_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default settings
INSERT INTO ai_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
