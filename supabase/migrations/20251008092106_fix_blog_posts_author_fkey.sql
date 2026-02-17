/*
  # Fix blog_posts author foreign key

  1. Changes
    - Add foreign key constraint from blog_posts.author_id to users.id
    - This allows Supabase to automatically join author data in queries
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add foreign key constraint for author_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'blog_posts_author_id_fkey'
    AND table_name = 'blog_posts'
  ) THEN
    ALTER TABLE blog_posts 
    ADD CONSTRAINT blog_posts_author_id_fkey 
    FOREIGN KEY (author_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;
  END IF;
END $$;
