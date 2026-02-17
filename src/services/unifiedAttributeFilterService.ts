import { supabase } from '../lib/supabase';
import { translate } from './unifiedTranslationService';

export interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  display_value: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface AttributeFilter {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  filter_category: string;
  input_type: string;
  visible: boolean;
  show_in_sidebar: boolean;
  values: AttributeValue[];
}

export const unifiedAttributeFilterService = {
  /**
   * Get all filterable attributes with their values
   * Uses the unified product_attributes system
   */
  async getFilterableAttributes(languageCode: string = 'tr'): Promise<AttributeFilter[]> {
    // Get all filterable attributes
    const { data: attributes, error: attrsError } = await supabase
      .from('product_attributes')
      .select('*')
      .eq('is_filterable', true)
      .eq('is_active', true)
      .eq('visible', true)
      .order('sort_order', { ascending: true });

    if (attrsError) {
      console.error('Error fetching attributes:', attrsError);
      throw attrsError;
    }

    // Get values for each attribute
    const attributesWithValues = await Promise.all(
      (attributes || []).map(async (attr) => {
        const { data: values, error: valuesError } = await supabase
          .from('product_attribute_values')
          .select('*')
          .eq('attribute_id', attr.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (valuesError) {
          console.error('Error fetching attribute values:', valuesError);
          return { ...attr, values: [] };
        }

        // Translate attribute name
        const translatedName = await translate(
          attr.name,
          languageCode,
          `attribute.${attr.slug}.name`,
          { type: 'attribute' }
        );

        // Translate values
        const translatedValues = await Promise.all(
          (values || []).map(async (value) => {
            const translatedValue = await translate(
              value.value,
              languageCode,
              `attribute.${attr.slug}.value.${value.value}`,
              { type: 'attribute_value' }
            );

            return {
              ...value,
              display_value: translatedValue
            };
          })
        );

        return {
          id: attr.id,
          name: translatedName,
          slug: attr.slug,
          icon: attr.icon || 'Tag',
          sort_order: attr.sort_order || 0,
          filter_category: attr.filter_category || 'specification',
          input_type: attr.input_type || 'select',
          visible: attr.visible !== false,
          show_in_sidebar: attr.show_in_sidebar !== false,
          values: translatedValues
        };
      })
    );

    // Filter out attributes with no values and sort by category
    return attributesWithValues
      .filter(attr => attr.values.length > 0)
      .sort((a, b) => {
        // Sort by category first (specification before feature)
        const catOrder: any = { specification: 1, feature: 2 };
        const catDiff = (catOrder[a.filter_category] || 3) - (catOrder[b.filter_category] || 3);
        if (catDiff !== 0) return catDiff;

        // Then by sort_order
        return a.sort_order - b.sort_order;
      });
  },

  /**
   * Get relevant filters for a set of products
   * Only returns filters that have values assigned to the products
   */
  async getRelevantFiltersForProducts(
    productIds: string[],
    languageCode: string = 'tr'
  ): Promise<AttributeFilter[]> {
    if (productIds.length === 0) {
      return [];
    }

    // Get all assignments for these products
    const { data: assignments, error: assignError } = await supabase
      .from('product_attribute_assignments')
      .select('attribute_id, attribute_value_id')
      .in('product_id', productIds);

    if (assignError) {
      console.error('Error fetching attribute assignments:', assignError);
      return [];
    }

    // Get unique attribute value IDs
    const valueIds = new Set((assignments || []).map(a => a.attribute_value_id));

    if (valueIds.size === 0) {
      return [];
    }

    // Get all attributes with their values
    const allFilters = await this.getFilterableAttributes(languageCode);

    // Filter to only show attributes that have values used by these products
    return allFilters
      .map(filter => ({
        ...filter,
        values: filter.values.filter(v => valueIds.has(v.id))
      }))
      .filter(filter => filter.values.length > 0);
  },

  /**
   * Get attribute value IDs for a product
   */
  async getProductAttributeValues(productId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('product_attribute_assignments')
      .select('attribute_value_id')
      .eq('product_id', productId);

    if (error) {
      console.error('Error fetching product attribute values:', error);
      return [];
    }

    return (data || []).map(d => d.attribute_value_id);
  },

  /**
   * Get subcategories for a parent category
   */
  async getSubCategories(parentCategoryId: string, languageCode: string = 'tr'): Promise<any[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentCategoryId)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }

    // Translate category names
    const translatedCategories = await Promise.all(
      (data || []).map(async (cat) => {
        // First get Turkish translation
        const { data: trTranslation } = await supabase
          .from('translations')
          .select('*')
          .eq('language_code', 'tr')
          .eq('translation_key', `category.${cat.slug}.name`)
          .maybeSingle();

        const turkishName = trTranslation?.translation_value || trTranslation?.source_text || cat.slug;

        // Then translate to target language
        const translatedName = await translate(
          turkishName,
          languageCode,
          `category.${cat.slug}.name`,
          { type: 'category' }
        );

        const { data: trDesc } = await supabase
          .from('translations')
          .select('*')
          .eq('language_code', 'tr')
          .eq('translation_key', `category.${cat.slug}.description`)
          .maybeSingle();

        const turkishDesc = trDesc?.translation_value || trDesc?.source_text || '';

        const translatedDesc = await translate(
          turkishDesc,
          languageCode,
          `category.${cat.slug}.description`,
          { type: 'category' }
        );

        // Get category image if exists
        let imageUrl = null;
        if (cat.icon) {
          const { data: mediaData } = await supabase
            .from('media')
            .select('url')
            .eq('id', cat.icon)
            .maybeSingle();
          imageUrl = mediaData?.url;
        }

        return {
          ...cat,
          name: translatedName,
          description: translatedDesc,
          imageUrl
        };
      })
    );

    return translatedCategories;
  }
};
