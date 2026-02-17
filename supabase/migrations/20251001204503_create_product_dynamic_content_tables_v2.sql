/*
  # Create Dynamic Product Content Tables

  Creates tables for dynamically managed product content like specs, features, etc.
*/

-- Product Specifications Table
CREATE TABLE IF NOT EXISTS product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  spec_key varchar(255) NOT NULL,
  spec_value text NOT NULL,
  spec_unit varchar(50),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_specifications_product_id ON product_specifications(product_id);

-- Product Features Table
CREATE TABLE IF NOT EXISTS product_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  feature_text text NOT NULL,
  icon varchar(50),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_features_product_id ON product_features(product_id);

-- Product Applications Table
CREATE TABLE IF NOT EXISTS product_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  application_text text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_applications_product_id ON product_applications(product_id);

-- Product Certifications Table
CREATE TABLE IF NOT EXISTS product_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  certification_code varchar(50) NOT NULL,
  certification_name varchar(255) NOT NULL,
  issuing_body varchar(255),
  issue_date date,
  expiry_date date,
  certificate_url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_certifications_product_id ON product_certifications(product_id);

-- Enable RLS
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_certifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public access" ON product_specifications FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON product_features FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON product_applications FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON product_certifications FOR ALL TO public USING (true) WITH CHECK (true);
