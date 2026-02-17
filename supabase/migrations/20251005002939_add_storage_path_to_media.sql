/*
  # Add storage_path column to media table

  1. Changes
    - Add `storage_path` column to `media` table to store file paths in storage bucket
*/

ALTER TABLE media 
ADD COLUMN IF NOT EXISTS storage_path text;
