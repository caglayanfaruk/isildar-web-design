import { supabase } from '../lib/supabase';
import { translate } from './unifiedTranslationService';

export interface ProductDetail {
  id: string;
  sku: string;
  category_id: string;
  product_type: string;
  status: string;
  featured: boolean;
  specifications: any;
  features: string[];
  applications: string[];
  dimensions?: string;
  weight?: number;
  shrink_volume?: number;
  shrink_measurement?: string;
  quantity_per_box?: number;
  quantity_per_shrink?: number;
  brand?: string;
  model?: string;
  warranty_period?: number;
  certifications?: string[];
  technical_specs?: any;
  meta_title?: string;
  meta_description?: string;
  translations?: {
    name: string;
    short_description: string;
    long_description: string;
  };
  category?: {
    id: string;
    slug: string;
    translations?: {
      name: string;
    };
  };
  images?: Array<{
    id: string;
    media_id: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
    media?: {
      url: string;
      alt_text?: string;
    };
  }>;
  variants?: Array<{
    id: string;
    sku: string;
    is_default: boolean;
    is_active: boolean;
    custom_fields?: {
      adi?: string;
      code?: string;
      box_pieces?: string;
      package_pieces?: string;
      package_volume?: string;
      package_weight?: string;
      [key: string]: any;
    };
    attributes?: Array<{
      attribute: {
        id: string;
        name: string;
        type: string;
      };
      attribute_value: {
        id: string;
        value: string;
        display_value: string;
        color_code?: string;
      };
    }>;
  }>;
  attributes?: Array<{
    attribute: {
      id: string;
      name: string;
      type: string;
    };
    attribute_value: {
      id: string;
      value: string;
      display_value: string;
      color_code?: string;
    };
  }>;
  documents?: Array<{
    id: string;
    name: string;
    description?: string;
    file_url: string;
    file_type: string;
    file_size: number;
    document_type: string;
    language_code: string;
  }>;
  export_info?: {
    export_countries: string[];
    standards: string[];
    packaging_info: string;
    delivery_time: string;
    special_notes?: string;
    incoterms?: string;
  };
  product_features?: Array<{
    feature_text: string;
    icon?: string;
    is_highlighted: boolean;
  }>;
  product_applications?: Array<{
    application_text: string;
    icon?: string;
  }>;
  product_certifications?: Array<{
    certification_name: string;
    certification_code: string;
    issuing_authority?: string;
  }>;
  product_specifications?: Array<{
    spec_key: string;
    spec_value: string;
    spec_unit?: string;
    is_highlighted: boolean;
  }>;
}

export const getProductDetails = async (
  productIdOrSlug: string,
  languageCode: string = 'tr'
): Promise<ProductDetail | null> => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(
          id,
          slug
        )
      `);

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);

    if (isUUID) {
      query = query.eq('id', productIdOrSlug);
    } else {
      query = query.or(`slug.eq.${productIdOrSlug},sku.eq.${productIdOrSlug}`);
    }

    const { data: products, error } = await query;

    if (error) throw error;
    if (!products || products.length === 0) return null;

    const product = products[0];

    // Türkçe çevirileri al
    const { data: trProductTranslations } = await supabase
      .from('translations')
      .select('*')
      .eq('language_code', 'tr')
      .in('translation_key', [
        `product.${product.id}.name`,
        `product.${product.id}.short_desc`,
        `product.${product.id}.long_desc`
      ]);

    const trProdMap: any = {};
    trProductTranslations?.forEach(t => {
      const key = t.translation_key.split('.').pop();
      trProdMap[key] = t.translation_value || t.source_text;
    });

    // Seçili dile çevir
    const [translatedName, translatedShortDesc, translatedLongDesc] = await Promise.all([
      translate(trProdMap.name || product.sku, languageCode, `product.${product.id}.name`, { type: 'product' }),
      translate(trProdMap.short_desc || '', languageCode, `product.${product.id}.short_desc`, { type: 'product' }),
      translate(trProdMap.long_desc || '', languageCode, `product.${product.id}.long_desc`, { type: 'product' })
    ]);

    // Kategori çevirisi
    let categoryName = '';
    if (product.category?.id) {
      const { data: trCatTrans } = await supabase
        .from('translations')
        .select('translation_value, source_text')
        .eq('language_code', 'tr')
        .eq('translation_key', `category.${product.category.slug}.name`)
        .maybeSingle();

      const turkishCatName = trCatTrans?.translation_value || trCatTrans?.source_text || '';
      categoryName = await translate(turkishCatName, languageCode, `category.${product.category.slug}.name`, { type: 'category' });
    }

    const [
      imagesData,
      productAttributesData,
      variantsData,
      documentsData,
      exportInfoData,
      featuresData,
      applicationsData,
      certificationsData,
      specificationsData
    ] = await Promise.all([

      supabase
        .from('product_images')
        .select(`
          *,
          media:media(url, alt_text)
        `)
        .eq('product_id', product.id)
        .is('variant_id', null)
        .order('sort_order'),

      supabase
        .from('product_attribute_assignments')
        .select(`
          attribute:product_attributes(id, name, type),
          attribute_value:product_attribute_values(id, value, display_value, color_code)
        `)
        .eq('product_id', product.id),

      supabase
        .from('product_variants')
        .select(`
          *,
          attributes:product_variant_attributes(
            attribute:product_attributes(id, name, type),
            attribute_value:product_attribute_values(id, value, display_value, color_code)
          )
        `)
        .eq('product_id', product.id)
        .eq('is_active', true)
        .order('sort_order'),

      supabase
        .from('product_documents')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_public', true)
        .order('sort_order'),

      supabase
        .from('product_export_info')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_active', true)
        .maybeSingle(),

      supabase
        .from('product_features')
        .select('*')
        .eq('product_id', product.id)
        .eq('language_code', languageCode)
        .order('display_order'),

      supabase
        .from('product_applications')
        .select('*')
        .eq('product_id', product.id)
        .eq('language_code', languageCode)
        .order('display_order'),

      supabase
        .from('product_certifications')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_active', true)
        .order('display_order'),

      supabase
        .from('product_specifications')
        .select('*')
        .eq('product_id', product.id)
        .order('display_order')
    ]);

    return {
      ...product,
      translations: {
        name: translatedName,
        short_description: translatedShortDesc,
        long_description: translatedLongDesc
      },
      category: product.category ? {
        ...product.category,
        translations: {
          name: categoryName
        }
      } : undefined,
      images: imagesData.data || [],
      attributes: productAttributesData.data || [],
      variants: variantsData.data || [],
      documents: documentsData.data || [],
      export_info: exportInfoData.data || undefined,
      product_features: featuresData.data || [],
      product_applications: applicationsData.data || [],
      product_certifications: certificationsData.data || [],
      product_specifications: specificationsData.data || []
    };
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
};

export const getProductBySKU = async (
  sku: string,
  languageCode: string = 'tr'
): Promise<ProductDetail | null> => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    if (!product) return null;

    return getProductDetails(product.id, languageCode);
  } catch (error) {
    console.error('Error fetching product by SKU:', error);
    return null;
  }
};

export interface SearchResult {
  id: string;
  type: 'product' | 'category';
  sku: string;
  slug?: string;
  name: string;
  categoryName?: string;
  categoryId?: string;
}

export const searchProducts = async (
  query: string,
  languageCode: string = 'tr'
): Promise<SearchResult[]> => {
  try {
    if (query.trim().length < 2) return [];

    const searchTerm = query.toLowerCase();
    const results: SearchResult[] = [];
    const addedIds = new Set<string>();

    const [productsBySku, productTranslations] = await Promise.all([
      supabase
        .from('products')
        .select('id, sku, slug, category_id')
        .eq('status', 'active')
        .ilike('sku', `%${searchTerm}%`)
        .limit(10),

      supabase
        .from('translations')
        .select('translation_key, translation_value, source_text')
        .eq('language_code', languageCode)
        .like('translation_key', 'product.%.name')
        .ilike('translation_value', `%${searchTerm}%`)
        .limit(20)
    ]);

    if (productsBySku.data) {
      const productIds = productsBySku.data.map(p => p.id);
      const { data: translations } = await supabase
        .from('translations')
        .select('translation_key, translation_value, source_text')
        .eq('language_code', languageCode)
        .in('translation_key', productIds.map(id => `product.${id}.name`));

      const translationMap = new Map();
      translations?.forEach(t => {
        const productId = t.translation_key.split('.')[1];
        translationMap.set(productId, t.translation_value || t.source_text);
      });

      for (const product of productsBySku.data) {
        const productName = translationMap.get(product.id) || product.sku;
        addedIds.add(product.id);
        results.push({
          id: product.id,
          type: 'product',
          sku: product.sku,
          slug: product.slug || product.sku,
          name: productName,
          categoryId: product.category_id
        });
      }
    }

    if (productTranslations.data) {
      const matchedProductIds = productTranslations.data
        .map(t => t.translation_key.split('.')[1])
        .filter(id => {
          const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
          return isValidUuid && !addedIds.has(id);
        });

      if (matchedProductIds.length > 0) {
        const { data: matchedProducts } = await supabase
          .from('products')
          .select('id, sku, slug, category_id')
          .eq('status', 'active')
          .in('id', matchedProductIds);

        if (matchedProducts) {
          for (const product of matchedProducts) {
            const trans = productTranslations.data.find(t => t.translation_key === `product.${product.id}.name`);
            if (trans && !addedIds.has(product.id)) {
              addedIds.add(product.id);
              results.push({
                id: product.id,
                type: 'product',
                sku: product.sku,
                slug: product.slug || product.sku,
                name: trans.translation_value || trans.source_text,
                categoryId: product.category_id
              });
            }
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};
