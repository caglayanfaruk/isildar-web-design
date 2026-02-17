import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function findMissingTranslations() {
  console.log('🔍 Checking for missing translations...\n');

  const { data: languages } = await supabase
    .from('languages')
    .select('code')
    .eq('is_active', true);

  let allTranslations = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('translations')
      .select('translation_key, language_code')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error loading translations:', error);
      break;
    }

    if (data && data.length > 0) {
      allTranslations = [...allTranslations, ...data];
      hasMore = data.length === pageSize;
      page++;
    } else {
      hasMore = false;
    }
  }

  const translations = allTranslations;

  const translationsByKey = {};
  translations.forEach(t => {
    if (!translationsByKey[t.translation_key]) {
      translationsByKey[t.translation_key] = new Set();
    }
    translationsByKey[t.translation_key].add(t.language_code);
  });

  const missingTranslations = [];
  const allLanguages = languages.map(l => l.code);

  Object.keys(translationsByKey).forEach(key => {
    const existingLanguages = translationsByKey[key];
    allLanguages.forEach(lang => {
      if (!existingLanguages.has(lang)) {
        missingTranslations.push({ key, language: lang });
      }
    });
  });

  if (missingTranslations.length === 0) {
    console.log('✅ No missing translations found!');
    return;
  }

  console.log(`❌ Found ${missingTranslations.length} missing translations:\n`);

  const grouped = {};
  missingTranslations.forEach(({ key, language }) => {
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(language);
  });

  Object.entries(grouped).slice(0, 20).forEach(([key, languages]) => {
    console.log(`${key}`);
    console.log(`  Missing: ${languages.join(', ')}\n`);
  });

  if (Object.keys(grouped).length > 20) {
    console.log(`... and ${Object.keys(grouped).length - 20} more keys\n`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`Total unique keys: ${Object.keys(translationsByKey).length}`);
  console.log(`Total languages: ${allLanguages.length}`);
  console.log(`Expected translations: ${Object.keys(translationsByKey).length * allLanguages.length}`);
  console.log(`Actual translations: ${translations.length}`);
  console.log(`Missing translations: ${missingTranslations.length}`);
}

findMissingTranslations().catch(console.error);
