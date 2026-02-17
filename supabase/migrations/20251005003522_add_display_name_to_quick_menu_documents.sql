/*
  # Add display_name column to quick_menu_documents table

  1. Changes
    - Add `display_name` column to `quick_menu_documents` table to allow custom document naming for better admin tracking
*/

ALTER TABLE quick_menu_documents 
ADD COLUMN IF NOT EXISTS display_name text;
