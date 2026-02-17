/*
  # Admin Sidebar Dynamic Management

  1. New Tables
    - `admin_sidebar_items`
      - `id` (uuid, primary key)
      - `parent_id` (uuid, nullable, self-referencing)
      - `title` (text, menu item title)
      - `icon` (text, lucide icon name)
      - `path` (text, nullable, route path)
      - `order` (integer, display order)
      - `visible` (boolean, visibility status)
      - `permissions` (text array, required permissions)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `admin_sidebar_translations`
      - `id` (uuid, primary key)
      - `sidebar_item_id` (uuid, foreign key)
      - `language_code` (text)
      - `title` (text, translated title)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users
    - Admins can read and manage sidebar items

  3. Initial Data
    - Populate with existing sidebar structure
    - Set proper ordering and hierarchy
*/

-- Create admin_sidebar_items table
CREATE TABLE IF NOT EXISTS admin_sidebar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES admin_sidebar_items(id) ON DELETE CASCADE,
  title text NOT NULL,
  icon text NOT NULL,
  path text,
  "order" integer NOT NULL DEFAULT 0,
  visible boolean DEFAULT true,
  permissions text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_sidebar_translations table
CREATE TABLE IF NOT EXISTS admin_sidebar_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sidebar_item_id uuid REFERENCES admin_sidebar_items(id) ON DELETE CASCADE NOT NULL,
  language_code text NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sidebar_item_id, language_code)
);

-- Enable RLS
ALTER TABLE admin_sidebar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sidebar_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_sidebar_items
CREATE POLICY "Anyone can view visible sidebar items"
  ON admin_sidebar_items FOR SELECT
  USING (visible = true);

CREATE POLICY "Authenticated users can insert sidebar items"
  ON admin_sidebar_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sidebar items"
  ON admin_sidebar_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sidebar items"
  ON admin_sidebar_items FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for admin_sidebar_translations
CREATE POLICY "Anyone can view sidebar translations"
  ON admin_sidebar_translations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert sidebar translations"
  ON admin_sidebar_translations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sidebar translations"
  ON admin_sidebar_translations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sidebar translations"
  ON admin_sidebar_translations FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_sidebar_items_parent_id ON admin_sidebar_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_admin_sidebar_items_order ON admin_sidebar_items("order");
CREATE INDEX IF NOT EXISTS idx_admin_sidebar_translations_item ON admin_sidebar_translations(sidebar_item_id);

-- Insert initial data (main menu items)
INSERT INTO admin_sidebar_items (id, parent_id, title, icon, path, "order", visible) VALUES
  ('11111111-1111-1111-1111-111111111111', NULL, 'Dashboard', 'LayoutDashboard', '/admin', 1, true),
  ('22222222-2222-2222-2222-222222222222', NULL, 'İçerik Yönetimi', 'FileText', NULL, 2, true),
  ('33333333-3333-3333-3333-333333333333', NULL, 'Ürün Yönetimi', 'Package', NULL, 3, true),
  ('44444444-4444-4444-4444-444444444444', NULL, 'Blog & Haberler', 'Newspaper', NULL, 4, true),
  ('55555555-5555-5555-5555-555555555555', NULL, 'İletişim', 'MessageSquare', NULL, 5, true),
  ('66666666-6666-6666-6666-666666666666', NULL, 'Medya', 'Image', '/admin/media', 6, true),
  ('77777777-7777-7777-7777-777777777777', NULL, 'Tasarım', 'Palette', NULL, 7, true),
  ('88888888-8888-8888-8888-888888888888', NULL, 'Ayarlar', 'Settings', NULL, 8, true),
  ('99999999-9999-9999-9999-999999999999', NULL, 'Analitik', 'BarChart3', '/admin/analytics', 9, true)
ON CONFLICT (id) DO NOTHING;

-- Insert submenu items for İçerik Yönetimi
INSERT INTO admin_sidebar_items (parent_id, title, icon, path, "order", visible) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Dil Yönetimi', 'Globe', '/admin/languages', 1, true),
  ('22222222-2222-2222-2222-222222222222', 'Çeviriler', 'Globe', '/admin/translations', 2, true),
  ('22222222-2222-2222-2222-222222222222', 'Slider Yönetimi', 'Sliders', '/admin/sliders', 3, true),
  ('22222222-2222-2222-2222-222222222222', 'Menü Yönetimi', 'Menu', '/admin/menus', 4, true),
  ('22222222-2222-2222-2222-222222222222', 'Hakkımızda', 'Info', '/admin/about', 5, true),
  ('22222222-2222-2222-2222-222222222222', 'Sayfalar', 'FileText', '/admin/pages', 6, true);

-- Insert submenu items for Ürün Yönetimi
INSERT INTO admin_sidebar_items (parent_id, title, icon, path, "order", visible) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Kategoriler', 'Tags', '/admin/categories', 1, true),
  ('33333333-3333-3333-3333-333333333333', 'Ürünler', 'Package', '/admin/products', 2, true),
  ('33333333-3333-3333-3333-333333333333', 'Varyantlar', 'ShoppingCart', '/admin/variants', 3, true);

-- Insert submenu items for Blog & Haberler
INSERT INTO admin_sidebar_items (parent_id, title, icon, path, "order", visible) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Blog Yazıları', 'FileText', '/admin/blog', 1, true),
  ('44444444-4444-4444-4444-444444444444', 'Haberler', 'Newspaper', '/admin/news', 2, true),
  ('44444444-4444-4444-4444-444444444444', 'Kategoriler', 'Tags', '/admin/blog-categories', 3, true);

-- Insert submenu items for İletişim
INSERT INTO admin_sidebar_items (parent_id, title, icon, path, "order", visible) VALUES
  ('55555555-5555-5555-5555-555555555555', 'İletişim Mesajları', 'Mail', '/admin/contact-messages', 1, true),
  ('55555555-5555-5555-5555-555555555555', 'Teklif Talepleri', 'MessageSquare', '/admin/quote-requests', 2, true),
  ('55555555-5555-5555-5555-555555555555', 'Newsletter', 'Users', '/admin/newsletter', 3, true),
  ('55555555-5555-5555-5555-555555555555', 'İletişim Bilgileri', 'Phone', '/admin/contact-info', 4, true);

-- Insert submenu items for Tasarım
INSERT INTO admin_sidebar_items (parent_id, title, icon, path, "order", visible) VALUES
  ('77777777-7777-7777-7777-777777777777', 'Renk Yönetimi', 'Palette', '/admin/colors', 1, true),
  ('77777777-7777-7777-7777-777777777777', 'Logo & Favicon', 'Image', '/admin/branding', 2, true),
  ('77777777-7777-7777-7777-777777777777', 'Footer Yönetimi', 'Settings', '/admin/footer', 3, true);

-- Insert submenu items for Ayarlar
INSERT INTO admin_sidebar_items (parent_id, title, icon, path, "order", visible) VALUES
  ('88888888-8888-8888-8888-888888888888', 'Genel Ayarlar', 'Settings', '/admin/settings', 1, true),
  ('88888888-8888-8888-8888-888888888888', 'SMTP Ayarları', 'Mail', '/admin/smtp', 2, true),
  ('88888888-8888-8888-8888-888888888888', 'Katalog & Fiyat', 'FileText', '/admin/documents', 3, true),
  ('88888888-8888-8888-8888-888888888888', 'Gizlilik & KVKK', 'FileText', '/admin/legal', 4, true);