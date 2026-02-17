import { supabase } from '../lib/supabase';

const translationCache = new Map<string, string>();

export const translateDynamicContent = async (
  text: string,
  key: string,
  currentLanguage: string
): Promise<string> => {
  if (currentLanguage === 'tr') {
    return text;
  }

  const cacheKey = `${currentLanguage}:${key}`;

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  const { data: existing } = await supabase
    .from('translations')
    .select('translation_value')
    .eq('language_code', currentLanguage)
    .eq('translation_key', key)
    .maybeSingle();

  if (existing?.translation_value) {
    translationCache.set(cacheKey, existing.translation_value);
    return existing.translation_value;
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
          targetLanguage: currentLanguage,
          sourceLanguage: 'tr'
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.translations?.translatedText) {
        const translatedText = data.translations.translatedText;

        await supabase
          .from('translations')
          .insert({
            language_code: currentLanguage,
            translation_key: key,
            translation_value: translatedText,
            context: 'dynamic_content'
          })
          .onConflict('language_code,translation_key')
          .merge();

        translationCache.set(cacheKey, translatedText);
        return translatedText;
      }
    }
  } catch (error) {
    console.error('Translation error:', error);
  }

  return text;
};

export const translateBatch = async (
  items: Array<{ text: string; key: string }>,
  currentLanguage: string
): Promise<Map<string, string>> => {
  const result = new Map<string, string>();

  if (currentLanguage === 'tr') {
    items.forEach(item => result.set(item.key, item.text));
    return result;
  }

  const keys = items.map(item => item.key);
  const { data: existing } = await supabase
    .from('translations')
    .select('translation_key, translation_value')
    .eq('language_code', currentLanguage)
    .in('translation_key', keys);

  const existingMap = new Map<string, string>();
  existing?.forEach(t => existingMap.set(t.translation_key, t.translation_value));

  const needsTranslation = items.filter(item => !existingMap.has(item.key));

  if (needsTranslation.length === 0) {
    items.forEach(item => {
      result.set(item.key, existingMap.get(item.key) || item.text);
    });
    return result;
  }

  const batchSize = 50;
  for (let i = 0; i < needsTranslation.length; i += batchSize) {
    const batch = needsTranslation.slice(i, i + batchSize);
    const textsToTranslate = batch.map(item => item.text);

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
            targetLanguage: currentLanguage,
            sourceLanguage: 'tr'
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.translations) {
          const translationsToInsert = batch.map((item, index) => {
            const translatedText = data.translations[index]?.translatedText || item.text;
            existingMap.set(item.key, translatedText);
            return {
              language_code: currentLanguage,
              translation_key: item.key,
              translation_value: translatedText,
              context: 'dynamic_content'
            };
          });

          await supabase
            .from('translations')
            .upsert(translationsToInsert, {
              onConflict: 'language_code,translation_key'
            });
        }
      }
    } catch (error) {
      console.error('Batch translation error:', error);
      batch.forEach(item => {
        if (!existingMap.has(item.key)) {
          existingMap.set(item.key, item.text);
        }
      });
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  items.forEach(item => {
    result.set(item.key, existingMap.get(item.key) || item.text);
  });

  return result;
};

export const clearTranslationCache = () => {
  translationCache.clear();
};
