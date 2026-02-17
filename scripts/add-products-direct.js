import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// .env dosyasını manuel olarak oku
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    console.log('📁 .env dosyası aranıyor:', envPath);
    
    if (!fs.existsSync(envPath)) {
      console.error('❌ .env dosyası bulunamadı:', envPath);
      return {};
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 .env dosyası okundu, içerik uzunluğu:', envContent.length);
    
    const env = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });

    return env;
  } catch (error) {
    console.error('❌ .env dosyası okuma hatası:', error);
    return {};
  }
}

async function addProducts() {
  try {
    console.log('🔍 Environment variables yükleniyor...');
    
    // .env dosyasını manuel olarak yükle
    const env = loadEnvFile();
    
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

    console.log('URL:', supabaseUrl ? 'Mevcut' : 'Eksik');
    console.log('Key:', supabaseAnonKey ? 'Mevcut' : 'Eksik');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase environment variables eksik!');
      console.log('Lütfen Supabase bağlantısını kurun (sağ üstteki Supabase butonuna tıklayın)');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('🔗 Veritabanı bağlantısı test ediliyor...');
    
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
        sku: '2212',
        category_id: categories.find(c => c.slug === 'panolar-sigorta')?.id,
        product_type: 'variant',
        status: 'active',
        featured: false,
        sort_order: 3,
        specifications: {
          material: 'ABS Plastik',
          voltage: '250V AC',
          exits: 14,
          protection: 'IP44'
        },
        features: ['14 çıkışlı conta', 'Büyük kapasiteli tasarım', 'Endüstriyel kullanım'],
        applications: ['Büyük ofis binaları', 'Alışveriş merkezleri', 'Fabrika ana dağıtım'],
        dimensions: '180x270x100 mm',
        weight: 17.65,
        shrink_volume: 0.141,
        shrink_measurement: '62x57x40',
        quantity_per_box: 2,
        quantity_per_shrink: 24,
        brand: 'IŞILDAR',
        warranty_period: 24,
        min_order_quantity: 2
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
      },
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
        console.error('Hata detayı:', error.message);
        console.error('Hata kodu:', error.code);
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
      { key: 'product.2212.name', value: '180x270x100 Buat (14 çıkışlı contali)' },
      { key: 'product.2212.description', value: 'Büyük boyutlarda 14 çıkışlı buat conta. Yoğun elektrik bağlantısı gereken büyük projeler için.' },
      { key: 'product.LED-001.name', value: 'LED Panel 60x60 40W' },
      { key: 'product.LED-001.description', value: 'Yüksek kaliteli LED panel. Ofis ve ticari alanlar için ideal, homojen ışık dağılımı.' },
      { key: 'product.AP-001.name', value: 'Tekli Anahtar Premium' },
      { key: 'product.AP-001.description', value: 'Yüksek kaliteli ABS plastikten üretilen tekli anahtar. Modern tasarım ve uzun ömürlü kullanım.' },
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

    if (finalProducts && finalProducts.length > 0) {
      console.log('✅ Ürünler başarıyla eklendi!');
      console.log('🔍 Supabase dashboard\'unda products tablosunu kontrol edin');
    }

  } catch (error) {
    console.error('❌ Script hatası:', error);
  }
}

addProducts();