import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testVariant() {
  try {
    console.log('Testing variant fetch for SKU: test');

    const { data: variant, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        product:products(
          id,
          sku,
          brand,
          model,
          category_id
        )
      `)
      .eq('sku', 'test')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (!variant) {
      console.log('No variant found');
      return;
    }

    console.log('\nVariant found:', {
      id: variant.id,
      sku: variant.sku,
      product_id: variant.product_id,
      product: variant.product
    });

    if (variant.product?.category_id) {
      console.log('\nFetching category...');
      const { data: category, error: catError } = await supabase
        .from('categories')
        .select('id, variant_fields')
        .eq('id', variant.product.category_id)
        .maybeSingle();

      if (catError) {
        console.error('Category error:', catError);
      } else {
        console.log('Category:', category);
      }
    }

    console.log('\nFetching product translation...');
    const { data: trans, error: transError } = await supabase
      .from('product_translations')
      .select('*')
      .eq('product_id', variant.product_id)
      .eq('language_code', 'tr')
      .maybeSingle();

    if (transError) {
      console.error('Translation error:', transError);
    } else {
      console.log('Translation:', trans);
    }

  } catch (error) {
    console.error('Exception:', error);
  }
}

testVariant();
