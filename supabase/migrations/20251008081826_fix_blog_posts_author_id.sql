/*
  # Fix blog_posts author_id constraint

  1. Changes
    - Drop existing foreign key constraint on author_id
    - Make author_id nullable
    - Change author_id to reference auth.users instead of public.users
    - This allows blog posts to be created by authenticated users without requiring a public.users entry

  2. Security
    - Maintains existing RLS policies
    - Author ID will be set from auth.uid()
*/

-- Drop existing foreign key constraint
ALTER TABLE blog_posts 
DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;

-- Make author_id nullable
ALTER TABLE blog_posts 
ALTER COLUMN author_id DROP NOT NULL;

-- Add new foreign key constraint referencing auth.users
ALTER TABLE blog_posts
ADD CONSTRAINT blog_posts_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;