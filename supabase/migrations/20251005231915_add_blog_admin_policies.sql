/*
  # Add Admin Policies for Blog Management

  1. Changes
    - Add INSERT policy for authenticated users (admin)
    - Add UPDATE policy for authenticated users (admin)
    - Add DELETE policy for authenticated users (admin)
    - Add SELECT policy for authenticated users (admin) to see drafts
    
  2. Security
    - Only authenticated users can create, update, and delete blog posts
    - Public users can only read published posts
    - Authenticated users can read all posts (including drafts)
*/

-- Allow authenticated users to read all blog posts (including drafts)
CREATE POLICY "Authenticated users can read all blog posts"
  ON blog_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert blog posts
CREATE POLICY "Authenticated users can insert blog posts"
  ON blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update blog posts
CREATE POLICY "Authenticated users can update blog posts"
  ON blog_posts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete blog posts
CREATE POLICY "Authenticated users can delete blog posts"
  ON blog_posts
  FOR DELETE
  TO authenticated
  USING (true);
