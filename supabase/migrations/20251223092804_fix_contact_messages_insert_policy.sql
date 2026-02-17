/*
  # Fix Contact Messages Insert Policy

  1. Changes
    - Add INSERT policy for anonymous users to submit contact form
    - Add INSERT policy for quote_requests for anonymous users
    
  2. Security
    - Anonymous users can only insert (submit forms)
    - Authenticated users (admins) can read, update, and delete
*/

-- Allow anyone (including anonymous) to insert contact messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contact_messages' 
    AND policyname = 'Anyone can submit contact messages'
  ) THEN
    CREATE POLICY "Anyone can submit contact messages"
      ON contact_messages
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Allow anyone (including anonymous) to insert quote requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quote_requests' 
    AND policyname = 'Anyone can submit quote requests'
  ) THEN
    CREATE POLICY "Anyone can submit quote requests"
      ON quote_requests
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;