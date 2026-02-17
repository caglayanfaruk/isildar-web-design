import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

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
      return null;
    }

    const data = await response.json();
    return data.translations?.translatedText || null;
  } catch (error) {
    console.error(`Error translating to ${targetLang}:`, error.message);
    return null;
  }
}

async function syncTranslation(key, turkishText, type = 'homepage') {
  if (!turkishText || turkishText.trim() === '') {
    return;
  }

  console.log(`\n📝 Syncing: ${key}`);
  console.log(`   Turkish: "${turkishText}"`);

  // Check/insert Turkish
  const { data: trExists } = await supabase
    .from('translations')
    .select('id')
    .eq('translation_key', key)
    .eq('language_code', 'tr')
    .maybeSingle();

  if (!trExists) {
    const { error } = await supabase
      .from('translations')
      .insert({
        translation_key: key,
        language_code: 'tr',
        source_text: turkishText,
        translation_value: turkishText,
      });

    if (error) {
      console.error(`   ❌ Turkish: ${error.message}`);
      return;
    }
    console.log(`   ✅ Turkish: inserted`);
  } else {
    await supabase
      .from('translations')
      .update({ source_text: turkishText, translation_value: turkishText })
      .eq('translation_key', key)
      .eq('language_code', 'tr');
    console.log(`   ✅ Turkish: updated`);
  }

  // Translate to other languages
  for (const lang of targetLanguages) {
    const { data: exists } = await supabase
      .from('translations')
      .select('id')
      .eq('translation_key', key)
      .eq('language_code', lang)
      .maybeSingle();

    if (exists) {
      console.log(`   ⏭️  ${lang}: already exists`);
      continue;
    }

    console.log(`   🔄 ${lang}: translating...`);
    const translated = await translateText(turkishText, lang);

    if (translated) {
      const { error } = await supabase
        .from('translations')
        .insert({
          translation_key: key,
          language_code: lang,
          source_text: turkishText,
          translation_value: translated,
        });

      if (error) {
        console.log(`   ❌ ${lang}: ${error.message}`);
      } else {
        console.log(`   ✅ ${lang}: "${translated}"`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function fillHomepageTranslations() {
  console.log('🌍 Starting homepage translations sync...\n');

  // 1. Video Section
  console.log('\n📹 VIDEO SECTION');
  console.log('================');

  const { data: videoSection } = await supabase
    .from('homepage_video_section')
    .select('*')
    .maybeSingle();

  if (videoSection) {
    await syncTranslation('homepage.video.badge', videoSection.badge_tr || 'Tanıtım Filmi Slogan');
    await syncTranslation('homepage.video.title', videoSection.title_tr || 'Tanıtım Filmi');
    await syncTranslation('homepage.video.description', videoSection.description_tr || 'Işıldar Tanıtım Filmimizi İzleyin');
    await syncTranslation('homepage.video.video_title', videoSection.video_title_tr || videoSection.subtitle_info || 'Tanıtım Filmi');
  }

  // 2. Video Features
  console.log('\n\n⭐ VIDEO FEATURES');
  console.log('==================');

  const { data: features } = await supabase
    .from('homepage_video_features')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (features) {
    for (const feature of features) {
      await syncTranslation(
        `homepage.video.feature.${feature.id}.title`,
        feature.title_tr || 'Özellik Başlığı'
      );
      await syncTranslation(
        `homepage.video.feature.${feature.id}.description`,
        feature.description_tr || 'Özellik açıklaması'
      );
    }
  }

  // 3. About Content
  console.log('\n\n📄 ABOUT CONTENT');
  console.log('=================');

  const { data: aboutContent } = await supabase
    .from('homepage_about_content')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  if (aboutContent) {
    await syncTranslation('homepage.about.badge', aboutContent.badge_tr || 'Hakkımızda');
    await syncTranslation('homepage.about.title', aboutContent.title_tr || 'Işıldar LED Aydınlatma');
    await syncTranslation('homepage.about.subtitle', aboutContent.subtitle_tr || 'Kaliteli LED Çözümleri');
    await syncTranslation('homepage.about.paragraph_1', aboutContent.paragraph_1_tr || 'Şirket açıklaması 1');
    await syncTranslation('homepage.about.paragraph_2', aboutContent.paragraph_2_tr || 'Şirket açıklaması 2');
    await syncTranslation('homepage.about.paragraph_3', aboutContent.paragraph_3_tr || 'Şirket açıklaması 3');
    await syncTranslation('homepage.about.paragraph_4', aboutContent.paragraph_4_tr || 'Şirket açıklaması 4');
  }

  // 4. About Features
  console.log('\n\n✨ ABOUT FEATURES');
  console.log('==================');

  const { data: aboutFeatures } = await supabase
    .from('homepage_about_features')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (aboutFeatures) {
    for (const feature of aboutFeatures) {
      await syncTranslation(
        `homepage.about.feature.${feature.id}.label`,
        feature.label_tr || 'Özellik'
      );
    }
  }

  // 5. Stats
  console.log('\n\n📊 HOMEPAGE STATS');
  console.log('==================');

  const { data: stats } = await supabase
    .from('homepage_stats')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (stats) {
    for (const stat of stats) {
      await syncTranslation(
        `homepage.stats.${stat.id}.label`,
        stat.label_tr || 'İstatistik'
      );
      await syncTranslation(
        `homepage.stats.${stat.id}.description`,
        stat.description_tr || 'Açıklama'
      );
    }
  }

  console.log('\n\n✅ All homepage translations synced!');
}

fillHomepageTranslations().catch(console.error);
