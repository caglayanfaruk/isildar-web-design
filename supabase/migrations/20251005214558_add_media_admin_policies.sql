/*
  # Add Media Management Policies for Authenticated Users

  1. Changes
    - Add INSERT policy for authenticated users to upload media
    - Add UPDATE policy for authenticated users to edit media details
    - Add DELETE policy for authenticated users to delete media files
    
  2. Security
    - Only authenticated users can insert, update, or delete media
    - Public users can still read media (existing policy)
*/

-- Allow authenticated users to insert media
CREATE POLICY "Authenticated users can insert media"
  ON media
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update media
CREATE POLICY "Authenticated users can update media"
  ON media
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete media
CREATE POLICY "Authenticated users can delete media"
  ON media
  FOR DELETE
  TO authenticated
  USING (true);
