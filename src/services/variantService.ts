import { supabase } from '../lib/supabase';
import { translate } from './unifiedTranslationService';

export interface VariantDetail {
  id: string;
  product_id: string;
  sku: string;
  barcode?: string;
  price?: number;
  compare_price?: number;
  dimensions?: string;
  weight?: number;
  box_pieces?: number;
  package_pieces?: number;
  package_volume?: number;
  package_weight?: number;
  is_default: boolean;
  is_active: boolean;
  product?: {
    id: string;
    sku: string;
    brand?: string;
    model?: string;
    translations?: {
      name: string;
      short_description: string;
      long_description: string;
    };
  };
  product_features?: Array<{
    feature_text: string;
  }>;
  product_applications?: Array<{
    application_text: string;
  }>;
  product_specifications?: Array<{
    spec_key: string;
    spec_value: string;
    spec_unit?: string;
  }>;
  product_certifications?: Array<{
    certification_code: string;
    certification_name: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    file_url: string;
    file_type: string;
    file_size: number;
  }>;
  export_info?: {
    hs_code: string;
    country_of_origin: string;
    export_description?: string;
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
  images?: Array<{
    media_id: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
    media?: {
      id: string;
      url: string;
      filename: string;
      original_name: string;
    };
  }>;
  inventory?: {
    id: string;
    quantity: number;
    reserved_quantity: number;
    low_stock_threshold: number;
    track_inventory: boolean;
    allow_backorder: boolean;
    location: string;
  };
  price_tiers?: Array<{
    id: string;
    min_quantity: number;
    max_quantity?: number;
    price: number;
    currency: string;
  }>;
  other_variants?: Array<{
    id: string;
    sku: string;
    price?: number;
    box_pieces?: number;
    package_pieces?: number;
    package_volume?: number;
    package_weight?: number;
    is_default: boolean;
    custom_fields?: any;
    attributes?: Array<{
      attribute: {
        name: string;
      };
      attribute_value: {
        value: string;
        display_value: string;
      };
    }>;
  }>;
  variant_name?: string;
  custom_fields?: {
    adi?: string;
    code?: string;
    box_pieces?: string;
    package_pieces?: string;
    package_volume?: string;
    package_weight?: string;
    [key: string]: any;
  };
  category?: {
    id: string;
    variant_fields?: {
      fields: Array<{
        key: string;
        label_tr: string;
        label_en: string;
        unit?: string;
      }>;
    };
  };
}

export const getVariantDetails = async (
  variantCode: string,
  languageCode: string = 'tr'
): Promise<VariantDetail | null> => {
  try {
    const { data: variant, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        product:products(
          id,
          sku,
          brand,
          model,
          category_id
        ),
        attributes:product_variant_attributes(
          attribute:product_attributes(id, name, type),
          attribute_value:product_attribute_values(id, value, display_value, color_code)
        ),
        inventory:inventory(*),
        price_tiers:price_tiers(*)
      `)
      .eq('sku', variantCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!variant) return null;

    // Türkçe ürün çevirisini al
    const { data: trProductTrans } = await supabase
      .from('translations')
      .select('*')
      .eq('language_code', 'tr')
      .in('translation_key', [
        `product.${variant.product_id}.name`,
        `product.${variant.product_id}.short_desc`,
        `product.${variant.product_id}.long_desc`
      ]);

    const trProdMap: any = {};
    trProductTrans?.forEach(t => {
      const key = t.translation_key.split('.').pop();
      trProdMap[key] = t.translation_value || t.source_text;
    });

    // Seçili dile çevir
    const [translatedProductName, translatedProductShortDesc, translatedProductLongDesc] = await Promise.all([
      translate(trProdMap.name || variant.product?.sku || '', languageCode, `product.${variant.product_id}.name`, { type: 'product' }),
      translate(trProdMap.short_desc || '', languageCode, `product.${variant.product_id}.short_desc`, { type: 'product' }),
      translate(trProdMap.long_desc || '', languageCode, `product.${variant.product_id}.long_desc`, { type: 'product' })
    ]);

    const [
      categoryData,
      variantImagesData,
      productImagesData,
      otherVariantsData,
      productFeaturesData,
      productApplicationsData,
      productSpecificationsData,
      productCertificationsData,
      productDocumentsData,
      exportInfoData
    ] = await Promise.all([
      variant.product?.category_id
        ? supabase
            .from('categories')
            .select('id, variant_fields')
            .eq('id', variant.product.category_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),

      supabase
        .from('product_variant_media')
        .select(`
          media_id,
          alt_text,
          is_primary,
          sort_order,
          media:media_id(
            id,
            url,
            filename,
            original_name
          )
        `)
        .eq('variant_id', variant.id)
        .order('sort_order'),

      supabase
        .from('product_images')
        .select(`
          *,
          media:media(url, alt_text)
        `)
        .eq('product_id', variant.product_id)
        .is('variant_id', null)
        .order('sort_order'),

      supabase
        .from('product_variants')
        .select(`
          id,
          sku,
          price,
          box_pieces,
          package_pieces,
          package_volume,
          package_weight,
          is_default,
          custom_fields,
          attributes:product_variant_attributes(
            attribute:product_attributes(name),
            attribute_value:product_attribute_values(value, display_value)
          )
        `)
        .eq('product_id', variant.product_id)
        .eq('is_active', true)
        .neq('id', variant.id)
        .order('sort_order'),

      supabase
        .from('product_features')
        .select('feature_text')
        .eq('product_id', variant.product_id)
        .order('display_order'),

      supabase
        .from('product_applications')
        .select('application_text')
        .eq('product_id', variant.product_id)
        .order('display_order'),

      supabase
        .from('product_specifications')
        .select('spec_key, spec_value, spec_unit')
        .eq('product_id', variant.product_id)
        .order('display_order'),

      supabase
        .from('product_certifications')
        .select('certification_code, certification_name')
        .eq('product_id', variant.product_id),

      supabase
        .from('product_documents')
        .select('id, name, file_url, file_type, file_size')
        .eq('product_id', variant.product_id),

      supabase
        .from('product_export_info')
        .select('hs_code, export_countries, standards, packaging_info, delivery_time, special_notes, incoterms')
        .eq('product_id', variant.product_id)
        .maybeSingle()
    ]);

    const images = variantImagesData.data && variantImagesData.data.length > 0
      ? variantImagesData.data
      : productImagesData.data || [];

    // Build variant name from product name and attributes/custom_fields
    let variantName = '';
    if (translatedProductName) {
      variantName = translatedProductName;

      // Try attributes first
      if (variant.attributes && variant.attributes.length > 0) {
        const attrValues = variant.attributes
          .map((attr: any) => attr.attribute_value.display_value || attr.attribute_value.value)
          .filter(Boolean)
          .join(' - ');
        if (attrValues) {
          variantName += ' - ' + attrValues;
        }
      }
      // If no attributes, try custom_fields.adi (name field)
      else if (variant.custom_fields?.adi) {
        variantName += ' - ' + variant.custom_fields.adi;
      }
    }

    const documents = productDocumentsData.data?.map(doc => ({
      id: doc.id,
      name: doc.name,
      file_url: doc.file_url || '',
      file_type: doc.file_type,
      file_size: doc.file_size
    })) || [];

    return {
      ...variant,
      variant_name: variantName,
      category: categoryData.data || undefined,
      product: variant.product ? {
        ...variant.product,
        translations: {
          name: translatedProductName,
          short_description: translatedProductShortDesc,
          long_description: translatedProductLongDesc
        }
      } : undefined,
      images,
      other_variants: otherVariantsData.data || [],
      product_features: productFeaturesData.data || [],
      product_applications: productApplicationsData.data || [],
      product_specifications: productSpecificationsData.data || [],
      product_certifications: productCertificationsData.data || [],
      documents,
      export_info: exportInfoData.data || undefined
    };
  } catch (error) {
    console.error('Error fetching variant details:', error);
    return null;
  }
};

export const getVariantsByProduct = async (
  productId: string
): Promise<VariantDetail[]> => {
  try {
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        attributes:product_variant_attributes(
          attribute:product_attributes(id, name, type),
          attribute_value:product_attribute_values(id, value, display_value, color_code)
        ),
        inventory:inventory(*)
      `)
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return variants || [];
  } catch (error) {
    console.error('Error fetching variants:', error);
    return [];
  }
};
