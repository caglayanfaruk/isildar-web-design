import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const translations = [
  // Navigation
  { key: 'ui.nav.home', tr: 'Ana Sayfa' },
  { key: 'ui.nav.products', tr: 'Ürünler' },
  { key: 'ui.nav.about', tr: 'Hakkımızda' },
  { key: 'ui.nav.contact', tr: 'İletişim' },
  { key: 'ui.nav.news', tr: 'Haberler' },
  { key: 'ui.nav.projects', tr: 'Projeler' },
  { key: 'ui.nav.quote', tr: 'Teklif Al' },
  { key: 'ui.nav.language', tr: 'Dil' },

  // Homepage
  { key: 'ui.homepage.categories_title', tr: 'Ürün Kategorileri' },
  { key: 'ui.homepage.categories_subtitle', tr: 'Geniş ürün yelpazemizi keşfedin' },

  // Contact Page
  { key: 'ui.contact.title', tr: 'İletişim' },
  { key: 'ui.contact.subtitle', tr: 'Bizimle iletişime geçin' },
  { key: 'ui.contact.info_title', tr: 'İletişim Bilgileri' },
  { key: 'ui.contact.form_title', tr: 'Mesaj Gönderin' },
  { key: 'ui.contact.name', tr: 'Adınız Soyadınız' },
  { key: 'ui.contact.email', tr: 'E-posta Adresiniz' },
  { key: 'ui.contact.phone', tr: 'Telefon Numaranız' },
  { key: 'ui.contact.subject', tr: 'Konu' },
  { key: 'ui.contact.message', tr: 'Mesajınız' },
  { key: 'ui.contact.send', tr: 'Gönder' },
  { key: 'ui.contact.sending', tr: 'Gönderiliyor...' },
  { key: 'ui.contact.company', tr: 'Şirket Adı' },
  { key: 'ui.contact.address', tr: 'Adres' },
  { key: 'ui.contact.working_hours', tr: 'Çalışma Saatleri' },

  // Quote Page
  { key: 'ui.quote.title', tr: 'Teklif Talebi' },
  { key: 'ui.quote.subtitle', tr: 'Ürünlerimiz için teklif alın' },
  { key: 'ui.quote.product_selection', tr: 'Ürün Seçimi' },
  { key: 'ui.quote.add_product', tr: 'Ürün Ekle' },
  { key: 'ui.quote.selected_products', tr: 'Seçili Ürünler' },
  { key: 'ui.quote.no_products', tr: 'Henüz ürün seçilmedi' },
  { key: 'ui.quote.quantity', tr: 'Adet' },
  { key: 'ui.quote.remove', tr: 'Kaldır' },
  { key: 'ui.quote.contact_info', tr: 'İletişim Bilgileri' },
  { key: 'ui.quote.notes', tr: 'Notlar / Özel İstekler' },
  { key: 'ui.quote.notes_placeholder', tr: 'Varsa özel isteklerinizi buraya yazabilirsiniz...' },
  { key: 'ui.quote.submit', tr: 'Teklif Talebi Gönder' },
  { key: 'ui.quote.submitting', tr: 'Gönderiliyor...' },
  { key: 'ui.quote.success', tr: 'Teklif talebiniz başarıyla gönderildi!' },
  { key: 'ui.quote.error', tr: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
  { key: 'ui.quote.search_products', tr: 'Ürün ara...' },
  { key: 'ui.quote.select_product', tr: 'Ürün seçin' },
  { key: 'ui.quote.attachments', tr: 'Dosya Ekle (Opsiyonel)' },
  { key: 'ui.quote.upload', tr: 'Dosya Yükle' },
  { key: 'ui.quote.max_size', tr: 'Maksimum dosya boyutu: 5MB' },

  // Product Pages
  { key: 'ui.product.search', tr: 'Ürün ara...' },
  { key: 'ui.product.filter', tr: 'Filtrele' },
  { key: 'ui.product.sort', tr: 'Sırala' },
  { key: 'ui.product.categories', tr: 'Kategoriler' },
  { key: 'ui.product.all_products', tr: 'Tüm Ürünler' },
  { key: 'ui.product.no_products', tr: 'Ürün bulunamadı' },
  { key: 'ui.product.view_details', tr: 'Detayları Gör' },
  { key: 'ui.product.specifications', tr: 'Teknik Özellikler' },
  { key: 'ui.product.description', tr: 'Açıklama' },
  { key: 'ui.product.features', tr: 'Özellikler' },
  { key: 'ui.product.variants', tr: 'Varyantlar' },
  { key: 'ui.product.related', tr: 'İlgili Ürünler' },
  { key: 'ui.product.get_quote', tr: 'Teklif Al' },

  // Common
  { key: 'ui.common.loading', tr: 'Yükleniyor...' },
  { key: 'ui.common.error', tr: 'Bir hata oluştu' },
  { key: 'ui.common.success', tr: 'Başarılı!' },
  { key: 'ui.common.cancel', tr: 'İptal' },
  { key: 'ui.common.save', tr: 'Kaydet' },
  { key: 'ui.common.delete', tr: 'Sil' },
  { key: 'ui.common.edit', tr: 'Düzenle' },
  { key: 'ui.common.close', tr: 'Kapat' },
  { key: 'ui.common.search', tr: 'Ara' },
  { key: 'ui.common.filter', tr: 'Filtre' },
  { key: 'ui.common.clear', tr: 'Temizle' },
  { key: 'ui.common.apply', tr: 'Uygula' },
  { key: 'ui.common.back', tr: 'Geri' },
  { key: 'ui.common.next', tr: 'İleri' },
  { key: 'ui.common.previous', tr: 'Önceki' },
  { key: 'ui.common.submit', tr: 'Gönder' },
  { key: 'ui.common.required', tr: 'Zorunlu alan' },

  // Form Validation
  { key: 'ui.validation.required', tr: 'Bu alan zorunludur' },
  { key: 'ui.validation.email', tr: 'Geçerli bir e-posta adresi girin' },
  { key: 'ui.validation.phone', tr: 'Geçerli bir telefon numarası girin' },
  { key: 'ui.validation.min_length', tr: 'En az {min} karakter olmalıdır' },
  { key: 'ui.validation.max_length', tr: 'En fazla {max} karakter olmalıdır' },
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
      return null;
    }

    const data = await response.json();
    return data.translations?.translatedText || null;
  } catch (error) {
    console.error(`Error translating to ${targetLang}:`, error.message);
    return null;
  }
}

async function syncTranslation(key, turkishText) {
  if (!turkishText || turkishText.trim() === '') {
    return;
  }

  console.log(`\n📝 Processing: ${key}`);
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
    console.log(`   ✅ Turkish inserted`);
  } else {
    await supabase
      .from('translations')
      .update({ source_text: turkishText, translation_value: turkishText })
      .eq('translation_key', key)
      .eq('language_code', 'tr');
    console.log(`   ✅ Turkish exists (source_text updated)`);
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

async function fillAllTranslations() {
  console.log('🌍 Starting full UI translations sync...\n');
  console.log(`📊 Total translations to process: ${translations.length}\n`);

  let processed = 0;
  for (const item of translations) {
    processed++;
    console.log(`\n[${processed}/${translations.length}]`);
    await syncTranslation(item.key, item.tr);
  }

  console.log('\n\n✅ All translations completed!');
  console.log(`📊 Processed ${processed} translation keys`);
  console.log(`🌐 Total translations created: ${processed * 6} (6 languages)`);
}

fillAllTranslations().catch(console.error);
