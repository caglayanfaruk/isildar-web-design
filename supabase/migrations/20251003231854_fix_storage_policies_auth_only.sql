/*
  # Fix Storage Policies - Authenticated Users Only

  This migration updates storage policies to restrict uploads, updates, 
  and deletes to authenticated users only. Public users can only view files.

  ## Changes
  
  1. Storage Policies:
     - Public SELECT policy for viewing media files (anyone can see)
     - Authenticated INSERT policy for uploading (only logged-in users)
     - Authenticated UPDATE policy for updating (only logged-in users)
     - Authenticated DELETE policy for deleting (only logged-in users)

  ## Security
  
  Only authenticated admin users can upload, update, or delete files.
  Public users can only view the media files.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Public can update media" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete media" ON storage.objects;

-- Allow anyone to view media files (needed for public website)
CREATE POLICY "Anyone can view media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

-- Only authenticated users can upload media files
CREATE POLICY "Authenticated users can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Only authenticated users can update media files
CREATE POLICY "Authenticated users can update media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

-- Only authenticated users can delete media files
CREATE POLICY "Authenticated users can delete media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media');
