import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseAnonKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please click "Connect to Supabase" button in the top right');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addProducts() {
  try {
    console.log('🔗 Testing database connection...');
    
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .select('count(*)', { count: 'exact' });

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }

    console.log('✅ Database connected successfully');

    // Check if categories exist, if not add them first
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('*');

    if (!existingCategories || existingCategories.length === 0) {
      console.log('📝 Adding categories first...');
      
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
      ];

      const { data: insertedCategories, error: catError } = await supabase
        .from('categories')
        .insert(categories)
        .select();

      if (catError) {
        console.error('❌ Error adding categories:', catError);
        return;
      }

      console.log('✅ Categories added:', insertedCategories.length);
    }

    // Get categories for product assignment
    const { data: categories } = await supabase
      .from('categories')
      .select('*');

    if (!categories || categories.length === 0) {
      console.error('❌ No categories found');
      return;
    }

    console.log('📦 Adding products...');

    // Check if products already exist
    const { data: existingProducts } = await supabase
      .from('products')
      .select('*');

    if (existingProducts && existingProducts.length > 0) {
      console.log('✅ Products already exist:', existingProducts.length);
      return;
    }

    // Sample products based on the real IŞILDAR categories
    const products = [
      // Anahtar Priz Grubu
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
        sku: 'AP-002',
        category_id: categories.find(c => c.slug === 'anahtar-priz-grubu')?.id,
        product_type: 'simple',
        status: 'active',
        featured: false,
        sort_order: 2,
        specifications: {
          voltage: '250V AC',
          current: '16A',
          material: 'ABS Plastik',
          protection: 'IP20'
        },
        features: ['İkili anahtar', 'Dimmer özelliği', 'Modern tasarım'],
        applications: ['Ev', 'Ofis'],
        dimensions: '86x86x40 mm',
        weight: 0.18,
        brand: 'IŞILDAR',
        warranty_period: 24,
        min_order_quantity: 10
      },
      // Bant Tipi Armatürler
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
      },
      {
        sku: 'BT-002',
        category_id: categories.find(c => c.slug === 'bant-tipi-armaturler')?.id,
        product_type: 'simple',
        status: 'active',
        featured: false,
        sort_order: 2,
        specifications: {
          power: '18W',
          voltage: '220-240V AC',
          luminous_flux: '1800 lm',
          color_temperature: '6500K',
          protection: 'IP44'
        },
        features: ['Kompakt tasarım', 'Enerji tasarruflu', 'Uzun ömürlü'],
        applications: ['Ofis', 'Mağaza', 'Koridor'],
        dimensions: '600x100x50 mm',
        weight: 1.8,
        brand: 'IŞILDAR',
        warranty_period: 36,
        min_order_quantity: 10
      },
      // LED Ürünler
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
        sku: 'LED-002',
        category_id: categories.find(c => c.slug === 'led-urunler')?.id,
        product_type: 'simple',
        status: 'active',
        featured: true,
        sort_order: 2,
        specifications: {
          power: '20W',
          voltage: '220-240V AC',
          luminous_flux: '2000 lm',
          color_temperature: '3000K',
          protection: 'IP44',
          beam_angle: '120°'
        },
        features: ['Sıcak beyaz ışık', 'Gömme montaj', 'Flicker-free'],
        applications: ['Ev', 'Restoran', 'Otel'],
        dimensions: '300x300x12 mm',
        weight: 1.5,
        brand: 'IŞILDAR',
        warranty_period: 36,
        min_order_quantity: 1,
        energy_class: 'A++'
      },
      // Panolar-Sigorta (Buat Çıkışlı Contalar)
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
        shrink_measurement: '46x61x37 cm',
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
        shrink_measurement: '46x61x37 cm',
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
          protection: 'IP44',
          temperature_range: '-20°C / +60°C'
        },
        features: ['14 çıkışlı conta', 'Büyük kapasiteli tasarım', 'Endüstriyel kullanım'],
        applications: ['Büyük ofis binaları', 'Alışveriş merkezleri', 'Fabrika ana dağıtım'],
        dimensions: '180x270x100 mm',
        weight: 17.65,
        shrink_volume: 0.141,
        shrink_measurement: '62x57x40 cm',
        quantity_per_box: 2,
        quantity_per_shrink: 24,
        brand: 'IŞILDAR',
        warranty_period: 24,
        min_order_quantity: 2
      },
      {
        sku: '2223',
        category_id: categories.find(c => c.slug === 'panolar-sigorta')?.id,
        product_type: 'variant',
        status: 'active',
        featured: true,
        sort_order: 4,
        specifications: {
          material: 'ABS Plastik',
          voltage: '250V AC',
          protection: 'IP44',
          temperature_range: '-20°C / +60°C',
          cover_type: 'Transparent'
        },
        features: ['14 çıkışlı conta', 'Şeffaf kapak', 'Modern tasarım', 'İçerik görünürlüğü'],
        applications: ['Modern ofis binaları', 'Showroom tesisatları', 'Prestijli projeler'],
        dimensions: '180x270x100 mm',
        weight: 17.65,
        shrink_volume: 0.141,
        shrink_measurement: '62x57x40 cm',
        quantity_per_box: 2,
        quantity_per_shrink: 24,
        brand: 'IŞILDAR',
        warranty_period: 24,
        min_order_quantity: 2
      },
      {
        sku: '2213',
        category_id: categories.find(c => c.slug === 'panolar-sigorta')?.id,
        product_type: 'simple',
        status: 'active',
        featured: false,
        sort_order: 5,
        specifications: {
          material: 'ABS Plastik',
          voltage: '250V AC',
          protection: 'IP44',
          temperature_range: '-20°C / +60°C',
          shape: 'Round'
        },
        features: ['Yuvarlak tasarım', 'Kompakt boyut', 'Estetik görünüm'],
        applications: ['Dekoratif projeler', 'Özel tasarım alanlar', 'Mimari detaylar'],
        dimensions: 'Ø 90 mm',
        weight: 18.00,
        shrink_volume: 0.094,
        shrink_measurement: '36x72.5x36 cm',
        quantity_per_box: 24,
        quantity_per_shrink: 240,
        brand: 'IŞILDAR',
        warranty_period: 24,
        min_order_quantity: 24
      },
      // Bahçe Armatürleri
      {
        sku: 'BA-001',
        category_id: categories.find(c => c.slug === 'bahce-armaturleri')?.id,
        product_type: 'simple',
        status: 'active',
        featured: true,
        sort_order: 1,
        specifications: {
          power: '12W',
          voltage: '220-240V AC',
          luminous_flux: '1200 lm',
          color_temperature: '3000K',
          protection: 'IP65',
          material: 'Aluminum + PC'
        },
        features: ['Su geçirmez', 'Dış mekan kullanımı', 'LED teknolojisi'],
        applications: ['Bahçe', 'Park', 'Dış mekan aydınlatma'],
        dimensions: '150x150x200 mm',
        weight: 1.2,
        brand: 'IŞILDAR',
        warranty_period: 24,
        min_order_quantity: 1
      },
      {
        sku: 'BA-002',
        category_id: categories.find(c => c.slug === 'bahce-armaturleri')?.id,
        product_type: 'simple',
        status: 'active',
        featured: false,
        sort_order: 2,
        specifications: {
          power: '6W',
          voltage: '220-240V AC',
          luminous_flux: '600 lm',
          color_temperature: '4000K',
          protection: 'IP65',
          material: 'Stainless Steel'
        },
        features: ['Paslanmaz çelik', 'Zemin spot', 'Dayanıklı yapı'],
        applications: ['Bahçe yolu', 'Peyzaj aydınlatma', 'Dekoratif aydınlatma'],
        dimensions: 'Ø 120x80 mm',
        weight: 0.8,
        brand: 'IŞILDAR',
        warranty_period: 24,
        min_order_quantity: 1
      },
      // Duvar Aplikleri
      {
        sku: 'DA-001',
        category_id: categories.find(c => c.slug === 'duvar-aplikleri')?.id,
        product_type: 'simple',
        status: 'active',
        featured: true,
        sort_order: 1,
        specifications: {
          power: '8W',
          voltage: '220-240V AC',
          luminous_flux: '800 lm',
          color_temperature: '3000K',
          protection: 'IP44',
          material: 'Aluminum'
        },
        features: ['Modern tasarım', 'Yukarı-aşağı ışık', 'Ayarlanabilir açı'],
        applications: ['Duvar aydınlatma', 'Dekoratif aydınlatma', 'Vurgu aydınlatma'],
        dimensions: '100x200x80 mm',
        weight: 0.6,
        brand: 'IŞILDAR',
        warranty_period: 24,
        min_order_quantity: 1
      }
    ];

    // Add products one by one
    for (const product of products) {
      console.log(`Adding product: ${product.sku}`);
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select();

      if (error) {
        console.error(`❌ Error adding ${product.sku}:`, error);
      } else {
        console.log(`✅ Added ${product.sku}:`, data);
      }
    }

    // Add translations for products
    console.log('📝 Adding product translations...');
    
    const productTranslations = [
      // Anahtar Priz
      { key: 'product.AP-001.name', value: 'Tekli Anahtar Premium' },
      { key: 'product.AP-001.description', value: 'Yüksek kaliteli ABS plastikten üretilen tekli anahtar. Modern tasarım ve uzun ömürlü kullanım.' },
      { key: 'product.AP-002.name', value: 'İkili Dimmer Anahtar' },
      { key: 'product.AP-002.description', value: 'Dimmer özellikli ikili anahtar. Işık şiddetini ayarlayabilir, enerji tasarrufu sağlar.' },
      
      // Bant Tipi
      { key: 'product.BT-001.name', value: 'Endüstriyel LED Bant Armatür 36W' },
      { key: 'product.BT-001.description', value: 'Yüksek verimli LED teknolojisi ile endüstriyel alanlar için ideal aydınlatma çözümü.' },
      { key: 'product.BT-002.name', value: 'Ofis LED Bant Armatür 18W' },
      { key: 'product.BT-002.description', value: 'Ofis ve ticari alanlar için kompakt LED bant armatür. Enerji tasarruflu ve modern.' },
      
      // LED Ürünler
      { key: 'product.LED-001.name', value: 'LED Panel 60x60 40W' },
      { key: 'product.LED-001.description', value: 'Yüksek kaliteli LED panel. Ofis ve ticari alanlar için ideal, homojen ışık dağılımı.' },
      { key: 'product.LED-002.name', value: 'LED Panel 30x30 20W' },
      { key: 'product.LED-002.description', value: 'Kompakt LED panel. Sıcak beyaz ışık ile rahat ve konforlu aydınlatma sağlar.' },
      
      // Buat Çıkışlı Contalar
      { key: 'product.2210.name', value: '110x110x70 Buat (8 çıkışlı contali)' },
      { key: 'product.2210.description', value: 'Kompakt boyutlarda 8 çıkışlı buat conta. Küçük ve orta ölçekli projelerde ideal kullanım.' },
      { key: 'product.2211.name', value: '110x180x70 Buat (10 çıkışlı contali)' },
      { key: 'product.2211.description', value: 'Orta boyutlarda 10 çıkışlı buat conta. Daha fazla bağlantı noktası gereken projeler için.' },
      { key: 'product.2212.name', value: '180x270x100 Buat (14 çıkışlı contali)' },
      { key: 'product.2212.description', value: 'Büyük boyutlarda 14 çıkışlı buat conta. Yoğun elektrik bağlantısı gereken büyük projeler için.' },
      { key: 'product.2223.name', value: '180x270x100 Şeffaf Kapak (14 çıkışlı contali)' },
      { key: 'product.2223.description', value: 'Şeffaf kapaklı 14 çıkışlı buat conta. İçeriği görülebilir tasarım ile modern estetik.' },
      { key: 'product.2213.name', value: 'Ø 90 Yuvarlak Buat' },
      { key: 'product.2213.description', value: 'Yuvarlak tasarımlı özel buat conta. Farklı estetik tercihler için alternatif çözüm.' },
      
      // Bahçe Armatürleri
      { key: 'product.BA-001.name', value: 'Bahçe Direği LED 12W' },
      { key: 'product.BA-001.description', value: 'Su geçirmez bahçe direği. LED teknolojisi ile enerji tasarruflu dış mekan aydınlatması.' },
      { key: 'product.BA-002.name', value: 'Zemin Spot LED 6W' },
      { key: 'product.BA-002.description', value: 'Paslanmaz çelik zemin spot. Bahçe yolu ve peyzaj aydınlatması için ideal.' },
      
      // Duvar Aplikleri
      { key: 'product.DA-001.name', value: 'Modern Duvar Aplik LED 8W' },
      { key: 'product.DA-001.description', value: 'Modern tasarımlı duvar aplik. Yukarı-aşağı ışık ile dekoratif aydınlatma sağlar.' }
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

    console.log('✅ Product translations added');

    // Check final counts
    const { data: finalProducts } = await supabase
      .from('products')
      .select('*');

    const { data: finalCategories } = await supabase
      .from('categories')
      .select('*');

    console.log('🎉 Final counts:');
    console.log(`Products: ${finalProducts?.length || 0}`);
    console.log(`Categories: ${finalCategories?.length || 0}`);

    console.log('✅ Database population completed!');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

addProducts();