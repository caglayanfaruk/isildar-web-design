import { supabase } from '../lib/supabase';

interface TranslateOptions {
  sourceLanguage?: string;
  targetLanguage: string;
}

const translateCache = new Map<string, string>();

export const autoTranslateText = async (
  text: string | null | undefined,
  options: TranslateOptions
): Promise<string> => {
  if (!text) return '';

  const { sourceLanguage = 'tr', targetLanguage } = options;

  if (targetLanguage === 'tr' || targetLanguage === sourceLanguage) {
    return text;
  }

  const cacheKey = `${sourceLanguage}-${targetLanguage}:${text}`;

  if (translateCache.has(cacheKey)) {
    return translateCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.translations?.translatedText) {
        const translated = data.translations.translatedText;
        translateCache.set(cacheKey, translated);
        return translated;
      }
    }
  } catch (error) {
    console.error('Auto translate error:', error);
  }

  return text;
};

export const autoTranslateProduct = async (
  product: any,
  targetLanguage: string
): Promise<any> => {
  if (targetLanguage === 'tr') {
    return product;
  }

  const translatedProduct = { ...product };

  if (!product.translations && product.sku) {
    const turkishName = product.name || product.sku;
    const turkishShortDesc = product.short_description || '';
    const turkishLongDesc = product.long_description || '';

    const { data: existingTrans } = await supabase
      .from('product_translations')
      .select('*')
      .eq('product_id', product.id)
      .eq('language_code', targetLanguage)
      .maybeSingle();

    if (existingTrans) {
      translatedProduct.translations = {
        name: existingTrans.name,
        short_description: existingTrans.short_description,
        long_description: existingTrans.long_description
      };
    } else {
      const [name, shortDesc, longDesc] = await Promise.all([
        autoTranslateText(turkishName, { targetLanguage }),
        autoTranslateText(turkishShortDesc, { targetLanguage }),
        autoTranslateText(turkishLongDesc, { targetLanguage })
      ]);

      await supabase
        .from('product_translations')
        .insert({
          product_id: product.id,
          language_code: targetLanguage,
          name,
          short_description: shortDesc,
          long_description: longDesc
        })
        .onConflict('product_id,language_code')
        .merge();

      translatedProduct.translations = {
        name,
        short_description: shortDesc,
        long_description: longDesc
      };
    }
  }

  return translatedProduct;
};

export const autoTranslateCategory = async (
  category: any,
  targetLanguage: string
): Promise<any> => {
  if (targetLanguage === 'tr') {
    return category;
  }

  const translatedCategory = { ...category };

  if (!category.translations && category.slug) {
    const turkishName = category.name || category.slug;
    const turkishDesc = category.description || '';

    const { data: existingTrans } = await supabase
      .from('category_translations')
      .select('*')
      .eq('category_id', category.id)
      .eq('language_code', targetLanguage)
      .maybeSingle();

    if (existingTrans) {
      translatedCategory.translations = {
        name: existingTrans.name,
        description: existingTrans.description
      };
    } else {
      const [name, description] = await Promise.all([
        autoTranslateText(turkishName, { targetLanguage }),
        autoTranslateText(turkishDesc, { targetLanguage })
      ]);

      await supabase
        .from('category_translations')
        .insert({
          category_id: category.id,
          language_code: targetLanguage,
          name,
          description
        })
        .onConflict('category_id,language_code')
        .merge();

      translatedCategory.translations = {
        name,
        description
      };
    }
  }

  return translatedCategory;
};

export const autoTranslateBatch = async (
  items: Array<{ id: string; text: string; type: 'product' | 'category' }>,
  targetLanguage: string
): Promise<Map<string, string>> => {
  const result = new Map<string, string>();

  if (targetLanguage === 'tr') {
    items.forEach(item => result.set(item.id, item.text));
    return result;
  }

  const textsToTranslate = items.map(item => item.text);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          text: textsToTranslate,
          targetLanguage,
          sourceLanguage: 'tr'
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.translations) {
        items.forEach((item, index) => {
          const translatedText = data.translations[index]?.translatedText || item.text;
          result.set(item.id, translatedText);
        });
      }
    }
  } catch (error) {
    console.error('Batch translate error:', error);
    items.forEach(item => result.set(item.id, item.text));
  }

  return result;
};
