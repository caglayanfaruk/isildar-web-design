/*
  # Create Product Export Information Table

  This migration creates a table to store export-related information for products,
  including packaging, shipping, and international trade details.

  ## New Table: product_export_info
  
  ### Columns:
  - id (uuid, primary key)
  - product_id (uuid, references products)
  - hs_code (varchar) - Harmonized System code for customs
  - country_of_origin (varchar) - Manufacturing country
  - export_packaging_type (varchar) - How product is packaged for export
  - units_per_carton (integer) - Number of units per export carton
  - carton_dimensions (varchar) - L x W x H in cm
  - carton_weight (decimal) - Gross weight in kg
  - carton_cbm (decimal) - Cubic meters per carton
  - units_per_pallet (integer) - Units that fit on a pallet
  - units_per_container_20ft (integer)
  - units_per_container_40ft (integer)
  - units_per_container_40hc (integer)
  - min_order_quantity_export (integer)
  - export_lead_time_days (integer)
  - certifications_export (jsonb) - CE, RoHS, etc.
  - special_handling_notes (text)
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ## Indexes:
  - Index on product_id for faster lookups
  - Index on hs_code for customs queries

  ## RLS:
  - Enable RLS with public access policies
*/

CREATE TABLE IF NOT EXISTS product_export_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  hs_code varchar(20),
  country_of_origin varchar(100),
  export_packaging_type varchar(100),
  units_per_carton integer,
  carton_dimensions varchar(50),
  carton_weight decimal(10,2),
  carton_cbm decimal(10,4),
  units_per_pallet integer,
  units_per_container_20ft integer,
  units_per_container_40ft integer,
  units_per_container_40hc integer,
  min_order_quantity_export integer,
  export_lead_time_days integer,
  certifications_export jsonb DEFAULT '[]'::jsonb,
  special_handling_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_export_info_product_id ON product_export_info(product_id);
CREATE INDEX IF NOT EXISTS idx_product_export_info_hs_code ON product_export_info(hs_code);

ALTER TABLE product_export_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product export info" ON product_export_info;
DROP POLICY IF EXISTS "Anyone can insert product export info" ON product_export_info;
DROP POLICY IF EXISTS "Anyone can update product export info" ON product_export_info;
DROP POLICY IF EXISTS "Anyone can delete product export info" ON product_export_info;

CREATE POLICY "Anyone can view product export info"
  ON product_export_info
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert product export info"
  ON product_export_info
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update product export info"
  ON product_export_info
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete product export info"
  ON product_export_info
  FOR DELETE
  TO public
  USING (true);
