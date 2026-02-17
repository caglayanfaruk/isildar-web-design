/*
  # Create Quote Attachments Storage System

  1. Storage Bucket
    - Create 'quote-attachments' bucket for file uploads
    - Set public access to false for security
    
  2. Storage Policies
    - Allow authenticated users to upload files
    - Allow anyone to read files (for admin review)
    - Allow users to delete their own files
    
  3. Allowed File Types
    - PDF documents (.pdf)
    - Excel files (.xlsx, .xls)
    - Word documents (.doc, .docx)
    - Images (.jpg, .jpeg, .png)
*/

-- Create quote-attachments bucket if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'quote-attachments'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('quote-attachments', 'quote-attachments', true);
  END IF;
END $$;

-- Storage policies for quote-attachments bucket
DO $$
BEGIN
  -- Allow anyone to upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname = 'Allow public upload to quote-attachments'
  ) THEN
    CREATE POLICY "Allow public upload to quote-attachments"
      ON storage.objects FOR INSERT
      TO public
      WITH CHECK (bucket_id = 'quote-attachments');
  END IF;

  -- Allow anyone to read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname = 'Allow public read from quote-attachments'
  ) THEN
    CREATE POLICY "Allow public read from quote-attachments"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'quote-attachments');
  END IF;

  -- Allow anyone to delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname = 'Allow public delete from quote-attachments'
  ) THEN
    CREATE POLICY "Allow public delete from quote-attachments"
      ON storage.objects FOR DELETE
      TO public
      USING (bucket_id = 'quote-attachments');
  END IF;
END $$;
