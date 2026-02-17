/*
  # Add anonymous read access to homepage content tables

  1. Security Changes
    - Add SELECT policy for `anon` role on `homepage_video_section`
    - Add SELECT policy for `anon` role on `homepage_video_features`
    - Add SELECT policy for `anon` role on `homepage_stats`
    - Add SELECT policy for `anon` role on `homepage_about_features`

  2. Purpose
    - These tables contain public homepage content visible to all visitors
    - Previously only authenticated users could read, causing content invisible to anonymous visitors
*/

DO $$ BEGIN
  CREATE POLICY "Anon users can view active video sections"
    ON homepage_video_section
    FOR SELECT
    TO anon
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anon users can view active video features"
    ON homepage_video_features
    FOR SELECT
    TO anon
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anon users can view active stats"
    ON homepage_stats
    FOR SELECT
    TO anon
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anon users can view active about features"
    ON homepage_about_features
    FOR SELECT
    TO anon
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
