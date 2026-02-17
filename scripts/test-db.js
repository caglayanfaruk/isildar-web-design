import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

async function testAndPopulate() {
  try {
    // Test connection
    console.log('🔗 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('languages')
      .select('count(*)', { count: 'exact' });

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }

    console.log('✅ Database connected successfully');
    console.log('📊 Current languages count:', testData);

    // Check if data already exists
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('*');

    if (existingCategories && existingCategories.length > 0) {
      console.log('✅ Categories already exist:', existingCategories.length);
      return;
    }

    console.log('📝 Adding categories...');

    // Add categories one by one to see which fails
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
      }
    ];

    for (const category of categories) {
      console.log(`Adding category: ${category.slug}`);
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select();

      if (error) {
        console.error(`❌ Error adding ${category.slug}:`, error);
      } else {
        console.log(`✅ Added ${category.slug}:`, data);
      }
    }

    // Check final count
    const { data: finalCategories } = await supabase
      .from('categories')
      .select('*');

    console.log('🎉 Final categories count:', finalCategories?.length);

    // Test languages
    console.log('📝 Testing languages...');
    const { data: languages } = await supabase
      .from('languages')
      .select('*');

    console.log('🌍 Languages count:', languages?.length);

    if (!languages || languages.length === 0) {
      console.log('Adding default language...');
      const { data: newLang, error: langError } = await supabase
        .from('languages')
        .insert([{
          code: 'tr',
          name: 'Turkish',
          native_name: 'Türkçe',
          flag: '🇹🇷',
          is_default: true,
          is_active: true,
          sort_order: 1
        }])
        .select();

      if (langError) {
        console.error('❌ Language error:', langError);
      } else {
        console.log('✅ Language added:', newLang);
      }
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testAndPopulate();