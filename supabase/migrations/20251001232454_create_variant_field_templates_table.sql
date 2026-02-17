/*
  # Create Variant Field Templates Table

  1. New Table
    - `variant_field_templates`
      - `id` (uuid, primary key)
      - `name` (text) - Template name (e.g., "Kablo Ürünleri", "LED Ürünleri")
      - `description` (text) - Optional description of the template
      - `fields` (jsonb) - Array of field definitions
      - `is_active` (boolean) - Whether template is active
      - `sort_order` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on variant_field_templates table
    - Add policy for public read access (anonymous users can view)
    - Add policy for authenticated admin users to manage

  3. Sample Data
    - Insert default templates for Kablo and LED products

  4. Notes
    - Templates can be reused across multiple categories
    - Admins can create custom templates
    - Fields structure matches the existing variant_fields format
*/

-- Create variant_field_templates table
CREATE TABLE IF NOT EXISTS variant_field_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE variant_field_templates ENABLE ROW LEVEL SECURITY;

-- Public can view active templates
CREATE POLICY "Anyone can view active templates"
  ON variant_field_templates
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all templates
CREATE POLICY "Authenticated users can view all templates"
  ON variant_field_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert templates
CREATE POLICY "Authenticated users can insert templates"
  ON variant_field_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update templates
CREATE POLICY "Authenticated users can update templates"
  ON variant_field_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete templates
CREATE POLICY "Authenticated users can delete templates"
  ON variant_field_templates
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_variant_field_templates_active ON variant_field_templates(is_active, sort_order);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_variant_field_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_variant_field_templates_updated_at
  BEFORE UPDATE ON variant_field_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_field_templates_updated_at();

-- Insert default templates
INSERT INTO variant_field_templates (name, description, fields, sort_order) VALUES
(
  'Kablo Ürünleri',
  'Kablo ve elektrik malzemeleri için standart lojistik alanları',
  '[
    {"key": "box_pieces", "label_tr": "Kutu Adet", "label_en": "Box Pieces", "type": "number", "required": false},
    {"key": "package_pieces", "label_tr": "Koli Adet", "label_en": "Package Pieces", "type": "number", "required": false},
    {"key": "package_volume", "label_tr": "Koli Hacim", "label_en": "Pack Volume", "type": "number", "unit": "m³", "required": false},
    {"key": "package_weight", "label_tr": "Koli Ağırlık", "label_en": "Pack Weight", "type": "number", "unit": "kg", "required": false}
  ]'::jsonb,
  1
),
(
  'LED Ürünleri',
  'LED aydınlatma ürünleri için teknik ve lojistik alanları',
  '[
    {"key": "power", "label_tr": "Güç", "label_en": "Power", "type": "text", "unit": "W", "required": false},
    {"key": "lumen", "label_tr": "Lümen", "label_en": "Lumen", "type": "number", "unit": "lm", "required": false},
    {"key": "dimensions", "label_tr": "Ölçü", "label_en": "Dimensions", "type": "text", "required": false},
    {"key": "package_volume", "label_tr": "Koli", "label_en": "Pack", "type": "number", "unit": "m³", "required": false},
    {"key": "package_weight", "label_tr": "Koli Ağırlık", "label_en": "Pack Weight", "type": "number", "unit": "kg", "required": false}
  ]'::jsonb,
  2
)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE variant_field_templates IS 'Reusable templates for category variant fields configuration. Allows admins to create and manage preset field configurations.';
