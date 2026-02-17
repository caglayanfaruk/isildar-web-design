/*
  # Add News Admin Policies

  1. Security Changes
    - Add INSERT policy for authenticated users to create news
    - Add UPDATE policy for authenticated users to update news
    - Add DELETE policy for authenticated users to delete news
    - Keep existing SELECT policy for public access to published news
    - Add SELECT policy for authenticated users to see all news

  2. Notes
    - Authenticated users are assumed to be admins
    - All admin operations (INSERT, UPDATE, DELETE) are allowed for authenticated users
*/

-- Policy for authenticated users to view all news (including drafts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'news' 
    AND policyname = 'Authenticated users can view all news'
  ) THEN
    CREATE POLICY "Authenticated users can view all news"
      ON news
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Policy for authenticated users to insert news
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'news' 
    AND policyname = 'Authenticated users can insert news'
  ) THEN
    CREATE POLICY "Authenticated users can insert news"
      ON news
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Policy for authenticated users to update news
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'news' 
    AND policyname = 'Authenticated users can update news'
  ) THEN
    CREATE POLICY "Authenticated users can update news"
      ON news
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Policy for authenticated users to delete news
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'news' 
    AND policyname = 'Authenticated users can delete news'
  ) THEN
    CREATE POLICY "Authenticated users can delete news"
      ON news
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;
