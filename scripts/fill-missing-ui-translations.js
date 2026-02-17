import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const translations = [
  {
    key: 'homepage.video.badge',
    tr: 'Tanıtım Filmi Slogan',
  },
  {
    key: 'homepage.video.title',
    tr: 'Tanıtım Filmi',
  },
  {
    key: 'homepage.video.description',
    tr: 'Işıldar Tanıtım Filmimizi İzleyin',
  },
  {
    key: 'ui.nav.home',
    tr: 'Ana Sayfa',
  },
  {
    key: 'ui.nav.products',
    tr: 'Ürünler',
  },
  {
    key: 'ui.nav.about',
    tr: 'Hakkımızda',
  },
  {
    key: 'ui.nav.contact',
    tr: 'İletişim',
  },
  {
    key: 'ui.nav.news',
    tr: 'Haberler',
  },
  {
    key: 'ui.nav.projects',
    tr: 'Projeler',
  },
  {
    key: 'ui.nav.quote',
    tr: 'Teklif Al',
  },
  {
    key: 'ui.nav.language',
    tr: 'Dil',
  },
  {
    key: 'ui.homepage.categories_title',
    tr: 'Ürün Kategorileri',
  },
  {
    key: 'ui.homepage.categories_subtitle',
    tr: 'Geniş ürün yelpazemizi keşfedin',
  },
];

const targetLanguages = ['en', 'de', 'fr', 'ar', 'ru'];

async function translateText(text, targetLang) {
  try {
    const response = await fetch(
      `${process.env.VITE_SUPABASE_URL}/functions/v1/translate-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: text,
          targetLanguage: targetLang,
          sourceLanguage: 'tr',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Translation API error for ${targetLang}:`, errorText);
      return null;
    }

    const data = await response.json();
    return data.translations?.translatedText || null;
  } catch (error) {
    console.error(`Error translating to ${targetLang}:`, error.message);
    return null;
  }
}

async function fillMissingTranslations() {
  console.log('🌍 Starting to fill missing UI translations...\n');

  for (const item of translations) {
    console.log(`\n📝 Processing: ${item.key}`);
    console.log(`   Turkish: "${item.tr}"`);

    // Check if Turkish translation exists
    const { data: trExists } = await supabase
      .from('translations')
      .select('id')
      .eq('translation_key', item.key)
      .eq('language_code', 'tr')
      .maybeSingle();

    if (!trExists) {
      // Insert Turkish translation
      const { error: trError } = await supabase
        .from('translations')
        .insert({
          translation_key: item.key,
          language_code: 'tr',
          source_text: item.tr,
          translation_value: item.tr,
        });

      if (trError) {
        console.error(`   ❌ Error inserting Turkish: ${trError.message}`);
      } else {
        console.log(`   ✅ Turkish inserted`);
      }
    } else {
      // Update source_text if missing
      await supabase
        .from('translations')
        .update({ source_text: item.tr })
        .eq('translation_key', item.key)
        .eq('language_code', 'tr');
      console.log(`   ✅ Turkish exists (source_text updated)`);
    }

    // Translate to other languages
    for (const lang of targetLanguages) {
      // Check if translation exists
      const { data: exists } = await supabase
        .from('translations')
        .select('id, translation_value')
        .eq('translation_key', item.key)
        .eq('language_code', lang)
        .maybeSingle();

      if (exists) {
        console.log(`   ⏭️  ${lang}: already exists ("${exists.translation_value}")`);
        continue;
      }

      // Translate
      console.log(`   🔄 ${lang}: translating...`);
      const translated = await translateText(item.tr, lang);

      if (translated) {
        const { error } = await supabase
          .from('translations')
          .insert({
            translation_key: item.key,
            language_code: lang,
            source_text: item.tr,
            translation_value: translated,
          });

        if (error) {
          console.error(`   ❌ ${lang}: Error inserting - ${error.message}`);
        } else {
          console.log(`   ✅ ${lang}: "${translated}"`);
        }
      } else {
        console.log(`   ⚠️  ${lang}: Translation failed`);
      }

      // Wait 500ms between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n\n✅ All translations completed!');
}

fillMissingTranslations().catch(console.error);
