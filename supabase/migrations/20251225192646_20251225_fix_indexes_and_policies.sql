/*
  # Fix Database Performance and Security Issues
  
  ## Overview
  Addresses performance and security issues identified by Supabase advisor.
  
  ## Changes
  
  ### 1. Add Missing Foreign Key Indexes (Performance)
  Adding indexes on foreign key columns that are frequently used in joins:
  - `product_certifications.product_id` - Used when querying product certifications
  - `product_filter_groups.category_id` - Used when filtering by category
  - `product_variant_media.media_id` - Used when loading variant media
  
  ### 2. Drop Unused Indexes (Performance)
  Removes 36+ indexes that have never been used according to pg_stat_user_indexes.
  Unused indexes slow down INSERT/UPDATE/DELETE operations and waste storage.
  
  ### 3. Consolidate Duplicate RLS Policies (Security)
  Fixes tables with multiple permissive SELECT policies for the same role:
  - `slider_items` - Merge 3 policies into 2 (one for public, one for authenticated)
  - `sliders` - Merge 3 policies into 2 (one for public, one for authenticated)
  
  ## Note
  Security definer views and Auth configuration issues must be fixed via Supabase dashboard.
*/

-- ============================================================================
-- SECTION 1: Add Missing Foreign Key Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_certifications_product_id 
  ON product_certifications(product_id);

CREATE INDEX IF NOT EXISTS idx_product_filter_groups_category_id 
  ON product_filter_groups(category_id);

CREATE INDEX IF NOT EXISTS idx_product_variant_media_media_id 
  ON product_variant_media(media_id);

-- ============================================================================
-- SECTION 2: Drop Unused Indexes
-- ============================================================================

-- Product-related unused indexes
DROP INDEX IF EXISTS idx_product_attribute_assignments_attribute_id;
DROP INDEX IF EXISTS idx_product_attribute_assignments_attribute_value_id;
DROP INDEX IF EXISTS idx_product_images_media_id;
DROP INDEX IF EXISTS idx_product_media_media_id;
DROP INDEX IF EXISTS idx_product_media_product_id;
DROP INDEX IF EXISTS idx_product_related_related_product_id;
DROP INDEX IF EXISTS idx_product_reviews_variant_id;
DROP INDEX IF EXISTS idx_product_tag_assignments_tag_id;
DROP INDEX IF EXISTS idx_product_attribute_values_attr_value;
DROP INDEX IF EXISTS idx_product_variant_attributes_attribute_value_id;
DROP INDEX IF EXISTS idx_products_parent_id;
DROP INDEX IF EXISTS idx_product_export_info_product_id;
DROP INDEX IF EXISTS idx_product_filter_values_product_id;
DROP INDEX IF EXISTS idx_product_filter_values_filter_option_id;

-- Blog-related unused indexes
DROP INDEX IF EXISTS idx_blog_posts_author_id;
DROP INDEX IF EXISTS idx_blog_posts_category_id;
DROP INDEX IF EXISTS idx_blog_posts_featured_image_id;

-- Category-related unused indexes
DROP INDEX IF EXISTS idx_categories_banner_image_id;
DROP INDEX IF EXISTS idx_categories_image_id;

-- Contact and messaging unused indexes
DROP INDEX IF EXISTS idx_contact_messages_replied_by;
DROP INDEX IF EXISTS idx_quote_requests_responded_by;
DROP INDEX IF EXISTS idx_quote_requests_analytics_product_id;

-- Media-related unused indexes
DROP INDEX IF EXISTS idx_homepage_video_section_thumbnail_image_id;
DROP INDEX IF EXISTS idx_media_uploaded_by;
DROP INDEX IF EXISTS idx_slider_items_image_id;
DROP INDEX IF EXISTS idx_slider_items_slider_id;

-- Navigation unused indexes
DROP INDEX IF EXISTS idx_menu_items_menu_id;
DROP INDEX IF EXISTS idx_menu_items_parent_id;

-- News unused indexes
DROP INDEX IF EXISTS idx_news_author_id;
DROP INDEX IF EXISTS idx_news_featured_image_id;

-- Other unused indexes
DROP INDEX IF EXISTS idx_inventory_variant_id;
DROP INDEX IF EXISTS idx_price_tiers_variant_id;
DROP INDEX IF EXISTS idx_projects_featured_image_id;

-- ============================================================================
-- SECTION 3: Consolidate Duplicate RLS Policies
-- ============================================================================

-- Fix slider_items: Remove overlapping policies, keep clean separation
-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Authenticated can manage slider items" ON slider_items;
DROP POLICY IF EXISTS "Authenticated users can view all slider items" ON slider_items;
DROP POLICY IF EXISTS "Public can view active slider items" ON slider_items;

-- Recreate with clear separation: one for public (active only), one for authenticated (all)
CREATE POLICY "Public can view active slider items"
  ON slider_items
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage slider items"
  ON slider_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix sliders: Remove overlapping policies, keep clean separation
DROP POLICY IF EXISTS "Authenticated can manage sliders" ON sliders;
DROP POLICY IF EXISTS "Authenticated users can view all sliders" ON sliders;
DROP POLICY IF EXISTS "Public can view active sliders" ON sliders;

-- Recreate with clear separation
CREATE POLICY "Public can view active sliders"
  ON sliders
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage sliders"
  ON sliders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
