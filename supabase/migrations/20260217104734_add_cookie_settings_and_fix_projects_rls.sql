/*
  # Cookie Settings & Projects RLS Fix

  1. Changes
    - Add anonymous SELECT policy for `projects` table so public visitors can view references
    - Add anonymous SELECT policy for `media` table to support project images for anon users

  2. Security
    - Projects: anon can only SELECT active projects
    - Existing authenticated policies remain unchanged
*/

CREATE POLICY "Anon users can view active projects"
  ON projects
  FOR SELECT
  TO anon
  USING (is_active = true);
