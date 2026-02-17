import { supabase } from '../lib/supabase';

export interface FilterOption {
  id: string;
  filter_group_id: string;
  name: string;
  slug: string;
  order: number;
  visible: boolean;
}

export interface FilterGroup {
  id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
  visible: boolean;
  options: FilterOption[];
}

export interface FilterTranslation {
  id: string;
  filter_group_id?: string;
  filter_option_id?: string;
  language_code: string;
  name: string;
}

export const productFilterService = {
  async getFilterGroups(): Promise<FilterGroup[]> {
    const { data: groups, error: groupsError } = await supabase
      .from('product_filter_groups')
      .select('*')
      .eq('visible', true)
      .order('order', { ascending: true });

    if (groupsError) {
      console.error('Error fetching filter groups:', groupsError);
      throw groupsError;
    }

    const groupsWithOptions = await Promise.all(
      (groups || []).map(async (group) => {
        const { data: options, error: optionsError } = await supabase
          .from('product_filter_options')
          .select('*')
          .eq('filter_group_id', group.id)
          .eq('visible', true)
          .order('order', { ascending: true });

        if (optionsError) {
          console.error('Error fetching filter options:', optionsError);
          return { ...group, options: [] };
        }

        return {
          ...group,
          options: options || []
        };
      })
    );

    return groupsWithOptions;
  },

  async getFilterGroupsWithTranslations(languageCode: string = 'tr'): Promise<FilterGroup[]> {
    const groups = await this.getFilterGroups();

    const { data: groupTranslations } = await supabase
      .from('product_filter_translations')
      .select('*')
      .eq('language_code', languageCode)
      .not('filter_group_id', 'is', null);

    const { data: optionTranslations } = await supabase
      .from('product_filter_translations')
      .select('*')
      .eq('language_code', languageCode)
      .not('filter_option_id', 'is', null);

    const groupTranslationMap = new Map(
      (groupTranslations || []).map(t => [t.filter_group_id, t.name])
    );

    const optionTranslationMap = new Map(
      (optionTranslations || []).map(t => [t.filter_option_id, t.name])
    );

    return groups.map(group => ({
      ...group,
      name: groupTranslationMap.get(group.id) || group.name,
      options: group.options.map(option => ({
        ...option,
        name: optionTranslationMap.get(option.id) || option.name
      }))
    }));
  },

  async getSubCategories(parentCategoryId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*, image:image_id(url)')
      .eq('parent_id', parentCategoryId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }

    const categoriesWithTranslations = await Promise.all(
      (data || []).map(async (category) => {
        const { data: translations } = await supabase
          .from('translations')
          .select('*')
          .eq('language_code', 'tr')
          .in('translation_key', [
            `category.${category.slug}.name`,
            `category.${category.slug}.description`
          ]);

        const translationMap: any = {};
        translations?.forEach(t => {
          const key = t.translation_key.split('.').pop();
          translationMap[key] = t.translation_value;
        });

        return {
          ...category,
          name: translationMap.name || category.slug,
          description: translationMap.description || category.description,
          imageUrl: (category.image as any)?.url || null
        };
      })
    );

    return categoriesWithTranslations;
  },

  async getProductsByFilters(
    categoryId: string,
    filterOptionIds: string[]
  ): Promise<any[]> {
    if (filterOptionIds.length === 0) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .eq('status', 'active')
        .order('sort_order');

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      return data || [];
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        filter_values:product_filter_values(filter_option_id)
      `)
      .eq('category_id', categoryId)
      .eq('status', 'active')
      .order('sort_order');

    if (error) {
      console.error('Error fetching products with filters:', error);
      throw error;
    }

    const filteredProducts = (data || []).filter((product: any) => {
      const productFilterIds = product.filter_values?.map(
        (fv: any) => fv.filter_option_id
      ) || [];

      return filterOptionIds.every(filterId =>
        productFilterIds.includes(filterId)
      );
    });

    return filteredProducts;
  },

  async addFilterToProduct(productId: string, filterOptionId: string): Promise<void> {
    const { error } = await supabase
      .from('product_filter_values')
      .insert([
        {
          product_id: productId,
          filter_option_id: filterOptionId
        }
      ]);

    if (error) {
      console.error('Error adding filter to product:', error);
      throw error;
    }
  },

  async removeFilterFromProduct(productId: string, filterOptionId: string): Promise<void> {
    const { error } = await supabase
      .from('product_filter_values')
      .delete()
      .eq('product_id', productId)
      .eq('filter_option_id', filterOptionId);

    if (error) {
      console.error('Error removing filter from product:', error);
      throw error;
    }
  },

  async createFilterGroup(group: Omit<FilterGroup, 'id' | 'options'>): Promise<FilterGroup> {
    const { data, error } = await supabase
      .from('product_filter_groups')
      .insert([group])
      .select()
      .single();

    if (error) {
      console.error('Error creating filter group:', error);
      throw error;
    }

    return { ...data, options: [] };
  },

  async createFilterOption(option: Omit<FilterOption, 'id'>): Promise<FilterOption> {
    const { data, error } = await supabase
      .from('product_filter_options')
      .insert([option])
      .select()
      .single();

    if (error) {
      console.error('Error creating filter option:', error);
      throw error;
    }

    return data;
  },

  async updateFilterGroup(id: string, updates: Partial<FilterGroup>): Promise<FilterGroup> {
    const { data, error } = await supabase
      .from('product_filter_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating filter group:', error);
      throw error;
    }

    return { ...data, options: [] };
  },

  async updateFilterOption(id: string, updates: Partial<FilterOption>): Promise<FilterOption> {
    const { data, error } = await supabase
      .from('product_filter_options')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating filter option:', error);
      throw error;
    }

    return data;
  },

  async deleteFilterGroup(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_filter_groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting filter group:', error);
      throw error;
    }
  },

  async deleteFilterOption(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_filter_options')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting filter option:', error);
      throw error;
    }
  }
};
