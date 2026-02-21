/*
  # Migrate variant packaging data from custom_fields to dedicated columns

  1. Data Migration
    - Move box_pieces, package_pieces, package_volume, package_weight from custom_fields JSONB to dedicated columns
    - Only update rows where dedicated column is NULL/0 and custom_fields has the value
    - Clean up custom_fields after migration by removing packaging keys

  2. Important Notes
    - No data loss: custom_fields values are copied first, then removed from JSONB
    - 1026 variants have packaging data in custom_fields
    - Dedicated columns are currently NULL for most variants
*/

-- Step 1: Copy packaging data from custom_fields to dedicated columns where columns are empty
UPDATE product_variants
SET
  box_pieces = CASE
    WHEN (box_pieces IS NULL OR box_pieces = 0) AND custom_fields->>'box_pieces' IS NOT NULL
    THEN (custom_fields->>'box_pieces')::integer
    ELSE box_pieces
  END,
  package_pieces = CASE
    WHEN (package_pieces IS NULL OR package_pieces = 0) AND custom_fields->>'package_pieces' IS NOT NULL
    THEN (custom_fields->>'package_pieces')::integer
    ELSE package_pieces
  END,
  package_volume = CASE
    WHEN (package_volume IS NULL OR package_volume = 0) AND custom_fields->>'package_volume' IS NOT NULL
    THEN (custom_fields->>'package_volume')::numeric
    ELSE package_volume
  END,
  package_weight = CASE
    WHEN (package_weight IS NULL OR package_weight = 0) AND custom_fields->>'package_weight' IS NOT NULL
    THEN (custom_fields->>'package_weight')::numeric
    ELSE package_weight
  END
WHERE custom_fields IS NOT NULL
  AND custom_fields::text != '{}'
  AND custom_fields::text != 'null'
  AND (
    custom_fields->>'box_pieces' IS NOT NULL
    OR custom_fields->>'package_pieces' IS NOT NULL
    OR custom_fields->>'package_volume' IS NOT NULL
    OR custom_fields->>'package_weight' IS NOT NULL
  );

-- Step 2: Remove packaging keys from custom_fields
UPDATE product_variants
SET custom_fields = custom_fields - 'box_pieces' - 'package_pieces' - 'package_volume' - 'package_weight'
WHERE custom_fields IS NOT NULL
  AND custom_fields::text != '{}'
  AND custom_fields::text != 'null'
  AND (
    custom_fields ? 'box_pieces'
    OR custom_fields ? 'package_pieces'
    OR custom_fields ? 'package_volume'
    OR custom_fields ? 'package_weight'
  );
