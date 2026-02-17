/*
  # Storage Policies for Media Bucket

  This migration creates storage policies for the media bucket to allow
  public access for viewing files and authenticated uploads.

  ## Changes
  
  1. Storage Policies:
     - Public SELECT policy for viewing all media files
     - Public INSERT policy for uploading media files
     - Public UPDATE policy for updating media files
     - Public DELETE policy for removing media files

  ## Security Note
  
  These policies allow public uploads for development.
  In production, restrict INSERT/UPDATE/DELETE to authenticated users only.
*/

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Public can update media" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete media" ON storage.objects;

-- Allow public to view all media files
CREATE POLICY "Public can view media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow public to upload media files
CREATE POLICY "Public can upload media"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'media');

-- Allow public to update media files
CREATE POLICY "Public can update media"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

-- Allow public to delete media files
CREATE POLICY "Public can delete media"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'media');
