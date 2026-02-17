import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables eksik!');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Mevcut' : 'Eksik');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Mevcut' : 'Eksik');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addProductsDirectly() {
  try {
    console.log('🔗 Supabase bağlantısı test ediliyor...');
    
    // Bağlantıyı test et
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .select('count(*)', { count: 'exact' });

    if (testError) {
      console.error('❌ Veritabanı bağlantı hatası:', testError);
      return;
    }

    console.log('✅ Veritabanı bağlantısı başarılı');

    // Kategorileri kontrol et
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('*');

    console.log('📂 Mevcut kategoriler:', existingCategories?.length || 0);

    // Kategoriler yoksa ekle
    if (!existingCategories || existingCategories.length === 0) {
      console.log('📝 Kategoriler ekleniyor...');
      
      const categories = [
        {
          slug: 'panolar-sigorta',
          sort_order: 1,
          is_active: true,
          icon: '🔧',
          description: 'Elektrik panoları ve plastik elektrik malzemeleri'
        },
        {
          slug: 'led-urunler',
          sort_order: 2,
          is_active: true,
          icon: '💡',
          description: 'Enerji tasarruflu LED aydınlatma ürünleri'
        },
        {
          slug: 'anahtar-priz-grubu',
          sort_order: 3,
          is_active: true,
          icon: '⚡',
          description: 'Kaliteli anahtar ve priz çeşitleri'
        }
      ];

      const { data: insertedCategories, error: catError } = await supabase
        .from('categories')
        .insert(categories)
        .select();

      if (catError) {
        console.error('❌ Kategori ekleme hatası:', catError);
        return;
      }

      console.log('✅ Kategoriler eklendi:', insertedCategories?.length);
    }

    // Kategorileri tekrar çek
    const { data: categories } = await supabase
      .from('categories')
      .select('*');

    if (!categories || categories.length === 0) {
      console.error('❌ Kategori bulunamadı');
      return;
    }

    // Ürünleri kontrol et
    const { data: existingProducts } = await supabase
      .from('products')
      .select('*');

    console.log('📦 Mevcut ürünler:', existingProducts?.length || 0);

    if (existingProducts && existingProducts.length > 0) {
      console.log('✅ Ürünler zaten mevcut');
      return;
    }

    console.log('📦 Ürünler ekleniyor...');

    // Ürünleri ekle
    const products = [
      {
        sku: '2210',
        category_id: categories.find(c => c.slug === 'panolar-sigorta')?.id,
        product_type: 'variant',
        status: 'active',
        featured: true,
        sort_order: 1,
        specifications: {
          material: 'ABS Plastik',
          voltage: '250V AC',
          exits: 8,
          protection: 'IP44'
        },
        features: ['8 çıkışlı conta', 'Yüksek kaliteli plastik', 'Kolay montaj'],
        applications: ['Endüstriyel tesisler', 'Ticari binalar', 'Konut projeleri'],
        dimensions: '110x110x70 mm',
        weight: 20.15,
        shrink_volume: 0.104,
        shrink_measurement: '46x61x37',
        quantity_per_box: 10,
        quantity_per_shrink: 100,
        brand: 'IŞILDAR',
        warranty_period: 24,
        min_order_quantity: 10
      },
      {
        sku: '2211',
        category_id: categories.find(c => c.slug === 'panolar-sigorta')?.id,
        product_type: 'variant',
        status: 'active',
        featured: false,
        sort_order: 2,
        specifications: {
          material: 'ABS Plastik',
          voltage: '250V AC',
          exits: 10,
          protection: 'IP44'
        },
        features: ['10 çıkışlı conta', 'Genişletilmiş tasarım', 'Dayanıklı yapı'],
        applications: ['Orta ölçekli ofisler', 'Ticari binalar', 'Endüstriyel tesisler'],
        dimensions: '110x180x70 mm',
        weight: 18.00,
        shrink_volume: 0.104,
        shrink_measurement: '46x61x37',
        quantity_per_box: 6,
        quantity_per_shrink: 60,
        brand: 'IŞILDAR',
        warranty_period: 24,
        min_order_quantity: 6
      },
      {
        sku: 'LED-001',
        category_id: categories.find(c => c.slug === 'led-urunler')?.id,
        product_type: 'simple',
        status: 'active',
        featured: true,
        sort_order: 1,
        specifications: {
          power: '40W',
          voltage: '220-240V AC',
          luminous_flux: '4000 lm',
          color_temperature: '4000K',
          protection: 'IP44'
        },
        features: ['LED panel', 'Yüksek verimlilik', 'Uzun ömür'],
        applications: ['Ofis', 'Hastane', 'Okul'],
        dimensions: '600x600x12 mm',
        weight: 3.2,
        brand: 'IŞILDAR',
        warranty_period: 36,
        min_order_quantity: 1,
        energy_class: 'A++'
      }
    ];

    // Ürünleri tek tek ekle
    for (const product of products) {
      console.log(`📦 Ürün ekleniyor: ${product.sku}`);
      
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select();

      if (error) {
        console.error(`❌ ${product.sku} ekleme hatası:`, error);
      } else {
        console.log(`✅ ${product.sku} başarıyla eklendi`);
      }
    }

    // Çevirileri ekle
    console.log('📝 Çeviriler ekleniyor...');
    
    const translations = [
      { key: 'product.2210.name', value: '110x110x70 Buat (8 çıkışlı contali)' },
      { key: 'product.2210.description', value: 'Kompakt boyutlarda 8 çıkışlı buat conta. Küçük ve orta ölçekli projelerde ideal kullanım.' },
      { key: 'product.2211.name', value: '110x180x70 Buat (10 çıkışlı contali)' },
      { key: 'product.2211.description', value: 'Orta boyutlarda 10 çıkışlı buat conta. Daha fazla bağlantı noktası gereken projeler için.' },
      { key: 'product.LED-001.name', value: 'LED Panel 60x60 40W' },
      { key: 'product.LED-001.description', value: 'Yüksek kaliteli LED panel. Ofis ve ticari alanlar için ideal, homojen ışık dağılımı.' },
      { key: 'category.panolar-sigorta.name', value: 'Panolar-Sigorta Kutuları ve Plastik Elektrik Malzemeleri' },
      { key: 'category.led-urunler.name', value: 'LED\'li Ürünler' },
      { key: 'category.anahtar-priz-grubu.name', value: 'Anahtar Priz Grubu' }
    ];

    for (const translation of translations) {
      const { error } = await supabase
        .from('translations')
        .upsert({
          language_code: 'tr',
          translation_key: translation.key,
          translation_value: translation.value,
          context: 'product'
        });

      if (error) {
        console.error(`❌ Çeviri hatası (${translation.key}):`, error);
      }
    }

    console.log('✅ Çeviriler eklendi');

    // Son kontrol
    const { data: finalProducts } = await supabase
      .from('products')
      .select('*');

    const { data: finalCategories } = await supabase
      .from('categories')
      .select('*');

    console.log('🎉 İşlem tamamlandı!');
    console.log(`📦 Toplam ürün: ${finalProducts?.length || 0}`);
    console.log(`📂 Toplam kategori: ${finalCategories?.length || 0}`);

  } catch (error) {
    console.error('❌ Script hatası:', error);
  }
}

addProductsDirectly();