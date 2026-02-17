import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase bağlantısı test ediliyor...');
console.log('URL:', supabaseUrl ? 'Var' : 'Eksik');
console.log('Key:', supabaseAnonKey ? 'Var' : 'Eksik');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables eksik');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAndAddProducts() {
  try {
    // Önce bağlantıyı test et
    console.log('🔗 Veritabanı bağlantısı test ediliyor...');
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .select('count(*)', { count: 'exact' });

    if (testError) {
      console.error('❌ Veritabanı bağlantısı başarısız:', testError);
      return;
    }

    console.log('✅ Veritabanı bağlantısı başarılı');
    console.log('📊 Mevcut kategori sayısı:', testData);

    // Kategorileri kontrol et
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('*');

    console.log('📂 Mevcut kategoriler:', existingCategories?.length || 0);

    // Eğer kategori yoksa ekle
    if (!existingCategories || existingCategories.length === 0) {
      console.log('📝 Kategoriler ekleniyor...');
      
      const categories = [
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
          slug: 'panolar-sigorta',
          sort_order: 4,
          is_active: true,
          icon: '🔧',
          description: 'Elektrik panoları ve plastik elektrik malzemeleri'
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
        sku: 'AP-001',
        category_id: categories.find(c => c.slug === 'anahtar-priz-grubu')?.id,
        product_type: 'simple',
        status: 'active',
        featured: true,
        sort_order: 1,
        specifications: {
          voltage: '250V AC',
          current: '16A',
          material: 'ABS Plastik',
          protection: 'IP20'
        },
        features: ['Yüksek kaliteli plastik', 'Kolay montaj', 'CE sertifikalı'],
        applications: ['Ev', 'Ofis', 'Ticari alanlar'],
        dimensions: '86x86x40 mm',
        weight: 0.15,
        brand: 'IŞILDAR',
        warranty_period: 24,
        min_order_quantity: 10
      },
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
          protection: 'IP44',
          temperature_range: '-20°C / +60°C'
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
          protection: 'IP44',
          temperature_range: '-20°C / +60°C'
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
          protection: 'IP44',
          beam_angle: '120°'
        },
        features: ['LED panel', 'Yüksek verimlilik', 'Uzun ömür'],
        applications: ['Ofis', 'Hastane', 'Okul'],
        dimensions: '600x600x12 mm',
        weight: 3.2,
        brand: 'IŞILDAR',
        warranty_period: 36,
        min_order_quantity: 1,
        energy_class: 'A++'
      },
      {
        sku: 'BT-001',
        category_id: categories.find(c => c.slug === 'bant-tipi-armaturler')?.id,
        product_type: 'simple',
        status: 'active',
        featured: true,
        sort_order: 1,
        specifications: {
          power: '36W',
          voltage: '220-240V AC',
          luminous_flux: '3600 lm',
          color_temperature: '4000K',
          protection: 'IP65'
        },
        features: ['LED teknolojisi', 'Su geçirmez', 'Yüksek verimlilik'],
        applications: ['Fabrika', 'Depo', 'Endüstriyel alanlar'],
        dimensions: '1200x100x50 mm',
        weight: 2.5,
        brand: 'IŞILDAR',
        warranty_period: 36,
        min_order_quantity: 5
      }
    ];

    // Ürünleri tek tek ekle
    for (const product of products) {
      console.log(`Ürün ekleniyor: ${product.sku}`);
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select();

      if (error) {
        console.error(`❌ ${product.sku} ekleme hatası:`, error);
      } else {
        console.log(`✅ ${product.sku} eklendi`);
      }
    }

    // Çevirileri ekle
    console.log('📝 Ürün çevirileri ekleniyor...');
    
    const productTranslations = [
      { key: 'product.AP-001.name', value: 'Tekli Anahtar Premium' },
      { key: 'product.AP-001.description', value: 'Yüksek kaliteli ABS plastikten üretilen tekli anahtar. Modern tasarım ve uzun ömürlü kullanım.' },
      { key: 'product.2210.name', value: '110x110x70 Buat (8 çıkışlı contali)' },
      { key: 'product.2210.description', value: 'Kompakt boyutlarda 8 çıkışlı buat conta. Küçük ve orta ölçekli projelerde ideal kullanım.' },
      { key: 'product.2211.name', value: '110x180x70 Buat (10 çıkışlı contali)' },
      { key: 'product.2211.description', value: 'Orta boyutlarda 10 çıkışlı buat conta. Daha fazla bağlantı noktası gereken projeler için.' },
      { key: 'product.LED-001.name', value: 'LED Panel 60x60 40W' },
      { key: 'product.LED-001.description', value: 'Yüksek kaliteli LED panel. Ofis ve ticari alanlar için ideal, homojen ışık dağılımı.' },
      { key: 'product.BT-001.name', value: 'Endüstriyel LED Bant Armatür 36W' },
      { key: 'product.BT-001.description', value: 'Yüksek verimli LED teknolojisi ile endüstriyel alanlar için ideal aydınlatma çözümü.' }
    ];

    for (const translation of productTranslations) {
      await supabase
        .from('translations')
        .upsert({
          language_code: 'tr',
          translation_key: translation.key,
          translation_value: translation.value,
          context: 'product'
        });
    }

    console.log('✅ Çeviriler eklendi');

    // Son kontrol
    const { data: finalProducts } = await supabase
      .from('products')
      .select('*');

    const { data: finalCategories } = await supabase
      .from('categories')
      .select('*');

    console.log('🎉 Son durum:');
    console.log(`Ürünler: ${finalProducts?.length || 0}`);
    console.log(`Kategoriler: ${finalCategories?.length || 0}`);

  } catch (error) {
    console.error('❌ Script hatası:', error);
  }
}

testAndAddProducts();