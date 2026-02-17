/*
  # Add Projects to Admin Sidebar

  1. Changes
    - Add "Projeler" menu item to admin sidebar under Content Management section
    - Set appropriate order and icon

  2. Notes
    - Projects menu will appear in admin panel sidebar
    - Links to /admin/projects route
*/

-- Insert Projects menu item under Content Management (İçerik Yönetimi)
DO $$
DECLARE
  content_parent_id uuid;
  existing_item_id uuid;
BEGIN
  -- Find Content Management parent item
  SELECT id INTO content_parent_id
  FROM admin_sidebar_items
  WHERE title = 'İçerik Yönetimi'
  LIMIT 1;

  -- Check if item already exists
  SELECT id INTO existing_item_id
  FROM admin_sidebar_items
  WHERE path = '/admin/projects'
  LIMIT 1;

  -- If parent exists and item doesn't exist, add Projects as child
  IF content_parent_id IS NOT NULL AND existing_item_id IS NULL THEN
    INSERT INTO admin_sidebar_items (parent_id, title, icon, path, "order", visible, permissions)
    VALUES (
      content_parent_id,
      'Projeler',
      'FolderOpen',
      '/admin/projects',
      7,
      true,
      ARRAY['admin']::text[]
    );
  END IF;
END $$;
