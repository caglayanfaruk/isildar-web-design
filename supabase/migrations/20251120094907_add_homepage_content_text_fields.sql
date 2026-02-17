/*
  # Add Text Fields to Homepage Content Tables
  
  1. Changes
    - Add text fields to homepage_video_section (badge, title, description, video_title)
    - Add text fields to homepage_video_features (title, description)
    - Add text fields to homepage_about_content (badge, title, subtitle, paragraphs)
    - Add text fields to homepage_about_features (label)
    - Add text fields to homepage_stats (label, description)
    
  2. Purpose
    - Store Turkish source text in tables
    - Use unified translation system for other languages
    - Admin enters Turkish, system auto-translates
*/

-- Add text fields to homepage_video_section
ALTER TABLE homepage_video_section
ADD COLUMN IF NOT EXISTS badge_tr TEXT,
ADD COLUMN IF NOT EXISTS title_tr TEXT,
ADD COLUMN IF NOT EXISTS description_tr TEXT,
ADD COLUMN IF NOT EXISTS video_title_tr TEXT;

-- Add text fields to homepage_video_features  
ALTER TABLE homepage_video_features
ADD COLUMN IF NOT EXISTS title_tr TEXT,
ADD COLUMN IF NOT EXISTS description_tr TEXT;

-- Add text fields to homepage_about_content
ALTER TABLE homepage_about_content
ADD COLUMN IF NOT EXISTS badge_tr TEXT,
ADD COLUMN IF NOT EXISTS title_tr TEXT,
ADD COLUMN IF NOT EXISTS subtitle_tr TEXT,
ADD COLUMN IF NOT EXISTS paragraph_1_tr TEXT,
ADD COLUMN IF NOT EXISTS paragraph_2_tr TEXT,
ADD COLUMN IF NOT EXISTS paragraph_3_tr TEXT,
ADD COLUMN IF NOT EXISTS paragraph_4_tr TEXT;

-- Add text fields to homepage_about_features
ALTER TABLE homepage_about_features
ADD COLUMN IF NOT EXISTS label_tr TEXT;

-- Add text fields to homepage_stats
ALTER TABLE homepage_stats
ADD COLUMN IF NOT EXISTS label_tr TEXT,
ADD COLUMN IF NOT EXISTS description_tr TEXT;

-- Update existing data with reasonable defaults
UPDATE homepage_video_section
SET 
  badge_tr = 'Tanıtım Filmi Slogan',
  title_tr = 'Tanıtım Filmi',
  description_tr = 'Işıldar Tanıtım Filmimizi İzleyin',
  video_title_tr = COALESCE(subtitle_info, 'Tanıtım Filmi')
WHERE badge_tr IS NULL;

UPDATE homepage_about_content
SET
  badge_tr = 'Hakkımızda',
  title_tr = 'Işıldar LED Aydınlatma',
  subtitle_tr = 'Kaliteli ve Yenilikçi LED Çözümleri',
  paragraph_1_tr = 'Işıldar LED Aydınlatma olarak, 2010 yılından bu yana LED aydınlatma sektöründe hizmet vermekteyiz.',
  paragraph_2_tr = 'Modern teknoloji ve yenilikçi tasarımlarımızla, müşterilerimize en iyi ürünleri sunmayı hedefliyoruz.',
  paragraph_3_tr = 'Geniş ürün yelpazemiz ve uzman ekibimizle, her türlü aydınlatma ihtiyacınıza çözüm üretiyoruz.',
  paragraph_4_tr = 'Kalite, güvenilirlik ve müşteri memnuniyeti bizim için öncelikli değerlerdir.'
WHERE badge_tr IS NULL;
