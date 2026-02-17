import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const sliderItems = [
  {
    title_tr: 'Anahtar Priz Grubu',
    title_en: 'Switch Socket Group',
    subtitle_tr: 'Kaliteli anahtar ve priz çeşitleri',
    subtitle_en: 'Quality switches and sockets',
    accent_tr: 'Elektrik Malzemeleri',
    accent_en: 'Electrical Supplies',
    image_url: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    sort_order: 1
  },
  {
    title_tr: 'Bant Tipi ve Yüksek Tavan Armatürler',
    title_en: 'Track Type and High Ceiling Fixtures',
    subtitle_tr: 'Endüstriyel ve yüksek tavan aydınlatma çözümleri',
    subtitle_en: 'Industrial and high ceiling lighting solutions',
    accent_tr: 'Endüstriyel Aydınlatma',
    accent_en: 'Industrial Lighting',
    image_url: 'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    sort_order: 2
  },
  {
    title_tr: 'LED\'li Ürünler',
    title_en: 'LED Products',
    subtitle_tr: 'Enerji tasarruflu LED aydınlatma ürünleri',
    subtitle_en: 'Energy efficient LED lighting products',
    accent_tr: 'LED Teknolojisi',
    accent_en: 'LED Technology',
    image_url: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    sort_order: 3
  },
  {
    title_tr: 'Dekoratif Led Panel Çerçeveleri',
    title_en: 'Decorative LED Panel Frames',
    subtitle_tr: 'Modern ve şık LED panel çerçeve çözümleri',
    subtitle_en: 'Modern and elegant LED panel frame solutions',
    accent_tr: 'Dekoratif Aydınlatma',
    accent_en: 'Decorative Lighting',
    image_url: 'https://images.pexels.com/photos/6587823/pexels-photo-6587823.jpeg',
    sort_order: 4
  },
  {
    title_tr: 'Tavan Glop Armatürleri',
    title_en: 'Ceiling Globe Fixtures',
    subtitle_tr: 'Tavan montajlı glop armatür çeşitleri',
    subtitle_en: 'Ceiling mounted globe fixture varieties',
    accent_tr: 'Tavan Aydınlatma',
    accent_en: 'Ceiling Lighting',
    image_url: 'https://images.pexels.com/photos/1250664/pexels-photo-1250664.jpeg',
    sort_order: 5
  },
  {
    title_tr: 'Duvar Aplikleri',
    title_en: 'Wall Sconces',
    subtitle_tr: 'Duvar montajlı aydınlatma armatürleri',
    subtitle_en: 'Wall mounted lighting fixtures',
    accent_tr: 'Duvar Aydınlatma',
    accent_en: 'Wall Lighting',
    image_url: 'https://images.pexels.com/photos/6587823/pexels-photo-6587823.jpeg',
    sort_order: 6
  },
  {
    title_tr: 'Sarkıt Armatürleri',
    title_en: 'Pendant Fixtures',
    subtitle_tr: 'Asma tip sarkıt aydınlatma armatürleri',
    subtitle_en: 'Hanging pendant lighting fixtures',
    accent_tr: 'Sarkıt Aydınlatma',
    accent_en: 'Pendant Lighting',
    image_url: 'https://images.pexels.com/photos/6489118/pexels-photo-6489118.jpeg',
    sort_order: 7
  },
  {
    title_tr: 'Bahçe Armatürleri',
    title_en: 'Garden Fixtures',
    subtitle_tr: 'Dış mekan ve bahçe aydınlatma ürünleri',
    subtitle_en: 'Outdoor and garden lighting products',
    accent_tr: 'Dış Mekan Aydınlatma',
    accent_en: 'Outdoor Lighting',
    image_url: 'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    sort_order: 8
  },
  {
    title_tr: 'Sensörlü Tavan Armatürleri',
    title_en: 'Sensor Ceiling Fixtures',
    subtitle_tr: 'Hareket sensörlü tavan aydınlatma sistemleri',
    subtitle_en: 'Motion sensor ceiling lighting systems',
    accent_tr: 'Akıllı Aydınlatma',
    accent_en: 'Smart Lighting',
    image_url: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    sort_order: 9
  },
  {
    title_tr: 'Sensörlü Duvar Aplikleri ve Acil Yönlendirme',
    title_en: 'Sensor Wall Sconces and Emergency Guidance',
    subtitle_tr: 'Sensörlü duvar aplikleri ve acil çıkış yönlendirme',
    subtitle_en: 'Sensor wall sconces and emergency exit guidance',
    accent_tr: 'Güvenlik Aydınlatma',
    accent_en: 'Safety Lighting',
    image_url: 'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    sort_order: 10
  },
  {
    title_tr: 'Panolar-Sigorta Kutuları ve Plastik Elektrik Malzemeleri',
    title_en: 'Panels-Circuit Boxes and Plastic Electrical Materials',
    subtitle_tr: 'Elektrik panoları ve plastik elektrik malzemeleri',
    subtitle_en: 'Electrical panels and plastic electrical materials',
    accent_tr: 'Elektrik Malzemeleri',
    accent_en: 'Electrical Materials',
    image_url: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    sort_order: 11
  }
];

async function addSliders() {
  try {
    console.log('Creating homepage slider...');

    const { data: slider, error: sliderError } = await supabase
      .from('sliders')
      .insert({
        name: 'Ana Sayfa Slider',
        location: 'homepage',
        is_active: true
      })
      .select()
      .single();

    if (sliderError) {
      console.error('Error creating slider:', sliderError);
      return;
    }

    console.log('Slider created:', slider.id);

    for (const item of sliderItems) {
      console.log(`Adding media for: ${item.title_tr}...`);

      const { data: media, error: mediaError } = await supabase
        .from('media')
        .insert({
          filename: `slider_${item.sort_order}.jpg`,
          original_name: `${item.title_tr}.jpg`,
          mime_type: 'image/jpeg',
          size_bytes: 0,
          url: item.image_url,
          folder: 'sliders',
          uploaded_by: null
        })
        .select()
        .single();

      if (mediaError) {
        console.error('Error adding media:', mediaError);
        continue;
      }

      console.log(`Adding slider item: ${item.title_tr}...`);

      const { error: itemError } = await supabase
        .from('slider_items')
        .insert({
          slider_id: slider.id,
          image_id: media.id,
          title_tr: item.title_tr,
          title_en: item.title_en,
          subtitle_tr: item.subtitle_tr,
          subtitle_en: item.subtitle_en,
          accent_tr: item.accent_tr,
          accent_en: item.accent_en,
          button_text_tr: 'Ürünleri Keşfet',
          button_text_en: 'Explore Products',
          button_link: '/products',
          sort_order: item.sort_order,
          is_active: true,
          link_url: '',
          link_target: '_self'
        });

      if (itemError) {
        console.error('Error adding slider item:', itemError);
        continue;
      }

      console.log(`✓ Added: ${item.title_tr}`);
    }

    console.log('\n✅ All sliders added successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addSliders();
