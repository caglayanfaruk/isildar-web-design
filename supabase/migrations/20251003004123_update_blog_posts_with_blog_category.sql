/*
  # Update Blog Posts to Use Blog Categories

  1. Changes
    - Add `blog_category_id` column to `blog_posts` table
    - Keep old `category_id` temporarily for backward compatibility
    - Add foreign key constraint to `blog_categories`
    - Add index for performance

  2. Data Migration
    - Does NOT migrate existing data automatically
    - Existing blog_posts will have NULL blog_category_id
    - Admin can manually assign blog categories later

  3. Security
    - No RLS changes needed (blog_posts already has RLS)

  4. Notes
    - The old `category_id` column is NOT removed for safety
    - This allows gradual migration from product categories to blog categories
*/

-- Add blog_category_id column to blog_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'blog_category_id'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN blog_category_id uuid REFERENCES blog_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_blog_category_id ON blog_posts(blog_category_id);

-- Add comment explaining the transition
COMMENT ON COLUMN blog_posts.blog_category_id IS 'New blog-specific category (replaces category_id which was for products)';
COMMENT ON COLUMN blog_posts.category_id IS 'Old product category reference (deprecated for blogs, use blog_category_id instead)';