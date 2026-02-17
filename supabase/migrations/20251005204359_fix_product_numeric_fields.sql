/*
  # Fix Product Numeric Fields
  
  1. Changes
    - Convert integer fields to numeric to support decimal values
    - Fields updated:
      - quantity_per_box (integer → numeric)
      - quantity_per_shrink (integer → numeric)
      - warranty_period (integer → numeric)
      - min_order_quantity (integer → numeric)
      - lead_time_days (integer → numeric)
  
  2. Reason
    - Import/Export should preserve exact decimal values
    - Business may use decimal quantities (e.g., 0.5 boxes, fractional measurements)
*/

-- Convert quantity_per_box to numeric
ALTER TABLE products 
  ALTER COLUMN quantity_per_box TYPE numeric USING quantity_per_box::numeric;

-- Convert quantity_per_shrink to numeric
ALTER TABLE products 
  ALTER COLUMN quantity_per_shrink TYPE numeric USING quantity_per_shrink::numeric;

-- Convert warranty_period to numeric
ALTER TABLE products 
  ALTER COLUMN warranty_period TYPE numeric USING warranty_period::numeric;

-- Convert min_order_quantity to numeric
ALTER TABLE products 
  ALTER COLUMN min_order_quantity TYPE numeric USING min_order_quantity::numeric;

-- Convert lead_time_days to numeric
ALTER TABLE products 
  ALTER COLUMN lead_time_days TYPE numeric USING lead_time_days::numeric;
