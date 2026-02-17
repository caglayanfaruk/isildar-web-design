/*
  # Consolidate Duplicate RLS Policies
  
  ## Overview
  This migration consolidates multiple permissive RLS policies on the same tables.
  Having multiple permissive policies can cause confusion and make security harder to audit.
  
  ## Strategy
  - For each table with duplicate policies, drop redundant policies
  - Keep the most comprehensive policy name
  - Ensure security is maintained or improved
  
  ## Tables Affected
  - about_content
  - blog_categories, blog_posts
  - categories
  - contact_messages
  - media
  - product_* tables
  - And many more...
*/

-- ============================================================================
-- PART 1: Core Tables
-- ============================================================================

-- about_content: Remove duplicate SELECT policies for anon/authenticated
DROP POLICY IF EXISTS "Allow all to read about content" ON about_content;
-- Keep: "Allow authenticated to manage about content" (covers SELECT)

-- blog_categories: Remove duplicate SELECT for authenticated
DROP POLICY IF EXISTS "Public can view active blog categories" ON blog_categories;
-- Keep: "Authenticated users can view all blog categories"

-- blog_posts: Remove duplicate SELECT for authenticated
DROP POLICY IF EXISTS "Public can read published blog posts" ON blog_posts;
-- Keep: "Authenticated users can read all blog posts"

-- ============================================================================
-- PART 2: Categories and Translations
-- ============================================================================

-- categories: Remove one of the duplicate SELECT policies
DROP POLICY IF EXISTS "Public can read active categories" ON categories;
-- Keep: "Anyone can view categories"

-- category_attributes: Remove duplicate
DROP POLICY IF EXISTS "Public can read category attributes" ON category_attributes;
-- Keep: "Authenticated users can manage category attributes"

-- category_translations: Remove duplicate
DROP POLICY IF EXISTS "Public can read category translations" ON category_translations;
-- Keep: "Authenticated users can manage category translations"

-- ============================================================================
-- PART 3: Contact and Messages
-- ============================================================================

-- contact_messages: Remove one duplicate INSERT policy
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON contact_messages;
-- Keep: "Anyone can insert contact messages"

-- ============================================================================
-- PART 4: Homepage Content
-- ============================================================================

-- homepage_about_content: Remove duplicate
DROP POLICY IF EXISTS "Public can view active about content" ON homepage_about_content;
-- Keep: "Authenticated users can view all about content"

-- homepage_about_features: Remove duplicate
DROP POLICY IF EXISTS "Public can view active about features" ON homepage_about_features;
-- Keep: "Authenticated users can view all about features"

-- homepage_stats: Remove duplicate
DROP POLICY IF EXISTS "Public can view active stats" ON homepage_stats;
-- Keep: "Authenticated users can view all stats"

-- homepage_video_features: Remove duplicate
DROP POLICY IF EXISTS "Public can view active video features" ON homepage_video_features;
-- Keep: "Authenticated users can view all video features"

-- homepage_video_section: Remove duplicate
DROP POLICY IF EXISTS "Public can view active video section" ON homepage_video_section;
-- Keep: "Authenticated users can view all video sections"

-- ============================================================================
-- PART 5: Inventory and Media
-- ============================================================================

-- inventory: Remove duplicate
DROP POLICY IF EXISTS "Public can read inventory" ON inventory;
-- Keep: "Authenticated users can manage inventory"

-- media: Remove duplicates, keep most comprehensive
DROP POLICY IF EXISTS "Public can read media" ON media;
DROP POLICY IF EXISTS "Anyone can delete media" ON media;
DROP POLICY IF EXISTS "Anyone can insert media" ON media;
DROP POLICY IF EXISTS "Anyone can view media" ON media;
DROP POLICY IF EXISTS "Anyone can update media" ON media;
-- Keep: Authenticated users policies

-- ============================================================================
-- PART 6: News and Pages
-- ============================================================================

-- news: Remove duplicate
DROP POLICY IF EXISTS "Public can read published news" ON news;
-- Keep: "Authenticated users can view all news"

-- pages: Remove duplicates
DROP POLICY IF EXISTS "Public can view published pages" ON pages;
DROP POLICY IF EXISTS "Public can read active pages" ON pages;
-- Keep: "Authenticated users can view all pages"

-- ============================================================================
-- PART 7: Product Core Tables
-- ============================================================================

-- price_tiers: Remove duplicate
DROP POLICY IF EXISTS "Public can read active price tiers" ON price_tiers;
-- Keep: "Authenticated users can manage price tiers"

-- product_applications: Remove "Public access" duplicates
DROP POLICY IF EXISTS "Public access" ON product_applications;
DROP POLICY IF EXISTS "Public can read product applications" ON product_applications;
-- Keep: "Authenticated users can manage product applications"

-- product_attribute_assignments: Remove duplicate
DROP POLICY IF EXISTS "Public can read product attribute assignments" ON product_attribute_assignments;
-- Keep: "Authenticated users can manage product attribute assignments"

-- product_attribute_values: Remove duplicate
DROP POLICY IF EXISTS "Public can read active attribute values" ON product_attribute_values;
-- Keep: "Authenticated users can manage attribute values"

-- product_attributes: Remove duplicate
DROP POLICY IF EXISTS "Public can read active product attributes" ON product_attributes;
-- Keep: "Authenticated users can manage product attributes"

-- product_certifications: Remove "Public access" duplicates
DROP POLICY IF EXISTS "Public access" ON product_certifications;
DROP POLICY IF EXISTS "Public can read product certifications" ON product_certifications;
-- Keep: "Authenticated users can manage product certifications"

-- ============================================================================
-- PART 8: Product Documents and Export
-- ============================================================================

-- product_documents: Clean up duplicates
DROP POLICY IF EXISTS "Anyone can view product documents" ON product_documents;
DROP POLICY IF EXISTS "Public can read public product documents" ON product_documents;
DROP POLICY IF EXISTS "Authenticated users can delete product documents" ON product_documents;
DROP POLICY IF EXISTS "Authenticated users can insert product documents" ON product_documents;
DROP POLICY IF EXISTS "Authenticated users can update product documents" ON product_documents;
-- Keep: "Authenticated users can manage product documents"

-- product_export_info: Clean up duplicates
DROP POLICY IF EXISTS "Anyone can view product export info" ON product_export_info;
DROP POLICY IF EXISTS "Anyone can delete product export info" ON product_export_info;
DROP POLICY IF EXISTS "Anyone can insert product export info" ON product_export_info;
DROP POLICY IF EXISTS "Anyone can update product export info" ON product_export_info;
DROP POLICY IF EXISTS "Public can read active product export info" ON product_export_info;
-- Keep: "Authenticated users can manage product export info"

-- product_features: Remove "Public access" duplicates
DROP POLICY IF EXISTS "Public access" ON product_features;
DROP POLICY IF EXISTS "Public can read product features" ON product_features;
-- Keep: "Authenticated users can manage product features"

-- ============================================================================
-- PART 9: Product Filters (Deprecated but still need cleanup)
-- ============================================================================

-- product_filter_groups: Remove duplicate
DROP POLICY IF EXISTS "Anyone can view visible filter groups" ON product_filter_groups;
-- Keep: "Authenticated users can manage filter groups"

-- product_filter_options: Remove duplicate
DROP POLICY IF EXISTS "Anyone can view visible filter options" ON product_filter_options;
-- Keep: "Authenticated users can manage filter options"

-- product_filter_translations: Remove duplicate
DROP POLICY IF EXISTS "Anyone can view filter translations" ON product_filter_translations;
-- Keep: "Authenticated users can manage filter translations"

-- product_filter_values: Clean up many duplicates
DROP POLICY IF EXISTS "Anyone can view product filter values" ON product_filter_values;
DROP POLICY IF EXISTS "Public can view product filter values" ON product_filter_values;
DROP POLICY IF EXISTS "Authenticated users can delete filter values" ON product_filter_values;
DROP POLICY IF EXISTS "Authenticated users can insert filter values" ON product_filter_values;
DROP POLICY IF EXISTS "Authenticated users can view all filter values" ON product_filter_values;
DROP POLICY IF EXISTS "Authenticated users can update filter values" ON product_filter_values;
-- Keep: "Authenticated users can manage product filter values"

-- ============================================================================
-- PART 10: Product Images and Media
-- ============================================================================

-- product_images: Clean up duplicates
DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
DROP POLICY IF EXISTS "Anyone can delete product images" ON product_images;
DROP POLICY IF EXISTS "Anyone can insert product images" ON product_images;
DROP POLICY IF EXISTS "Anyone can update product images" ON product_images;
DROP POLICY IF EXISTS "Public can read product images" ON product_images;
-- Keep: "Authenticated users can manage product images"

-- ============================================================================
-- PART 11: Product Related and Reviews
-- ============================================================================

-- product_related: Remove duplicate
DROP POLICY IF EXISTS "Public can read product related" ON product_related;
-- Keep: "Authenticated users can manage product related"

-- product_reviews: Remove duplicate
DROP POLICY IF EXISTS "Public can read approved product reviews" ON product_reviews;
-- Keep: "Authenticated users can manage product reviews"

-- product_specifications: Remove "Public access" duplicates
DROP POLICY IF EXISTS "Public access" ON product_specifications;
DROP POLICY IF EXISTS "Public can read product specifications" ON product_specifications;
-- Keep: "Authenticated users can manage product specifications"

-- ============================================================================
-- PART 12: Product Tags and Translations
-- ============================================================================

-- product_tag_assignments: Remove duplicate
DROP POLICY IF EXISTS "Public can read product tag assignments" ON product_tag_assignments;
-- Keep: "Authenticated users can manage product tag assignments"

-- product_tags: Remove duplicate
DROP POLICY IF EXISTS "Public can read active product tags" ON product_tags;
-- Keep: "Authenticated users can manage product tags"

-- product_translations: Remove duplicate for anon
DROP POLICY IF EXISTS "Anonymous users can manage product translations" ON product_translations;
DROP POLICY IF EXISTS "Public can read product translations" ON product_translations;
-- Keep: "Authenticated users can manage product translations"

-- ============================================================================
-- PART 13: Product Variants
-- ============================================================================

-- product_variant_attributes: Remove duplicate
DROP POLICY IF EXISTS "Public can read variant attributes" ON product_variant_attributes;
-- Keep: "Authenticated users can manage variant attributes"

-- product_variants: Clean up many duplicates
DROP POLICY IF EXISTS "Anyone can view product variants" ON product_variants;
DROP POLICY IF EXISTS "Anyone can delete product variants" ON product_variants;
DROP POLICY IF EXISTS "Anyone can insert product variants" ON product_variants;
DROP POLICY IF EXISTS "Anyone can update product variants" ON product_variants;
DROP POLICY IF EXISTS "Public can read active product variants" ON product_variants;
-- Keep: "Authenticated users can manage product variants"

-- ============================================================================
-- PART 14: Projects and Documents
-- ============================================================================

-- projects: Remove duplicate
DROP POLICY IF EXISTS "Public can view active projects" ON projects;
-- Keep: "Authenticated users can view all projects"

-- quick_menu_documents: Remove duplicate
DROP POLICY IF EXISTS "Public can view active documents" ON quick_menu_documents;
-- Keep: "Authenticated users can view all documents"

-- ============================================================================
-- PART 15: Quote Requests
-- ============================================================================

-- quote_requests: Remove duplicate INSERT
DROP POLICY IF EXISTS "Anyone can submit quote requests" ON quote_requests;
-- Keep: "Anyone can insert quote requests"

-- ============================================================================
-- PART 16: Sliders
-- ============================================================================

-- slider_items: Clean up duplicates
DROP POLICY IF EXISTS "Anyone can manage slider items" ON slider_items;
DROP POLICY IF EXISTS "Anyone can view active slider items" ON slider_items;
DROP POLICY IF EXISTS "Public can read active slider items" ON slider_items;
DROP POLICY IF EXISTS "Authenticated users can delete slider items" ON slider_items;
DROP POLICY IF EXISTS "Authenticated users can insert slider items" ON slider_items;
DROP POLICY IF EXISTS "Authenticated users can update slider items" ON slider_items;
-- Keep: "Authenticated users can view all slider items"

-- Recreate necessary policies for slider_items
CREATE POLICY "Public can view active slider items" ON slider_items
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated can manage slider items" ON slider_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- sliders: Clean up duplicates
DROP POLICY IF EXISTS "Anyone can manage sliders" ON sliders;
DROP POLICY IF EXISTS "Anyone can view active sliders" ON sliders;
DROP POLICY IF EXISTS "Public can read active sliders" ON sliders;
DROP POLICY IF EXISTS "Authenticated users can delete sliders" ON sliders;
DROP POLICY IF EXISTS "Authenticated users can insert sliders" ON sliders;
DROP POLICY IF EXISTS "Authenticated users can update sliders" ON sliders;
-- Keep: "Authenticated users can view all sliders"

-- Recreate necessary policies for sliders
CREATE POLICY "Public can view active sliders" ON sliders
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated can manage sliders" ON sliders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 17: Translations
-- ============================================================================

-- translations: Remove duplicate (keep one for all roles)
DROP POLICY IF EXISTS "Anyone can view translations" ON translations;
-- Keep: "Public can read translations"

-- ============================================================================
-- COMPLETION SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'RLS Policy Consolidation completed!';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '- Consolidated duplicate policies across 40+ tables';
  RAISE NOTICE '- Removed redundant permissive policies';
  RAISE NOTICE '- Simplified security model for easier auditing';
  RAISE NOTICE '- Maintained or improved security posture';
  RAISE NOTICE '=======================================================';
END $$;
