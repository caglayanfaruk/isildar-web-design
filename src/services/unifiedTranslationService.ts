import { supabase } from '../lib/supabase';

const cache = new Map<string, string>();

interface TranslationOptions {
  type?: string;
  forceRefresh?: boolean;
}

/**
 * TEK BİRLEŞİK ÇEVİRİ FONKSİYONU
 *
 * Kullanım:
 * - translate('Aydınlatma', 'en', 'category.lighting')
 * - translate('LED Panel', 'fr', 'product.led_panel.name')
 *
 * Nasıl Çalışır:
 * 1. Cache'de var mı kontrol et
 * 2. Veritabanında var mı kontrol et
 * 3. Yoksa Google Translate API'ye gönder
 * 4. Sonucu veritabanına kaydet ve cache'e al
 */
export async function translate(
  turkishText: string,
  targetLanguage: string,
  translationKey: string,
  options: TranslationOptions = {}
): Promise<string> {
  // Türkçe ise direkt döndür
  if (targetLanguage === 'tr') {
    return turkishText;
  }

  // Boş metin kontrolü
  if (!turkishText || turkishText.trim() === '') {
    return '';
  }

  const cacheKey = `${targetLanguage}:${translationKey}`;

  // 1. Cache'de var mı?
  if (!options.forceRefresh && cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // 2. Veritabanında var mı?
  const { data: existing } = await supabase
    .from('translations')
    .select('translation_value')
    .eq('language_code', targetLanguage)
    .eq('translation_key', translationKey)
    .maybeSingle();

  if (existing?.translation_value) {
    cache.set(cacheKey, existing.translation_value);
    return existing.translation_value;
  }

  // 3. Google Translate API'ye gönder
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
          text: turkishText,
          targetLanguage,
          sourceLanguage: 'tr'
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.translations?.translatedText) {
        const translatedText = data.translations.translatedText;

        // 4. Veritabanına kaydet
        await supabase
          .from('translations')
          .upsert({
            language_code: targetLanguage,
            translation_key: translationKey,
            translation_value: translatedText,
            source_text: turkishText,
            translation_type: options.type || 'dynamic',
            auto_translated: true,
            context: options.type || ''
          }, {
            onConflict: 'language_code,translation_key'
          });

        // 5. Cache'e al
        cache.set(cacheKey, translatedText);
        return translatedText;
      }
    }
  } catch (error) {
    console.error('Translation error:', error);
  }

  // Hata durumunda orijinal metni döndür
  return turkishText;
}

/**
 * TOPLU ÇEVİRİ FONKSİYONU
 *
 * Kullanım:
 * const items = [
 *   { key: 'cat_1', text: 'Aydınlatma' },
 *   { key: 'cat_2', text: 'Elektrik' }
 * ];
 * const result = await translateBatch(items, 'en', 'category');
 * // result.get('cat_1') => 'Lighting'
 */
export async function translateBatch(
  items: Array<{ key: string; text: string }>,
  targetLanguage: string,
  translationType: string = 'dynamic'
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  // Türkçe ise direkt döndür
  if (targetLanguage === 'tr') {
    items.forEach(item => result.set(item.key, item.text));
    return result;
  }

  // Hangileri veritabanında var kontrol et
  const keys = items.map(item => item.key);
  const { data: existing } = await supabase
    .from('translations')
    .select('translation_key, translation_value')
    .eq('language_code', targetLanguage)
    .in('translation_key', keys);

  const existingMap = new Map<string, string>();
  existing?.forEach(t => {
    existingMap.set(t.translation_key, t.translation_value);
    cache.set(`${targetLanguage}:${t.translation_key}`, t.translation_value);
  });

  // Eksik olanları bul
  const needsTranslation = items.filter(item => !existingMap.has(item.key));

  if (needsTranslation.length === 0) {
    // Hepsi mevcut, döndür
    items.forEach(item => {
      result.set(item.key, existingMap.get(item.key) || item.text);
    });
    return result;
  }

  // Google Translate API'ye toplu gönder (50'şer batch)
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
            targetLanguage,
            sourceLanguage: 'tr'
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.translations) {
          // Veritabanına kaydet
          const translationsToInsert = batch.map((item, index) => {
            const translatedText = data.translations[index]?.translatedText || item.text;
            existingMap.set(item.key, translatedText);
            cache.set(`${targetLanguage}:${item.key}`, translatedText);

            return {
              language_code: targetLanguage,
              translation_key: item.key,
              translation_value: translatedText,
              source_text: item.text,
              translation_type: translationType,
              auto_translated: true,
              context: translationType
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
      // Hata durumunda orijinal metinleri kullan
      batch.forEach(item => {
        if (!existingMap.has(item.key)) {
          existingMap.set(item.key, item.text);
        }
      });
    }

    // Rate limiting için kısa bekleme
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Sonuçları döndür
  items.forEach(item => {
    result.set(item.key, existingMap.get(item.key) || item.text);
  });

  return result;
}

/**
 * TÜRKÇE METNİ KAYDET VE TÜM DİLLERE ÇEVİR
 *
 * Admin panelde kullanım:
 * await saveAndTranslate('Aydınlatma', 'category.lighting', 'category', ['en', 'fr', 'de', 'ar', 'ru']);
 */
export async function saveAndTranslate(
  turkishText: string,
  translationKey: string,
  translationType: string = 'dynamic',
  targetLanguages: string[] = ['en', 'fr', 'de', 'ar', 'ru']
): Promise<void> {
  // Cache'i temizle
  clearTranslationCacheForKey(translationKey);

  // 1. Türkçe'yi kaydet (her zaman güncelle)
  const { error: trError } = await supabase
    .from('translations')
    .upsert({
      language_code: 'tr',
      translation_key: translationKey,
      translation_value: turkishText,
      source_text: turkishText,
      translation_type: translationType,
      auto_translated: false,
      context: translationType,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'language_code,translation_key',
      ignoreDuplicates: false
    });

  if (trError) {
    console.error('Error saving Turkish translation:', trError);
  }

  // 2. Diğer dillere çevir ve kaydet
  await translateBatch(
    [{ key: translationKey, text: turkishText }],
    'en',
    translationType
  );

  for (const lang of targetLanguages.filter(l => l !== 'en')) {
    await translate(turkishText, lang, translationKey, { type: translationType });
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Cache'i temizle
 */
export function clearTranslationCache(): void {
  cache.clear();
}

/**
 * Belirli bir key için cache'i temizle
 */
export function clearTranslationCacheForKey(translationKey: string): void {
  const keysToDelete: string[] = [];
  cache.forEach((_, key) => {
    if (key.includes(translationKey)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => cache.delete(key));
}
