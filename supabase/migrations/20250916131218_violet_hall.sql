/*
  # Multilingual CMS Database Schema

  1. Core Tables
    - languages: Supported languages
    - users: Admin users
    - settings: Site settings
    - translations: All translatable content
    
  2. Content Tables
    - categories: Product categories
    - products: Products and variants
    - blog_posts: Blog posts
    - news: News articles
    - pages: Static pages
    - sliders: Homepage sliders
    - menus: Navigation menus
    
  3. Communication Tables
    - contact_messages: Contact form submissions
    - quote_requests: Quote requests
    - newsletters: Newsletter subscriptions
    
  4. Media Tables
    - media: File uploads
    
  5. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Languages table
CREATE TABLE IF NOT EXISTS languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(5) UNIQUE NOT NULL,
  name varchar(100) NOT NULL,
  native_name varchar(100) NOT NULL,
  flag varchar(10),
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  first_name varchar(100),
  last_name varchar(100),
  role varchar(50) DEFAULT 'admin',
  avatar_url text,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Settings table for site configuration
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(100) UNIQUE NOT NULL,
  value jsonb,
  type varchar(50) DEFAULT 'text',
  category varchar(100),
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Translations table for all translatable content
CREATE TABLE IF NOT EXISTS translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code varchar(5) NOT NULL,
  translation_key varchar(255) NOT NULL,
  translation_value text,
  context varchar(100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(language_code, translation_key)
);

-- Media table for file uploads
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename varchar(255) NOT NULL,
  original_name varchar(255) NOT NULL,
  mime_type varchar(100) NOT NULL,
  size_bytes bigint NOT NULL,
  url text NOT NULL,
  alt_text text,
  caption text,
  folder varchar(255) DEFAULT 'uploads',
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(255) UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id),
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  icon varchar(100),
  image_id uuid REFERENCES media(id),
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku varchar(100) UNIQUE NOT NULL,
  category_id uuid REFERENCES categories(id),
  parent_id uuid REFERENCES products(id), -- For variants
  product_type varchar(50) DEFAULT 'simple', -- simple, variant, grouped
  status varchar(50) DEFAULT 'active',
  featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  
  -- Technical specifications
  specifications jsonb DEFAULT '{}',
  features jsonb DEFAULT '[]',
  applications jsonb DEFAULT '[]',
  
  -- Packaging info
  dimensions varchar(100),
  weight decimal(10,3),
  shrink_volume decimal(10,3),
  shrink_measurement varchar(100),
  quantity_per_box integer,
  quantity_per_shrink integer,
  
  -- SEO
  meta_title text,
  meta_description text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product media relationship
CREATE TABLE IF NOT EXISTS product_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  media_id uuid REFERENCES media(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(255) UNIQUE NOT NULL,
  author_id uuid REFERENCES users(id),
  category_id uuid REFERENCES categories(id),
  status varchar(50) DEFAULT 'draft',
  featured boolean DEFAULT false,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  reading_time integer,
  featured_image_id uuid REFERENCES media(id),
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- News table
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(255) UNIQUE NOT NULL,
  author_id uuid REFERENCES users(id),
  status varchar(50) DEFAULT 'draft',
  urgent boolean DEFAULT false,
  external boolean DEFAULT false,
  source varchar(255),
  views integer DEFAULT 0,
  featured_image_id uuid REFERENCES media(id),
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pages table for static pages
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(255) UNIQUE NOT NULL,
  template varchar(100) DEFAULT 'default',
  status varchar(50) DEFAULT 'active',
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sliders table
CREATE TABLE IF NOT EXISTS sliders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  location varchar(100) DEFAULT 'homepage',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Slider items table
CREATE TABLE IF NOT EXISTS slider_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slider_id uuid REFERENCES sliders(id) ON DELETE CASCADE,
  image_id uuid REFERENCES media(id),
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  link_url text,
  link_target varchar(20) DEFAULT '_self',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Menus table
CREATE TABLE IF NOT EXISTS menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  location varchar(100) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid REFERENCES menus(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES menu_items(id),
  title varchar(255) NOT NULL,
  url text,
  target varchar(20) DEFAULT '_self',
  icon varchar(100),
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(50),
  company varchar(255),
  subject varchar(255),
  message text NOT NULL,
  status varchar(50) DEFAULT 'unread',
  ip_address inet,
  user_agent text,
  replied_at timestamptz,
  replied_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Quote requests table
CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(50),
  company varchar(255),
  project_name varchar(255),
  project_address text,
  deadline date,
  budget_range varchar(100),
  description text NOT NULL,
  status varchar(50) DEFAULT 'pending',
  items jsonb DEFAULT '[]',
  attachments jsonb DEFAULT '[]',
  ip_address inet,
  user_agent text,
  responded_at timestamptz,
  responded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Newsletter subscriptions
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) UNIQUE NOT NULL,
  status varchar(50) DEFAULT 'active',
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  ip_address inet
);

-- Enable Row Level Security
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sliders ENABLE ROW LEVEL SECURITY;
ALTER TABLE slider_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to certain data
CREATE POLICY "Public can read active languages" ON languages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read public settings" ON settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Public can read translations" ON translations
  FOR SELECT USING (true);

CREATE POLICY "Public can read media" ON media
  FOR SELECT USING (true);

CREATE POLICY "Public can read active categories" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active products" ON products
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can read product media" ON product_media
  FOR SELECT USING (true);

CREATE POLICY "Public can read published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read published news" ON news
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read active pages" ON pages
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can read active sliders" ON sliders
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active slider items" ON slider_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active menus" ON menus
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active menu items" ON menu_items
  FOR SELECT USING (is_active = true);

-- Policies for contact and quote forms
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert quote requests" ON quote_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert newsletter subscriptions" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- Admin policies (will be updated when auth is implemented)
CREATE POLICY "Authenticated users can manage all data" ON users
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default languages
INSERT INTO languages (code, name, native_name, flag, is_default, sort_order) VALUES
('tr', 'Turkish', 'Türkçe', '🇹🇷', true, 1),
('en', 'English', 'English', '🇺🇸', false, 2),
('de', 'German', 'Deutsch', '🇩🇪', false, 3),
('ru', 'Russian', 'Русский', '🇷🇺', false, 4)
ON CONFLICT (code) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value, type, category, description, is_public) VALUES
('site_name', '"IŞILDAR"', 'text', 'general', 'Site name', true),
('site_description', '"Aydınlatma Teknolojileri"', 'text', 'general', 'Site description', true),
('primary_color', '"#ffffff"', 'color', 'theme', 'Primary color', true),
('secondary_color', '"#000000"', 'color', 'theme', 'Secondary color', true),
('logo_light', '""', 'image', 'branding', 'Light logo', true),
('logo_dark', '""', 'image', 'branding', 'Dark logo', true),
('favicon', '""', 'image', 'branding', 'Favicon', true),
('contact_phone', '"+90 212 549 53 93"', 'text', 'contact', 'Contact phone', true),
('contact_email', '"info@isildar.eu"', 'email', 'contact', 'Contact email', true),
('contact_address', '"İkitelli Organize San. Böl. İPKAŞ San. Sit. 3. Etap B Blok No:3 İkitelli - Küçükçekmece / İSTANBUL"', 'textarea', 'contact', 'Contact address', true),
('smtp_host', '""', 'text', 'email', 'SMTP host', false),
('smtp_port', '"587"', 'number', 'email', 'SMTP port', false),
('smtp_username', '""', 'text', 'email', 'SMTP username', false),
('smtp_password', '""', 'password', 'email', 'SMTP password', false)
ON CONFLICT (key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_translations_language_key ON translations(language_code, translation_key);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);