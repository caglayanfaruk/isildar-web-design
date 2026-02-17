import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

// Use environment variables if available
const url = process.env.VITE_SUPABASE_URL || supabaseUrl;
const key = process.env.VITE_SUPABASE_ANON_KEY || supabaseKey;

const supabase = createClient(url, key);

async function populateData() {
  try {
    console.log('🚀 Starting data population...');

    // 1. Add Languages
    console.log('📝 Adding languages...');
    const { data: languages, error: langError } = await supabase
      .from('languages')
      .upsert([
        {
          code: 'tr',
          name: 'Turkish',
          native_name: 'Türkçe',
          flag: '🇹🇷',
          is_default: true,
          is_active: true,
          sort_order: 1
        },
        {
          code: 'en',
          name: 'English',
          native_name: 'English',
          flag: '🇺🇸',
          is_default: false,
          is_active: true,
          sort_order: 2
        },
        {
          code: 'de',
          name: 'German',
          native_name: 'Deutsch',
          flag: '🇩🇪',
          is_default: false,
          is_active: true,
          sort_order: 3
        }
      ], { onConflict: 'code' });

    if (langError) {
      console.error('Language error:', langError);
    } else {
      console.log('✅ Languages added:', languages?.length);
    }

    // 2. Add Categories
    console.log('📂 Adding categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .upsert([
        {
          slug: 'anahtar-priz-grubu',
          sort_order: 1,
          is_active: true,
          icon: '⚡',
          description: 'Kaliteli anahtar ve priz çeşitleri'
        },
        {
          slug: 'bant-tipi-armaturler',
          sort_order: 2,
          is_active: true,
          icon: '🏭',
          description: 'Endüstriyel ve yüksek tavan aydınlatma çözümleri'
        },
        {
          slug: 'led-urunler',
          sort_order: 3,
          is_active: true,
          icon: '💡',
          description: 'Enerji tasarruflu LED aydınlatma ürünleri'
        },
        {
          slug: 'dekoratif-led-panel',
          sort_order: 4,
          is_active: true,
          icon: '✨',
          description: 'Modern ve şık LED panel çerçeve çözümleri'
        },
        {
          slug: 'tavan-glop-armaturleri',
          sort_order: 5,
          is_active: true,
          icon: '☀️',
          description: 'Tavan montajlı glop armatür çeşitleri'
        },
        {
          slug: 'duvar-aplikleri',
          sort_order: 6,
          is_active: true,
          icon: '🏢',
          description: 'Duvar montajlı aydınlatma armatürleri'
        },
        {
          slug: 'sarkit-armaturleri',
          sort_order: 7,
          is_active: true,
          icon: '🌊',
          description: 'Asma tip sarkıt aydınlatma armatürleri'
        },
        {
          slug: 'bahce-armaturleri',
          sort_order: 8,
          is_active: true,
          icon: '🌳',
          description: 'Dış mekan ve bahçe aydınlatma ürünleri'
        },
        {
          slug: 'sensorlu-tavan',
          sort_order: 9,
          is_active: true,
          icon: '🤖',
          description: 'Hareket sensörlü tavan aydınlatma sistemleri'
        },
        {
          slug: 'sensorlu-duvar',
          sort_order: 10,
          is_active: true,
          icon: '🛡️',
          description: 'Sensörlü duvar aplikleri ve acil çıkış yönlendirme'
        },
        {
          slug: 'panolar-sigorta',
          sort_order: 11,
          is_active: true,
          icon: '🔧',
          description: 'Elektrik panoları ve plastik elektrik malzemeleri'
        }
      ], { onConflict: 'slug' });

    if (catError) {
      console.error('Category error:', catError);
    } else {
      console.log('✅ Categories added:', categories?.length);
    }

    // 3. Add Media Files
    console.log('🖼️ Adding media files...');
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .upsert([
        {
          filename: 'slider_1.jpg',
          original_name: 'Anahtar Priz Slider.jpg',
          mime_type: 'image/jpeg',
          size_bytes: 245760,
          url: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
          alt_text: 'Anahtar Priz Grubu',
          folder: 'sliders'
        },
        {
          filename: 'slider_2.jpg',
          original_name: 'Bant Tipi Slider.jpg',
          mime_type: 'image/jpeg',
          size_bytes: 267890,
          url: 'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
          alt_text: 'Bant Tipi Armatürler',
          folder: 'sliders'
        },
        {
          filename: 'slider_3.jpg',
          original_name: 'LED Slider.jpg',
          mime_type: 'image/jpeg',
          size_bytes: 289340,
          url: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
          alt_text: 'LED Ürünler',
          folder: 'sliders'
        }
      ], { onConflict: 'filename' });

    if (mediaError) {
      console.error('Media error:', mediaError);
    } else {
      console.log('✅ Media files added:', media?.length);
    }

    // 4. Add Sliders
    console.log('🎠 Adding sliders...');
    const { data: sliders, error: sliderError } = await supabase
      .from('sliders')
      .upsert([
        {
          name: 'Ana Sayfa Slider',
          location: 'homepage',
          is_active: true
        }
      ], { onConflict: 'name' });

    if (sliderError) {
      console.error('Slider error:', sliderError);
    } else {
      console.log('✅ Sliders added:', sliders?.length);
    }

    // 5. Test data retrieval
    console.log('🔍 Testing data retrieval...');
    
    const { data: testLanguages, error: testLangError } = await supabase
      .from('languages')
      .select('*');
    
    const { data: testCategories, error: testCatError } = await supabase
      .from('categories')
      .select('*');
    
    const { data: testSliders, error: testSliderError } = await supabase
      .from('sliders')
      .select('*');

    console.log('📊 Current data counts:');
    console.log(`Languages: ${testLanguages?.length || 0}`);
    console.log(`Categories: ${testCategories?.length || 0}`);
    console.log(`Sliders: ${testSliders?.length || 0}`);

    if (testLangError) console.error('Language test error:', testLangError);
    if (testCatError) console.error('Category test error:', testCatError);
    if (testSliderError) console.error('Slider test error:', testSliderError);

    console.log('🎉 Data population completed!');

  } catch (error) {
    console.error('❌ Error during data population:', error);
  }
}

populateData();