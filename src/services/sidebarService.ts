import { supabase } from '../lib/supabase';

export interface SidebarItem {
  id: string;
  parent_id: string | null;
  title: string;
  icon: string;
  path: string | null;
  order: number;
  visible: boolean;
  permissions: string[];
  children?: SidebarItem[];
}

export interface SidebarTranslation {
  id: string;
  sidebar_item_id: string;
  language_code: string;
  title: string;
}

export const sidebarService = {
  async getSidebarItems(): Promise<SidebarItem[]> {
    const { data, error } = await supabase
      .from('admin_sidebar_items')
      .select('*')
      .eq('visible', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching sidebar items:', error);
      throw error;
    }

    return this.buildHierarchy(data || []);
  },

  async getSidebarItemsWithTranslations(languageCode: string = 'tr'): Promise<SidebarItem[]> {
    const { data: items, error: itemsError } = await supabase
      .from('admin_sidebar_items')
      .select(`
        *,
        translations:admin_sidebar_translations(*)
      `)
      .eq('visible', true)
      .order('order', { ascending: true });

    if (itemsError) {
      console.error('Error fetching sidebar items:', itemsError);
      throw itemsError;
    }

    const translatedItems = (items || []).map((item: any) => {
      const translation = item.translations?.find(
        (t: any) => t.language_code === languageCode
      );
      return {
        ...item,
        title: translation?.title || item.title,
        translations: undefined
      };
    });

    return this.buildHierarchy(translatedItems);
  },

  buildHierarchy(items: any[]): SidebarItem[] {
    const itemMap = new Map<string, SidebarItem>();
    const rootItems: SidebarItem[] = [];

    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    items.forEach(item => {
      const currentItem = itemMap.get(item.id);
      if (!currentItem) return;

      if (item.parent_id) {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(currentItem);
        }
      } else {
        rootItems.push(currentItem);
      }
    });

    return rootItems;
  },

  async createSidebarItem(item: Omit<SidebarItem, 'id'>): Promise<SidebarItem> {
    const { data, error } = await supabase
      .from('admin_sidebar_items')
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error('Error creating sidebar item:', error);
      throw error;
    }

    return data;
  },

  async updateSidebarItem(id: string, updates: Partial<SidebarItem>): Promise<SidebarItem> {
    const { data, error } = await supabase
      .from('admin_sidebar_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sidebar item:', error);
      throw error;
    }

    return data;
  },

  async deleteSidebarItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('admin_sidebar_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting sidebar item:', error);
      throw error;
    }
  },

  async updateSidebarOrder(items: { id: string; order: number }[]): Promise<void> {
    const updates = items.map(item =>
      supabase
        .from('admin_sidebar_items')
        .update({ order: item.order })
        .eq('id', item.id)
    );

    await Promise.all(updates);
  },

  async createTranslation(translation: Omit<SidebarTranslation, 'id'>): Promise<SidebarTranslation> {
    const { data, error } = await supabase
      .from('admin_sidebar_translations')
      .insert([translation])
      .select()
      .single();

    if (error) {
      console.error('Error creating sidebar translation:', error);
      throw error;
    }

    return data;
  },

  async updateTranslation(
    sidebarItemId: string,
    languageCode: string,
    title: string
  ): Promise<SidebarTranslation> {
    const { data, error } = await supabase
      .from('admin_sidebar_translations')
      .upsert({
        sidebar_item_id: sidebarItemId,
        language_code: languageCode,
        title: title
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating sidebar translation:', error);
      throw error;
    }

    return data;
  }
};
